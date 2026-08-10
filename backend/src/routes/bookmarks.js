const express = require("express");
const { toggleBookmark, checkBookmark, getBookmarks } = require("../controllers/bookmarkController");
const { protect } = require("../middleware/auth");

const router = express.Router({ mergeParams: true });
router.use(protect);

router.get("/", checkBookmark);
router.post("/", toggleBookmark);

module.exports = router;
