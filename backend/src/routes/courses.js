const express = require("express");
const { body } = require("express-validator");
const {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getStats,
} = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.get("/stats", getStats);
router.get("/", getCourses);
router.get("/:slug", getCourse);

router.post(
  "/",
  protect,
  authorize("admin"),
  [
    body("title").notEmpty(),
    body("slug").notEmpty(),
    body("description").notEmpty(),
    body("instructor").notEmpty(),
    body("category").notEmpty(),
  ],
  validate,
  createCourse
);

router.put("/:id", protect, authorize("admin"), updateCourse);
router.delete("/:id", protect, authorize("admin"), deleteCourse);

module.exports = router;
