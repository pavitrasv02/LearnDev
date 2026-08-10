const mongoose = require("mongoose");

const replySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 2000 },
    isAdmin: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const complaintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["complaint", "bug_report", "course_issue", "video_issue", "pdf_issue", "feedback", "feature_request"],
      required: true,
    },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, required: true, maxlength: 4000 },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", default: null },
    status: {
      type: String,
      enum: ["submitted", "under_review", "assigned", "resolved", "closed"],
      default: "submitted",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "medium",
    },
    replies: [replySchema],
    screenshotUrl: { type: String, default: "" },
    resolvedAt: { type: Date },
  },
  { timestamps: true }
);

complaintSchema.index({ user: 1, createdAt: -1 });
complaintSchema.index({ status: 1, priority: -1 });

module.exports = mongoose.model("Complaint", complaintSchema);
