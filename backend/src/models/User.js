const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },

    // Extended role enum — "user" kept as alias for "student" for backward compat
    role: {
      type: String,
      enum: ["user", "student", "instructor", "admin"],
      default: "student",
    },

    isBlocked: { type: Boolean, default: false },
    avatar: { type: String, default: "" },
    bio: { type: String, default: "" },
    enrolledCourses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Course" }],

    // ── Email verification ────────────────────────────────────────────────
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },

    // ── Password reset ────────────────────────────────────────────────────
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ── Instance methods ──────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/**
 * Generate a random token, store its SHA-256 hash on the document,
 * and return the raw token (sent to the user by email).
 */
userSchema.methods.createPasswordResetToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  this.passwordResetToken = crypto.createHash("sha256").update(raw).digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return raw;
};

userSchema.methods.createEmailVerificationToken = function () {
  const raw = crypto.randomBytes(32).toString("hex");
  this.emailVerificationToken = crypto.createHash("sha256").update(raw).digest("hex");
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return raw;
};

// Normalise legacy "user" role to "student" on reads
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  if (obj.role === "user") obj.role = "student";
  return obj;
};

module.exports = mongoose.model("User", userSchema);
