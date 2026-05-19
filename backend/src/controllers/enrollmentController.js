const Enrollment = require("../models/Enrollment");
const Course = require("../models/Course");
const User = require("../models/User");

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

    res.status(201).json({ success: true, enrollment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: "Already enrolled" });
    }
    next(err);
  }
};

exports.getMyEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .populate("course", "title slug thumbnail category level duration progress")
      .sort({ enrolledAt: -1 });
    res.json({ success: true, enrollments });
  } catch (err) {
    next(err);
  }
};

exports.updateProgress = async (req, res, next) => {
  try {
    const { progress } = req.body;
    const enrollment = await Enrollment.findOneAndUpdate(
      { user: req.user._id, course: req.params.courseId },
      { progress, status: progress >= 100 ? "completed" : "active", completedAt: progress >= 100 ? Date.now() : undefined },
      { new: true }
    );
    if (!enrollment) return res.status(404).json({ success: false, message: "Enrollment not found" });
    res.json({ success: true, enrollment });
  } catch (err) {
    next(err);
  }
};
