const express = require("express");
const { body } = require("express-validator");
const { protect, authorize } = require("../middleware/auth");
const validate = require("../middleware/validate");
const {
  getStats,
  getUsers,
  deleteUser,
  updateUserRole,
  toggleBlockUser,
  getUserEnrollments,
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getEnrollments,
  changePassword,
  updateProfile,
} = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin"));

router.get("/stats", getStats);

router.get("/users", getUsers);
router.delete("/users/:id", deleteUser);
router.patch("/users/:id/role", [body("role").isIn(["user", "admin"])], validate, updateUserRole);
router.patch("/users/:id/block", toggleBlockUser);
router.get("/users/:id/enrollments", getUserEnrollments);

router.get("/courses", getCourses);
router.post(
  "/courses",
  [
    body("title").notEmpty(),
    body("slug").notEmpty(),
    body("description").notEmpty(),
    body("instructor").notEmpty(),
    body("category").notEmpty(),
  ],
  validate,
  createCourse
);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

router.get("/enrollments", getEnrollments);

router.patch(
  "/settings/password",
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  validate,
  changePassword
);
router.put("/settings/profile", updateProfile);

module.exports = router;
