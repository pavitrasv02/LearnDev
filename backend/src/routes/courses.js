const express = require("express");
const { body } = require("express-validator");
const {
  getCourses,
  getCourse,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  publishCourse,
  getStats,
} = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const sectionRoutes = require("./sections");

const router = express.Router();

router.get("/stats", getStats);
router.get("/", getCourses);
router.get("/by-id/:id", protect, authorize("admin", "instructor"), getCourseById);
router.get("/:slug", getCourse);

router.post(
  "/",
  protect,
  authorize("admin", "instructor"),
  [
    body("title").notEmpty().withMessage("Title required"),
    body("slug").notEmpty().withMessage("Slug required"),
    body("description").notEmpty().withMessage("Description required"),
    body("instructor").notEmpty().withMessage("Instructor required"),
    body("category").notEmpty().withMessage("Category required"),
  ],
  validate,
  createCourse
);

router.put("/:id", protect, authorize("admin", "instructor"), updateCourse);
router.patch("/:id/publish", protect, authorize("admin", "instructor"), publishCourse);
router.delete("/:id", protect, authorize("admin", "instructor"), deleteCourse);

// Mount section routes under /api/courses/:courseId/sections
router.use("/:courseId/sections", sectionRoutes);

module.exports = router;
