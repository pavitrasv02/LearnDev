const express = require("express");
const {
  enroll,
  getMyEnrollments,
  getEnrollment,
  updateProgress,
  markLesson,
} = require("../controllers/enrollmentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);

router.get("/", getMyEnrollments);
router.post("/:courseId", enroll);
router.get("/:courseId", getEnrollment);
router.patch("/:courseId/progress", updateProgress);       // legacy % update
router.patch("/:courseId/lessons", markLesson);            // new: mark lesson complete/incomplete

module.exports = router;
