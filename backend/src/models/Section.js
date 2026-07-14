const mongoose = require("mongoose");

/**
 * Section — a logical grouping of lessons within a course.
 * Sections are ordered and can be expanded/collapsed in the UI.
 */
const sectionSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },      // display order within the course
    lessons: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lesson" }],
  },
  { timestamps: true }
);

sectionSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model("Section", sectionSchema);
