const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: "" },
    body: { type: String, trim: true, required: true, maxlength: 2000 },
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reported: { type: Boolean, default: false },
    reportReason: { type: String, default: "" },
  },
  { timestamps: true }
);

// One review per user per course
reviewSchema.index({ course: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("Review", reviewSchema);
