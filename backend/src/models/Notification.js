const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["course_update", "certificate", "complaint_update", "announcement", "recommendation", "enrollment"],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String, default: "" },   // optional deep-link (e.g. /learn/:slug)
    read: { type: Boolean, default: false },
    // For admin broadcasts — null means it's a personal notification
    broadcastId: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
