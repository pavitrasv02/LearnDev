const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * protect — verifies the Bearer access token.
 * Returns a distinct error code "TOKEN_EXPIRED" so the frontend
 * knows to call POST /api/auth/refresh before retrying.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: "Not authorized — no token" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (user.isBlocked) {
      return res.status(403).json({ success: false, message: "Account blocked" });
    }
    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
        code: "TOKEN_EXPIRED", // frontend uses this to trigger silent refresh
      });
    }
    return res.status(401).json({ success: false, message: "Invalid token" });
  }
};

/**
 * authorize — RBAC guard.
 * Normalises legacy "user" role to "student" for the comparison,
 * so existing tokens with role "user" still match "student" checks.
 */
const authorize = (...roles) => (req, res, next) => {
  const userRole = req.user.role === "user" ? "student" : req.user.role;
  if (!roles.includes(userRole) && !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Access denied — requires role: ${roles.join(" or ")}`,
    });
  }
  next();
};

module.exports = { protect, authorize };
