const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getRedis } = require("../config/redis");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    },
  });
};

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }
    const user = await User.create({ name, email, password });
    sendTokenResponse(user, 201, res);
  } catch (err) {
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account has been blocked" });
    }
    const redis = getRedis();
    if (redis) {
      await redis.setex(`session:${user._id}`, 604800, JSON.stringify({ email: user.email, role: user.role }));
    }
    sendTokenResponse(user, 200, res);
  } catch (err) {
    next(err);
  }
};

exports.logout = async (req, res) => {
  const redis = getRedis();
  if (redis && req.user) await redis.del(`session:${req.user._id}`);
  res.json({ success: true, message: "Logged out" });
};

exports.getMe = async (req, res) => {
  const user = await User.findById(req.user._id).populate("enrolledCourses", "title slug thumbnail");
  res.json({ success: true, user });
};
