const Notification = require("../models/Notification");

// ── Get my notifications ───────────────────────────────────────────────────
exports.getNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const filter = { user: req.user._id };
    if (unreadOnly === "true") filter.read = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ user: req.user._id, read: false }),
    ]);

    res.json({ success: true, notifications, total, unreadCount, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// ── Mark single notification as read ─────────────────────────────────────
exports.markRead = async (req, res, next) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── Mark all as read ──────────────────────────────────────────────────────
exports.markAllRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

// ── Admin: broadcast announcement to all users ────────────────────────────
exports.broadcast = async (req, res, next) => {
  try {
    const { title, message, link = "", type = "announcement" } = req.body;
    const User = require("../models/User");
    const users = await User.find({}, "_id").lean();

    const broadcastId = `broadcast_${Date.now()}`;
    const docs = users.map((u) => ({
      user: u._id,
      type,
      title,
      message,
      link,
      broadcastId,
    }));

    await Notification.insertMany(docs, { ordered: false });
    res.json({ success: true, sent: docs.length });
  } catch (err) {
    next(err);
  }
};

// ── Admin: notify single user ─────────────────────────────────────────────
exports.notifyUser = async (req, res, next) => {
  try {
    const { userId, title, message, link = "", type = "announcement" } = req.body;
    const notif = await Notification.create({ user: userId, type, title, message, link });
    res.status(201).json({ success: true, notification: notif });
  } catch (err) {
    next(err);
  }
};

// ── Helper: create notification for a specific user (internal use) ────────
exports.createNotification = async ({ userId, type, title, message, link = "" }) => {
  try {
    return await Notification.create({ user: userId, type, title, message, link });
  } catch {
    // non-blocking — never crash the main flow
  }
};
