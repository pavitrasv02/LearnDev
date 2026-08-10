const Complaint = require("../models/Complaint");
const { createNotification } = require("./notificationController");
const logger = require("../config/logger");

// ── Student: submit complaint ─────────────────────────────────────────────
exports.createComplaint = async (req, res, next) => {
  try {
    const { type, subject, description, courseId, screenshotUrl } = req.body;
    const complaint = await Complaint.create({
      user: req.user._id,
      type,
      subject,
      description,
      course: courseId || null,
      screenshotUrl: screenshotUrl || "",
    });
    logger.info("Complaint submitted", { complaintId: complaint._id, userId: req.user._id, type });
    res.status(201).json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── Student: my complaints ────────────────────────────────────────────────
exports.getMyComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find({ user: req.user._id })
        .populate("course", "title slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Complaint.countDocuments({ user: req.user._id }),
    ]);
    res.json({ success: true, complaints, total, pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// ── Student: reply to complaint ───────────────────────────────────────────
exports.replyToComplaint = async (req, res, next) => {
  try {
    const complaint = await Complaint.findOne({ _id: req.params.id, user: req.user._id });
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });
    if (["resolved", "closed"].includes(complaint.status)) {
      return res.status(400).json({ success: false, message: "Cannot reply to a resolved/closed complaint" });
    }
    complaint.replies.push({ author: req.user._id, message: req.body.message, isAdmin: false });
    await complaint.save();
    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── Admin: get all complaints ─────────────────────────────────────────────
exports.getAllComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status, type, priority } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (priority) filter.priority = priority;

    const skip = (Number(page) - 1) * Number(limit);
    const [complaints, total] = await Promise.all([
      Complaint.find(filter)
        .populate("user", "name email")
        .populate("course", "title slug")
        .sort({ priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Complaint.countDocuments(filter),
    ]);

    // Analytics
    const stats = await Complaint.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const statusCounts = {};
    stats.forEach((s) => { statusCounts[s._id] = s.count; });

    res.json({ success: true, complaints, total, pages: Math.ceil(total / Number(limit)), stats: statusCounts });
  } catch (err) {
    next(err);
  }
};

// ── Admin: update complaint status / priority ─────────────────────────────
exports.updateComplaint = async (req, res, next) => {
  try {
    const { status, priority } = req.body;
    const update = {};
    if (status) { update.status = status; if (["resolved", "closed"].includes(status)) update.resolvedAt = new Date(); }
    if (priority) update.priority = priority;

    const complaint = await Complaint.findByIdAndUpdate(req.params.id, update, { new: true }).populate("user", "name email");
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    // Notify the user
    if (status) {
      await createNotification({
        userId: complaint.user._id,
        type: "complaint_update",
        title: "Support ticket update",
        message: `Your ticket "${complaint.subject}" status changed to: ${status}`,
        link: "/support",
      });
    }
    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};

// ── Admin: reply to complaint ─────────────────────────────────────────────
exports.adminReply = async (req, res, next) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

    complaint.replies.push({ author: req.user._id, message: req.body.message, isAdmin: true });
    if (complaint.status === "submitted") complaint.status = "under_review";
    await complaint.save();

    await createNotification({
      userId: complaint.user,
      type: "complaint_update",
      title: "Support reply received",
      message: `Admin replied to your ticket: "${complaint.subject}"`,
      link: "/support",
    });

    res.json({ success: true, complaint });
  } catch (err) {
    next(err);
  }
};
