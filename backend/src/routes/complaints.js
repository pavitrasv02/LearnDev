const express = require("express");
const { body } = require("express-validator");
const {
  createComplaint,
  getMyComplaints,
  replyToComplaint,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();
router.use(protect);

router.get("/", getMyComplaints);
router.get("/mine", getMyComplaints); // alias used by Support.jsx

router.post(
  "/",
  [
    body("type").isIn(["complaint", "bug_report", "course_issue", "video_issue", "pdf_issue", "feedback", "feature_request"]).withMessage("Invalid type"),
    body("subject").trim().notEmpty().withMessage("Subject required").isLength({ max: 200 }),
    body("description").trim().notEmpty().withMessage("Description required").isLength({ max: 4000 }),
  ],
  validate,
  createComplaint
);

router.post(
  "/:id/reply",
  [body("message").trim().notEmpty().withMessage("Message required")],
  validate,
  replyToComplaint
);

module.exports = router;
