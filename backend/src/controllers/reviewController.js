const Review = require("../models/Review");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const logger = require("../config/logger");

// ── Get reviews for a course ───────────────────────────────────────────────
exports.getCourseReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = "recent" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const sortMap = {
      recent: { createdAt: -1 },
      helpful: { "helpfulVotes.length": -1, createdAt: -1 },
      highest: { rating: -1 },
      lowest: { rating: 1 },
    };
    const sortOpts = sortMap[sort] || sortMap.recent;

    const [reviews, total] = await Promise.all([
      Review.find({ course: req.params.courseId, reported: false })
        .populate("user", "name avatar")
        .sort(sortOpts)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Review.countDocuments({ course: req.params.courseId, reported: false }),
    ]);

    // Rating distribution (1–5)
    const distribution = await Review.aggregate([
      { $match: { course: require("mongoose").Types.ObjectId.createFromHexString(req.params.courseId), reported: false } },
      { $group: { _id: "$rating", count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    distribution.forEach((d) => { dist[d._id] = d.count; });

    const avgRating = total > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    // Add helpful vote counts and whether current user has voted
    const userId = req.user?._id?.toString();
    const enriched = reviews.map((r) => ({
      ...r,
      helpfulCount: r.helpfulVotes?.length || 0,
      isHelpful: userId ? r.helpfulVotes?.some((v) => v.toString() === userId) : false,
    }));

    // Viewer's own review
    let myReview = null;
    if (req.user) {
      myReview = await Review.findOne({ course: req.params.courseId, user: req.user._id }).lean();
    }

    res.json({ success: true, reviews: enriched, total, page: Number(page), pages: Math.ceil(total / Number(limit)), distribution: dist, avgRating, myReview });
  } catch (err) {
    next(err);
  }
};

// ── Create review ─────────────────────────────────────────────────────────
exports.createReview = async (req, res, next) => {
  try {
    const { rating, title, body } = req.body;

    // Must be enrolled
    const enrollment = await Enrollment.findOne({ user: req.user._id, course: req.params.courseId });
    if (!enrollment) {
      return res.status(403).json({ success: false, message: "You must be enrolled to leave a review" });
    }

    // Prevent duplicate
    const existing = await Review.findOne({ course: req.params.courseId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "You have already reviewed this course" });
    }

    const review = await Review.create({
      course: req.params.courseId,
      user: req.user._id,
      rating,
      title: title || "",
      body,
    });

    // Update course average rating
    await updateCourseRating(req.params.courseId);

    const populated = await Review.findById(review._id).populate("user", "name avatar").lean();
    logger.info("Review created", { reviewId: review._id, courseId: req.params.courseId, userId: req.user._id });
    res.status(201).json({ success: true, review: populated });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "You have already reviewed this course" });
    }
    next(err);
  }
};

// ── Update review ─────────────────────────────────────────────────────────
exports.updateReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const { rating, title, body } = req.body;
    if (rating) review.rating = rating;
    if (title !== undefined) review.title = title;
    if (body) review.body = body;
    await review.save();

    await updateCourseRating(review.course);
    const populated = await Review.findById(review._id).populate("user", "name avatar").lean();
    res.json({ success: true, review: populated });
  } catch (err) {
    next(err);
  }
};

// ── Delete review ─────────────────────────────────────────────────────────
exports.deleteReview = async (req, res, next) => {
  try {
    const query = req.user.role === "admin"
      ? { _id: req.params.reviewId }
      : { _id: req.params.reviewId, user: req.user._id };

    const review = await Review.findOneAndDelete(query);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    await updateCourseRating(review.course);
    res.json({ success: true, message: "Review deleted" });
  } catch (err) {
    next(err);
  }
};

// ── Toggle helpful vote ────────────────────────────────────────────────────
exports.voteHelpful = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });

    const userId = req.user._id;
    const idx = review.helpfulVotes.findIndex((v) => v.toString() === userId.toString());
    if (idx === -1) {
      review.helpfulVotes.push(userId);
    } else {
      review.helpfulVotes.splice(idx, 1);
    }
    await review.save();
    res.json({ success: true, helpfulCount: review.helpfulVotes.length, isHelpful: idx === -1 });
  } catch (err) {
    next(err);
  }
};

// ── Report review ─────────────────────────────────────────────────────────
exports.reportReview = async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.reviewId,
      { reported: true, reportReason: req.body.reason || "" },
      { new: true }
    );
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    res.json({ success: true, message: "Review reported" });
  } catch (err) {
    next(err);
  }
};

// ── Helper: recalculate course average rating ─────────────────────────────
async function updateCourseRating(courseId) {
  const agg = await Review.aggregate([
    { $match: { course: typeof courseId === "string" ? require("mongoose").Types.ObjectId.createFromHexString(courseId) : courseId, reported: false } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  const avg = agg[0]?.avg ? Math.round(agg[0].avg * 10) / 10 : 0;
  await Course.findByIdAndUpdate(courseId, { rating: avg });
}
