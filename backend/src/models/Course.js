const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    instructor: { type: String, required: true },
    // Optional: link to the User who created this course (instructor role)
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    category: {
      type: String,
      enum: ["Programming", "DevOps", "Cloud", "Data Science", "Design", "Business"],
      required: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    thumbnail: { type: String, default: "" },
    duration: { type: String, default: "10 hours" },
    // `lessons` field kept for legacy/seed data; actual lessons live in Lesson model
    lessons: { type: Number, default: 0 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    studentsCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    // Legacy flat curriculum — kept for backward-compat with seeded data
    curriculum: [
      {
        title: String,
        lessons: [{ title: String, duration: String }],
      },
    ],
    // Structured Section references (new)
    sections: [{ type: mongoose.Schema.Types.ObjectId, ref: "Section" }],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text", category: 1 });
courseSchema.index({ published: 1, featured: 1 });
courseSchema.index({ category: 1, level: 1 });

module.exports = mongoose.model("Course", courseSchema);
