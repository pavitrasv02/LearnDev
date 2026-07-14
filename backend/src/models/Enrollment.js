const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    // Store lesson IDs as strings for backward-compat with existing data,
    // while new entries use ObjectId strings (both are searchable as strings).
    completedLessons: [{ type: String }],
    status: {
      type: String,
      enum: ["active", "completed", "dropped"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    // Resume learning support
    lastLessonId: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", default: null },
    lastAccessedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);
