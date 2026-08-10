const mongoose = require("mongoose");

// Bookmarks: user can bookmark a course or a specific lesson
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: "Lesson", default: null },
  },
  { timestamps: true }
);

bookmarkSchema.index({ user: 1, course: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("Bookmark", bookmarkSchema);
