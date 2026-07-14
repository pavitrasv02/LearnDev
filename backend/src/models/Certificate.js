const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

/**
 * Certificate — issued once when a student completes 100% of a course.
 * Unique constraint on (user, course) prevents duplicates.
 * Public verify endpoint: GET /api/certificates/:code/verify
 */
const certificateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    courseTitle: { type: String, required: true },      // denormalized — survives course edits
    studentName: { type: String, required: true },
    instructorName: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
    verificationCode: {
      type: String,
      unique: true,
      default: () => uuidv4(),
    },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
