const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const Lesson = require("../models/Lesson");
const Certificate = require("../models/Certificate");
const User = require("../models/User");
const { deleteCache } = require("../utils/cache");
const logger = require("../config/logger");

// ── Enroll ─────────────────────────────────────────────────────────────────

exports.enroll = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    const existing = await Enrollment.findOne({ user: req.user._id, course: course._id });
    if (existing) {
      return res.status(400).json({ success: false, message: "Already enrolled" });
    }

    const enrollment = await Enrollment.create({ user: req.user._id, course: course._id });
    await User.findByIdAndUpdate(req.user._id, { $addToSet: { enrolledCourses: course._id } });
    await Course.findByIdAndUpdate(course._id, { $inc: { studentsCount: 1 } });
    await deleteCache(`dashboard:${req.user._id}`);

    logger.info("User enrolled in course", {
      userId: req.user._id,
      courseId: course._id,
      courseTitle: course.title,
    });
    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Already enrolled" });
    }
    next(err);
  }
};

// ── Get My Enrollments ─────────────────────────────────────────────────────

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title slug thumbnail category level duration lessons rating instructor")
      .populate("lastLessonId", "title order")
      .sort({ lastAccessedAt: -1, enrolledAt: -1 });
    res.json({ success: true, enrollments });
  } catch (err) {
    next(err);
  }
};

// ── Get Single Enrollment ─────────────────────────────────────────────────

exports.getEnrollment = async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    })
      .populate("course", "title slug thumbnail category level duration instructor sections")
      .populate("lastLessonId", "title order type");
    if (!enrollment) return res.status(404).json({ success: false, message: "Not enrolled" });
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};

// ── Mark Lesson Complete / Incomplete ─────────────────────────────────────

exports.markLesson = async (req, res, next) => {
  try {
    const { lessonId, completed } = req.body;
    if (!lessonId) return res.status(400).json({ success: false, message: "lessonId required" });

    // Verify lesson belongs to this course
    const lesson = await Lesson.findById(lessonId);
    if (!lesson || lesson.course.toString() !== req.params.courseId) {
      return res.status(400).json({ success: false, message: "Invalid lesson for this course" });
    }

    const enrollment = await Enrollment.findOne({
      user: req.user._id,
      course: req.params.courseId,
    });
    if (!enrollment) return res.status(404).json({ success: false, message: "Not enrolled" });

    const lessonIdStr = lessonId.toString();
    const alreadyDone = enrollment.completedLessons.includes(lessonIdStr);

    if (completed && !alreadyDone) {
      enrollment.completedLessons.push(lessonIdStr);
    } else if (!completed && alreadyDone) {
      enrollment.completedLessons = enrollment.completedLessons.filter((id) => id !== lessonIdStr);
    }

    // Update resume pointer
    enrollment.lastLessonId = lesson._id;
    enrollment.lastAccessedAt = new Date();

    // Recompute progress
    const totalLessons = await Lesson.countDocuments({ course: req.params.courseId });
    const newProgress = totalLessons > 0
      ? Math.min(Math.round((enrollment.completedLessons.length / totalLessons) * 100), 100)
      : 0;
    enrollment.progress = newProgress;

    let certificate = null;
    if (newProgress >= 100 && enrollment.status !== "completed") {
      enrollment.status = "completed";
      enrollment.completedAt = new Date();

      // Generate certificate (idempotent — unique index prevents duplicates)
      const course = await Course.findById(req.params.courseId);
      try {
        certificate = await Certificate.create({
          user: req.user._id,
          course: course._id,
          courseTitle: course.title,
          studentName: req.user.name,
          instructorName: course.instructor,
        });
        logger.info("Certificate issued", {
          userId: req.user._id,
          courseId: course._id,
          certId: certificate._id,
        });
      } catch (dupErr) {
        // Cert already exists (11000) — fetch the existing one
        if (dupErr.code === 11000) {
          certificate = await Certificate.findOne({ user: req.user._id, course: course._id });
        }
      }
    }

    await enrollment.save();
    await deleteCache(`dashboard:${req.user._id}`);

    res.json({
      success: true,
      enrollment,
      progressPercent: enrollment.progress,
      isCompleted: enrollment.status === "completed",
      certificate,
    });
  } catch (err) {
    next(err);
  }
};

// ── Legacy: update progress by percentage (kept for backward compat) ──────

exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user._id, course: req.params.courseId },
      {
        progress,
        lastAccessedAt: new Date(),
        status: progress >= 100 ? "completed" : "active",
        completedAt: progress >= 100 ? new Date() : undefined,
      },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
    await deleteCache(`dashboard:${req.user._id}`);
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};
