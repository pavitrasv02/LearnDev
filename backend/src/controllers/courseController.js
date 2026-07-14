const Course = require("../models/Course");
const Section = require("../models/Section");
const { getCache, setCache, deleteCache, withLock } = require("../utils/cache");
const logger = require("../config/logger");

// ── GET /api/courses ───────────────────────────────────────────────────────
exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, featured, isFree, page = 1, limit = 12 } = req.query;
    const cacheKey = `courses:${category || ""}:${level || ""}:${search || ""}:${featured || ""}:${isFree || ""}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, ...cached, cached: true });

    const filter = { published: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured === "true") filter.featured = true;
    if (isFree === "true") filter.isFree = true;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const safeLimit = Math.min(Number(limit), 50);

    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(safeLimit).lean(),
      Course.countDocuments(filter),
    ]);

    const payload = { courses, total, page: Number(page), pages: Math.ceil(total / safeLimit) };
    await setCache(cacheKey, payload);
    res.json({ success: true, ...payload });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/courses/:slug  OR  /api/courses/by-id/:id ───────────────────
exports.getCourse = async (req, res, next) => {
  try {
    const param = req.params.slug || req.params.id;
    const isId = /^[a-f\d]{24}$/i.test(param);

    const cacheKey = `course:${param}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, course: cached, cached: true });

    // Admins/instructors can fetch unpublished courses by ID for the builder
    const query = isId ? { _id: param } : { slug: param, published: true };
    const course = await Course.findOne(query).lean();
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    // Populate structured sections + lessons if they exist
    if (course.sections && course.sections.length > 0) {
      const sections = await Section.find({ course: course._id })
        .populate({
          path: "lessons",
          select: "title description type duration order isPreview",
        })
        .sort("order")
        .lean();
      course.populatedSections = sections;
    }

    await setCache(cacheKey, course);
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/courses ─────────────────────────────────────────────────────
exports.createCourse = async (req, res, next) => {
  try {
    const courseData = { ...req.body };
    // Auto-link instructorId if user is an instructor
    if (req.user.role === "instructor" || req.user.role === "admin") {
      courseData.instructorId = req.user._id;
      if (!courseData.instructor) courseData.instructor = req.user.name;
    }
    const course = await withLock("lock:course:create", async () => Course.create(courseData));
    await deleteCache("courses:*");
    logger.info("Course created", { courseId: course._id, title: course.title, userId: req.user._id });
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// ── PUT /api/courses/:id ──────────────────────────────────────────────────
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await deleteCache("courses:*");
    await deleteCache(`course:${course.slug}`);
    logger.info("Course updated", { courseId: course._id, userId: req.user._id });
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/courses/:id/publish ────────────────────────────────────────
exports.publishCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    course.published = !course.published;
    if (course.published && !course.publishedAt) course.publishedAt = new Date();
    await course.save();
    await deleteCache("courses:*");
    await deleteCache(`course:${course.slug}`);
    res.json({ success: true, course, published: course.published });
  } catch (err) {
    next(err);
  }
};

// ── DELETE /api/courses/:id ────────────────────────────────────────────────
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await deleteCache("courses:*");
    await deleteCache(`course:${course.slug}`);
    logger.info("Course deleted", { courseId: course._id, userId: req.user._id });
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/courses/by-id/:id (admin/instructor) ─────────────────────────
exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).lean();
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/courses/stats ─────────────────────────────────────────────────
exports.getStats = async (_req, res, next) => {
  try {
    const cacheKey = "stats:platform";
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, stats: cached, cached: true });

    const [totalCourses, categories] = await Promise.all([
      Course.countDocuments({ published: true }),
      Course.distinct("category"),
    ]);
    const stats = {
      totalCourses,
      totalStudents: 12500,
      totalInstructors: 48,
      categories: categories.length,
      satisfaction: 98,
    };
    await setCache(cacheKey, stats, 600);
    res.json({ success: true, stats });
  } catch (err) {
    next(err);
  }
};
