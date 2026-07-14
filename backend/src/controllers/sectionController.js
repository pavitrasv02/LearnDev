const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Course = require("../models/Course");
const { deleteCache } = require("../utils/cache");
const logger = require("../config/logger");

// ── Get all sections (with full lessons) for a course ─────────────────────
exports.getSections = async (req, res, next) => {
  try {
    const sections = await Section.find({ course: req.params.courseId })
      .populate("lessons")
      .sort("order");
    res.json({ success: true, sections });
  } catch (err) {
    next(err);
  }
};

// ── Create section ────────────────────────────────────────────────────────
exports.createSection = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Section title is required" });
    }
    const sectionCount = await Section.countDocuments({ course: req.params.courseId });
    const section = await Section.create({
      course: req.params.courseId,
      title: title.trim(),
      order: sectionCount,
    });
    await Course.findByIdAndUpdate(req.params.courseId, {
      $push: { sections: section._id },
    });
    await deleteCache("courses:*");
    await deleteCache(`course:*`);
    logger.info("Section created", { sectionId: section._id, courseId: req.params.courseId });
    res.status(201).json({ success: true, section });
  } catch (err) {
    next(err);
  }
};

// ── Update section ────────────────────────────────────────────────────────
exports.updateSection = async (req, res, next) => {
  try {
    const { title } = req.body;
    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ success: false, message: "Section title cannot be empty" });
    }
    const section = await Section.findByIdAndUpdate(
      req.params.sectionId,
      { ...req.body, ...(title ? { title: title.trim() } : {}) },
      { new: true, runValidators: true }
    );
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    await deleteCache(`course:*`);
    res.json({ success: true, section });
  } catch (err) {
    next(err);
  }
};

// ── Delete section (cascades to its lessons) ──────────────────────────────
exports.deleteSection = async (req, res, next) => {
  try {
    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    const lessonCount = section.lessons?.length || 0;
    await Lesson.deleteMany({ section: section._id });
    await Course.findByIdAndUpdate(section.course, {
      $pull: { sections: section._id },
      $inc: { lessons: -lessonCount },
    });
    await section.deleteOne();
    await deleteCache("courses:*");
    await deleteCache(`course:*`);
    logger.info("Section deleted", { sectionId: section._id, courseId: section.course });
    res.json({ success: true, message: "Section deleted" });
  } catch (err) {
    next(err);
  }
};

// ── Reorder sections (move up / down or arbitrary order) ─────────────────
// Body: { orderedIds: ["sectionId1", "sectionId2", ...] }
exports.reorderSections = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
      return res.status(400).json({ success: false, message: "orderedIds array required" });
    }
    const updates = orderedIds.map((id, index) =>
      Section.findByIdAndUpdate(id, { order: index }, { new: true })
    );
    await Promise.all(updates);
    await deleteCache(`course:*`);
    res.json({ success: true, message: "Sections reordered" });
  } catch (err) {
    next(err);
  }
};

// ── Create lesson ─────────────────────────────────────────────────────────
exports.createLesson = async (req, res, next) => {
  try {
    const { title, type } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ success: false, message: "Lesson title is required" });
    }
    const validTypes = ["video", "pdf", "notes", "resource"];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: `Invalid type. Must be one of: ${validTypes.join(", ")}` });
    }

    const section = await Section.findById(req.params.sectionId);
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });

    const lessonCount = await Lesson.countDocuments({ section: section._id });
    const lesson = await Lesson.create({
      ...req.body,
      title: title.trim(),
      section: section._id,
      course: section.course,
      order: req.body.order ?? lessonCount,
    });
    await Section.findByIdAndUpdate(section._id, { $push: { lessons: lesson._id } });
    await Course.findByIdAndUpdate(section.course, { $inc: { lessons: 1 } });
    await deleteCache("courses:*");
    await deleteCache(`course:*`);
    logger.info("Lesson created", { lessonId: lesson._id, sectionId: section._id });
    res.status(201).json({ success: true, lesson });
  } catch (err) {
    next(err);
  }
};

// ── Update lesson ─────────────────────────────────────────────────────────
exports.updateLesson = async (req, res, next) => {
  try {
    const { title, type } = req.body;
    if (title !== undefined && !title?.trim()) {
      return res.status(400).json({ success: false, message: "Lesson title cannot be empty" });
    }
    const validTypes = ["video", "pdf", "notes", "resource"];
    if (type && !validTypes.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid lesson type" });
    }
    const lesson = await Lesson.findByIdAndUpdate(
      req.params.lessonId,
      { ...req.body, ...(title ? { title: title.trim() } : {}) },
      { new: true, runValidators: true }
    );
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
    await deleteCache(`course:*`);
    res.json({ success: true, lesson });
  } catch (err) {
    next(err);
  }
};

// ── Delete lesson ─────────────────────────────────────────────────────────
exports.deleteLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
    await Section.findByIdAndUpdate(lesson.section, { $pull: { lessons: lesson._id } });
    await Course.findByIdAndUpdate(lesson.course, { $inc: { lessons: -1 } });
    await lesson.deleteOne();
    await deleteCache(`course:*`);
    logger.info("Lesson deleted", { lessonId: lesson._id });
    res.json({ success: true, message: "Lesson deleted" });
  } catch (err) {
    next(err);
  }
};

// ── Get single lesson ─────────────────────────────────────────────────────
exports.getLesson = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
    res.json({ success: true, lesson });
  } catch (err) {
    next(err);
  }
};
