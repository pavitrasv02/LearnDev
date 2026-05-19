const express = require("express");
const { enroll, getMyEnrollments, updateProgress } = require("../controllers/enrollmentController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", getMyEnrollments);
router.post("/:courseId", enroll);
router.patch("/:courseId/progress", updateProgress);

module.exports = router;
