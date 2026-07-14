const express = require("express");
const {
  getMyCertificates,
  getCertificate,
  verifyCertificate,
} = require("../controllers/certificateController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/verify/:code", verifyCertificate);          // public — no auth needed
router.get("/", protect, getMyCertificates);
router.get("/:id", protect, getCertificate);

module.exports = router;
