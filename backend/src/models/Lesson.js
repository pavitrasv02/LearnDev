const mongoose = require("mongoose");

/**
 * Lesson — the atomic unit of learning within a Section.
 * Supports: video URL, PDF URL, markdown notes, downloadable resource.
 */
const lessonSchema = new mongoose.Schema(
  {
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Section",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,          // fast lookup of all lessons for a course
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    order: { type: Number, default: 0 },
    type: {
      type: String,
      enum: ["video", "pdf", "notes", "resource"],
      default: "video",
    },
    content: { type: String, default: "" },       // video URL / PDF URL / markdown text
    resourceUrl: { type: String, default: "" },   // downloadable file URL
    duration: { type: Number, default: 0 },       // in seconds (for video)
    isPreview: { type: Boolean, default: false }, // visible without enrollment
  },
  { timestamps: true }
);

lessonSchema.index({ course: 1, order: 1 });

module.exports = mongoose.model("Lesson", lessonSchema);
