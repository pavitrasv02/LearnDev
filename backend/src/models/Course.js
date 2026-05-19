const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: "" },
    instructor: { type: String, required: true },
    category: {
      type: String,
      enum: ["Programming", "DevOps", "Cloud", "Data Science", "Design", "Business"],
      required: true,
    },
    level: { type: String, enum: ["Beginner", "Intermediate", "Advanced"], default: "Beginner" },
    price: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    thumbnail: { type: String, default: "" },
    duration: { type: String, default: "10 hours" },
    lessons: { type: Number, default: 20 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
    studentsCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    curriculum: [
      {
        title: String,
        lessons: [{ title: String, duration: String }],
      },
    ],
    featured: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

courseSchema.index({ title: "text", description: "text", category: 1 });

module.exports = mongoose.model("Course", courseSchema);
