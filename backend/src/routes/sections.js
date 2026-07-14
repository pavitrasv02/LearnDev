const express = require("express");
const { body } = require("express-validator");
const {
  getSections,
  createSection,
  updateSection,
  deleteSection,
  reorderSections,
  createLesson,
  updateLesson,
  deleteLesson,
  getLesson,
} = require("../controllers/sectionController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router({ mergeParams: true }); // inherits :courseId

// ── Sections ───────────────────────────────────────────────────────────────
router.get("/", getSections);   // public — used by CourseDetail + LearnPage

router.post(
  "/",
  protect,
  authorize("admin", "instructor"),
  [body("title").trim().notEmpty().withMessage("Section title is required")],
  validate,
  createSection
);

router.put("/reorder", protect, authorize("admin", "instructor"), reorderSections);

router.put(
  "/:sectionId",
  protect,
  authorize("admin", "instructor"),
  updateSection
);

router.delete(
  "/:sectionId",
  protect,
  authorize("admin", "instructor"),
  deleteSection
);

// ── Lessons ────────────────────────────────────────────────────────────────
router.get("/:sectionId/lessons/:lessonId", protect, getLesson);

router.post(
  "/:sectionId/lessons",
  protect,
  authorize("admin", "instructor"),
  [body("title").trim().notEmpty().withMessage("Lesson title is required")],
  validate,
  createLesson
);

router.put(
  "/:sectionId/lessons/:lessonId",
  protect,
  authorize("admin", "instructor"),
  updateLesson
);

router.delete(
  "/:sectionId/lessons/:lessonId",
  protect,
  authorize("admin", "instructor"),
  deleteLesson
);

module.exports = router;
