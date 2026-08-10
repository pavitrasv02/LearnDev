const express = require("express");
const rateLimit = require("express-rate-limit");
const { body } = require("express-validator");
const {
  askAI,
  generateSummary,
  generateQuiz,
  generateFlashcards,
  getMentorReport,
  getInterviewScore,
  getRecommendations,
} = require("../controllers/aiController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

// Dedicated rate limiter for AI endpoints (prevent abuse / cost control)
const aiLimiter = rateLimit({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60 * 1000,
  max: Number(process.env.AI_RATE_LIMIT_MAX) || 20,
  message: { success: false, message: "Too many AI requests. Please wait a moment." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(protect);     // all AI routes require authentication
router.use(aiLimiter);   // all AI routes are rate-limited

// ── Chat / Ask AI ─────────────────────────────────────────────────────────
router.post(
  "/ask",
  [body("question").trim().notEmpty().withMessage("Question is required")],
  validate,
  askAI
);

// ── Lesson summary ────────────────────────────────────────────────────────
router.post("/summary", generateSummary);

// ── Quiz generator ────────────────────────────────────────────────────────
router.post("/quiz", generateQuiz);

// ── Flashcard generator ───────────────────────────────────────────────────
router.post("/flashcards", generateFlashcards);

// ── Study mentor report ───────────────────────────────────────────────────
router.get("/mentor", getMentorReport);

// ── Interview readiness score ─────────────────────────────────────────────
router.get("/interview-score", getInterviewScore);

// ── Recommendations ───────────────────────────────────────────────────────
router.get("/recommendations", getRecommendations);

module.exports = router;
