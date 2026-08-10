const Bookmark = require("../models/Bookmark");

// ── Get my bookmarks ──────────────────────────────────────────────────────
exports.getBookmarks = async (req, res, next) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id, lesson: null })
      .populate("course", "title slug thumbnail category level instructor duration rating")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ success: true, bookmarks });
  } catch (err) {
    next(err);
  }
};

// ── Toggle course bookmark ─────────────────────────────────────────────────
exports.toggleBookmark = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const existing = await Bookmark.findOne({ user: req.user._id, course: courseId, lesson: null });
    if (existing) {
      await existing.deleteOne();
      return res.json({ success: true, bookmarked: false });
    }
    await Bookmark.create({ user: req.user._id, course: courseId });
    res.status(201).json({ success: true, bookmarked: true });
  } catch (err) {
    if (err.code === 11000) {
      // Race condition — already exists
      await Bookmark.findOneAndDelete({ user: req.user._id, course: req.params.courseId, lesson: null });
      return res.json({ success: true, bookmarked: false });
    }
    next(err);
  }
};

// ── Check if bookmarked ───────────────────────────────────────────────────
exports.checkBookmark = async (req, res, next) => {
  try {
    const exists = await Bookmark.exists({ user: req.user._id, course: req.params.courseId, lesson: null });
    res.json({ success: true, bookmarked: !!exists });
  } catch (err) {
    next(err);
  }
};
