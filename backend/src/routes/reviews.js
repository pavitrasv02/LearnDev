const express = require("express");
const { body } = require("express-validator");
const {
  getCourseReviews,
  createReview,
  updateReview,
  deleteReview,
  voteHelpful,
  reportReview,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");

const router = express.Router({ mergeParams: true }); // inherits :courseId

// Public — optionally enriched if user is logged in
router.get("/", (req, res, next) => {
  // Try to decode token without blocking unauthenticated access
  const jwt = require("jsonwebtoken");
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
      req.user = { _id: decoded.id, role: decoded.role };
    } catch { /* unauthenticated read is fine */ }
  }
  getCourseReviews(req, res, next);
});

router.post(
  "/",
  protect,
  [
    body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be 1–5"),
    body("body").trim().notEmpty().withMessage("Review text is required").isLength({ max: 2000 }),
    body("title").optional().trim().isLength({ max: 200 }),
  ],
  validate,
  createReview
);

router.put(
  "/:reviewId",
  protect,
  [
    body("rating").optional().isInt({ min: 1, max: 5 }),
    body("body").optional().trim().notEmpty(),
  ],
  validate,
  updateReview
);

router.delete("/:reviewId", protect, deleteReview);
router.patch("/:reviewId/helpful", protect, voteHelpful);
router.patch("/:reviewId/report", protect, [body("reason").optional().trim()], reportReview);

module.exports = router;
