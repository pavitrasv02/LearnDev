const User = require("../models/User");
const Course = require("../models/Course");
const Enrollment = require("../models/Enrollment");
const { getCache, setCache, deleteCache } = require("../utils/cache");
const logger = require("../config/logger");

const invalidateAdminCache = async () => {
  await deleteCache("admin:stats");
  await deleteCache("courses:*");
};

// GET /api/admin/stats
exports.getStats = async (req, res, next) => {
  try {
    const cacheKey = "admin:stats";
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, stats: cached, cached: true });

    const [totalUsers, totalCourses, totalEnrollments, activeEnrollments, revenueAgg, recentEnrollments, recentUsers] =
      await Promise.all([
        User.countDocuments(),
        Course.countDocuments(),
        Enrollment.countDocuments(),
        Enrollment.countDocuments({ status: "active" }),
        Course.aggregate([
          { $match: { published: true, isFree: { $ne: true } } },
          { $group: { _id: null, total: { $sum: "$price" }, avg: { $avg: "$price" } } },
        ]),
        Enrollment.find()
          .populate("user", "name email")
          .populate("course", "title")
          .sort({ createdAt: -1 })
          .limit(8)
          .lean(),
        User.find().select("name email role createdAt").sort({ createdAt: -1 }).limit(5).lean(),
      ]);

    const enrollmentsByMonth = await Enrollment.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
      { $limit: 6 },
    ]);

    const coursesByCategory = await Course.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const stats = {
      totalUsers,
      totalCourses,
      totalEnrollments,
      activeEnrollments,
      revenue: {
        potential: Math.round((revenueAgg[0]?.total || 0) * 100) / 100,
        averageCoursePrice: Math.round((revenueAgg[0]?.avg || 0) * 100) / 100,
      },
      enrollmentsByMonth: enrollmentsByMonth.map((e) => ({ month: e._id, count: e.count })),
      coursesByCategory: coursesByCategory.map((c) => ({ category: c._id, count: c.count })),
      recentActivity: {
        enrollments: recentEnrollments,
        users: recentUsers,
      },
      system: {
        status: "operational",
        database: "connected",
        cache: "active",
        api: "healthy",
      },
    };

    await setCache(cacheKey, stats, 120);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users
exports.getUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    const usersWithEnrollments = await Promise.all(
      users.map(async (u) => {
        const count = await Enrollment.countDocuments({ user: u._id });
        return { ...u, enrollmentCount: count };
      })
    );

    res.json({
      success: true,
      users: usersWithEnrollments,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/users/:id
exports.deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot delete your own account" });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await Enrollment.deleteMany({ user: req.params.id });
    await invalidateAdminCache();
    logger.info("Admin deleted user", { adminId: req.user._id, userId: req.params.id });
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!["user", "student", "instructor", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role" });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    await invalidateAdminCache();
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/users/:id/block
exports.toggleBlockUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "Cannot block your own account" });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json({ success: true, user: { _id: user._id, isBlocked: user.isBlocked } });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/users/:id/enrollments
exports.getUserEnrollments = async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ user: req.params.id })
      .populate("course", "title slug thumbnail category")
      .sort({ enrolledAt: -1 });
    res.json({ success: true, enrollments });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/courses
exports.getCourses = async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category && category !== "All") filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { instructor: { $regex: search, $options: "i" } },
      ];
    }
    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Course.countDocuments(filter),
    ]);
    res.json({ success: true, courses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    next(err);
  }
};

// POST /api/admin/courses
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    await invalidateAdminCache();
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/courses/:id
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await deleteCache(`course:${course.slug}`);
    await invalidateAdminCache();
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/admin/courses/:id
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await Enrollment.deleteMany({ course: req.params.id });
    await invalidateAdminCache();
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

// GET /api/admin/enrollments
exports.getEnrollments = async (req, res, next) => {
  try {
    const { page = 1, limit = 15, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [enrollments, total, stats] = await Promise.all([
      Enrollment.find(filter)
        .populate("user", "name email")
        .populate("course", "title category price")
        .sort({ enrolledAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Enrollment.countDocuments(filter),
      Enrollment.aggregate([
        {
          $group: {
            _id: "$course",
            count: { $sum: 1 },
            avgProgress: { $avg: "$progress" },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "courses",
            localField: "_id",
            foreignField: "_id",
            as: "courseInfo",
          },
        },
        { $unwind: "$courseInfo" },
        {
          $project: {
            courseTitle: "$courseInfo.title",
            category: "$courseInfo.category",
            count: 1,
            avgProgress: { $round: ["$avgProgress", 0] },
          },
        },
      ]),
    ]);

    res.json({
      success: true,
      enrollments,
      courseStats: stats,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
    });
  } catch (err) {
    next(err);
  }
};

// PATCH /api/admin/settings/password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: "Password updated" });
  } catch (err) {
    next(err);
  }
};

// PUT /api/admin/settings/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { name, bio, avatar }, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
