const aiService = require("../services/aiService");
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const Enrollment = require("../models/Enrollment");
const Certificate = require("../models/Certificate");
const Bookmark = require("../models/Bookmark");
const logger = require("../config/logger");

// ── Helper: resolve lesson context ───────────────────────────────────────
async function resolveContext(courseId, lessonId) {
  const [course, lesson] = await Promise.all([
    courseId ? Course.findById(courseId).lean() : null,
    lessonId ? Lesson.findById(lessonId).lean() : null,
  ]);
  let section = null;
  if (lesson?.section) {
    section = await Section.findById(lesson.section).lean();
  }
  return { course, lesson, section };
}

// ── POST /api/ai/ask ──────────────────────────────────────────────────────
exports.askAI = async (req, res, next) => {
  try {
    const { question, courseId, lessonId } = req.body;
    if (!question?.trim()) {
      return res.status(400).json({ success: false, message: "Question is required" });
    }

    const { course, lesson, section } = await resolveContext(courseId, lessonId);
    const enrollment = courseId
      ? await Enrollment.findOne({ user: req.user._id, course: courseId }).lean()
      : null;

    logger.info("AI ask", { userId: req.user._id, courseId, lessonId, question: question.slice(0, 80) });

    const result = await aiService.askAI({ question, course, section, lesson, enrollment });
    res.json({ success: true, answer: result.text, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── POST /api/ai/summary ──────────────────────────────────────────────────
exports.generateSummary = async (req, res, next) => {
  try {
    const { courseId, lessonId } = req.body;
    const { course, lesson, section } = await resolveContext(courseId, lessonId);
    const result = await aiService.generateSummary({ course, section, lesson });
    res.json({ success: true, summary: result.text, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── POST /api/ai/quiz ─────────────────────────────────────────────────────
exports.generateQuiz = async (req, res, next) => {
  try {
    const { courseId, lessonId, difficulty = "medium", count = 5, scope = "lesson" } = req.body;
    const { course, lesson, section } = await resolveContext(courseId, lessonId);
    const result = await aiService.generateQuiz({ course, section, lesson, difficulty, count: Math.min(count, 10), scope });
    res.json({ success: true, questions: result.questions, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── POST /api/ai/flashcards ───────────────────────────────────────────────
exports.generateFlashcards = async (req, res, next) => {
  try {
    const { courseId, lessonId, count = 8 } = req.body;
    const { course, lesson, section } = await resolveContext(courseId, lessonId);
    const result = await aiService.generateFlashcards({ course, section, lesson, count: Math.min(count, 20) });
    res.json({ success: true, flashcards: result.flashcards, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── GET /api/ai/mentor ────────────────────────────────────────────────────
exports.getMentorReport = async (req, res, next) => {
  try {
    const [enrollments, certificates] = await Promise.all([
      Enrollment.find({ user: req.user._id }).populate("course", "title category level").lean(),
      Certificate.find({ user: req.user._id }).lean(),
    ]);

    const result = await aiService.generateMentorReport({
      studentName: req.user.name,
      enrollments,
      certificates,
      totalStudyMinutes: enrollments.length * 120,
    });

    res.json({ success: true, report: result.report, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── GET /api/ai/interview-score ───────────────────────────────────────────
exports.getInterviewScore = async (req, res, next) => {
  try {
    const [enrollments, certificates] = await Promise.all([
      Enrollment.find({ user: req.user._id }).populate("course", "title category level").lean(),
      Certificate.find({ user: req.user._id }).lean(),
    ]);

    const result = await aiService.generateInterviewScore({
      studentName: req.user.name,
      enrollments,
      certificates,
    });

    res.json({ success: true, data: result.data, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};

// ── GET /api/ai/recommendations ───────────────────────────────────────────
exports.getRecommendations = async (req, res, next) => {
  try {
    const { category } = req.query;
    const [enrollments, bookmarks] = await Promise.all([
      Enrollment.find({ user: req.user._id }).populate("course", "title category").lean(),
      Bookmark.find({ user: req.user._id, lesson: null }).populate("course", "title category").lean(),
    ]);

    const result = await aiService.generateRecommendations({ enrollments, bookmarks, category });
    res.json({ success: true, data: result.data, cached: result.cached });
  } catch (err) {
    if (err.message?.includes("GEMINI_API_KEY") || err.message?.includes("API key") || err.message?.includes("rate limit") || err.message?.includes("unavailable")) {
      return res.status(503).json({ success: false, message: err.message });
    }
    next(err);
  }
};
