const express = require("express");
const { body } = require("express-validator");
const {
  getNotifications,
  markRead,
  markAllRead,
  broadcast,
  notifyUser,
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.patch("/:id/read", markRead);
router.patch("/read-all", markAllRead);

// Admin-only
router.post(
  "/broadcast",
  authorize("admin"),
  [
    body("title").notEmpty().withMessage("Title required"),
    body("message").notEmpty().withMessage("Message required"),
  ],
  validate,
  broadcast
);

router.post(
  "/notify-user",
  authorize("admin"),
  [
    body("userId").notEmpty(),
    body("title").notEmpty(),
    body("message").notEmpty(),
  ],
  validate,
  notifyUser
);

module.exports = router;
