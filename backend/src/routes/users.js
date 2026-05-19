const express = require("express");
const { updateProfile, getUserById } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/:id", getUserById);

module.exports = router;
