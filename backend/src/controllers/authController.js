const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { getRedis } = require("../config/redis");
const { sendEmail } = require("../utils/email");
const logger = require("../config/logger");

// ── Token helpers ─────────────────────────────────────────────────────────

const signAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });

const signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES || "7d",
  });

/**
 * Set the refresh token as an httpOnly cookie and return the access token
 * plus a safe user object in the JSON body.
 */
const sendTokenResponse = (user, statusCode, res) => {
  const accessToken = signAccessToken(user._id, user.role);
  const refreshToken = signRefreshToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  };

  res.cookie("refreshToken", refreshToken, cookieOptions);

  res.status(statusCode).json({
    success: true,
    token: accessToken,        // kept as "token" for backward compat with existing frontend
    accessToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role === "user" ? "student" : user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
    },
  });
};

// ── Register ──────────────────────────────────────────────────────────────

exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Only allow student / instructor self-registration; admin must be set by another admin
    const allowedRoles = ["student", "instructor", "user"];
    const assignedRole = allowedRoles.includes(role) ? role : "student";

    const user = await User.create({ name, email, password, role: assignedRole });

    // Generate verification token and send email
    const verifyToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verifyToken}`;
    await sendEmail({
      to: email,
      subject: "Welcome to LearnDev — Verify your email",
      html: `
        <h2>Welcome to LearnDev, ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
        <p>This link expires in 24 hours.</p>
        <p>If you didn't create an account, you can safely ignore this email.</p>
      `,
    });

    logger.info("User registered", { userId: user._id, email, role: assignedRole });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select(
      "+password +isEmailVerified"
    );
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account has been blocked. Contact support." });
    }

    // Store session in Redis (graceful if Redis is down)
    const redis = getRedis();
    if (redis) {
      await redis.setex(
        `session:${user._id}`,
        604800,
        JSON.stringify({ email: user.email, role: user.role })
      );
    }

    logger.info("User logged in", { userId: user._id, email });
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── Refresh Token ─────────────────────────────────────────────────────────

exports.refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: "No refresh token" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    // Validate Redis session is still active
    const redis = getRedis();
    if (redis) {
      const session = await redis.get(`session:${decoded.id}`);
      if (!session) {
        return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
      }
    }

    const user = await User.findById(decoded.id);
    if (!user || user.isBlocked) {
      return res.status(401).json({ success: false, message: "User not found or blocked" });
    }

    // Issue new tokens (rotation)
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

// ── Logout ────────────────────────────────────────────────────────────────

exports.logout = async (req, res) => {
  const redis = getRedis();
  if (redis && req.user) {
    await redis.del(`session:${req.user._id}`);
  }
  // Clear the httpOnly cookie
  res.clearCookie("refreshToken", { httpOnly: true, sameSite: "strict" });
  logger.info("User logged out", { userId: req.user?._id });
  res.json({ success: true, message: "Logged out successfully" });
};

// ── Get Current User ──────────────────────────────────────────────────────

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate(
    "enrolledCourses",
    "title slug thumbnail"
  );
  res.json({ success: true, user });
};

// ── Verify Email ──────────────────────────────────────────────────────────

exports.verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or has expired" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    logger.info("Email verified", { userId: user._id });
    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ── Forgot Password ───────────────────────────────────────────────────────

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // Always return 200 to prevent account enumeration
    if (!user) {
      return res.json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    await sendEmail({
      to: user.email,
      subject: "LearnDev — Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below (valid for 10 minutes):</p>
        <a href="${resetUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Reset Password
        </a>
        <p>If you didn't request this, please ignore this email. Your password won't change.</p>
      `,
    });

    logger.info("Password reset email sent", { userId: user._id });
    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────

exports.resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ success: false, message: "Token is invalid or has expired" });
    }

    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all sessions on password change
    const redis = getRedis();
    if (redis) await redis.del(`session:${user._id}`);

    logger.info("Password reset successful", { userId: user._id });
    res.json({ success: true, message: "Password reset successful. Please log in." });
  } catch (err) {
    next(err);
  }
};

// ── Resend Verification Email ─────────────────────────────────────────────

exports.resendVerification = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, message: "Email is already verified" });
    }

    const verifyToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const verifyUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/verify-email/${verifyToken}`;
    await sendEmail({
      to: user.email,
      subject: "LearnDev — Verify your email",
      html: `
        <h2>Verify your email</h2>
        <p>Click the link below to verify your LearnDev account (valid for 24 hours):</p>
        <a href="${verifyUrl}" style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;">
          Verify Email
        </a>
      `,
    });

    logger.info("Verification email resent", { userId: user._id });
    res.json({ success: true, message: "Verification email sent. Please check your inbox." });
  } catch (err) {
    next(err);
  }
};
