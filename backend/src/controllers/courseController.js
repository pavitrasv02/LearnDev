const Course = require("../models/Course");
const { getCache, setCache, deleteCache, withLock } = require("../utils/cache");

exports.getCourses = async (req, res, next) => {
  try {
    const { category, level, search, featured, page = 1, limit = 12 } = req.query;
    const cacheKey = `courses:${category || ""}:${level || ""}:${search || ""}:${featured || ""}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, ...cached, cached: true });

    const filter = { published: true };
    if (category) filter.category = category;
    if (level) filter.level = level;
    if (featured === "true") filter.featured = true;
    if (search) filter.$text = { $search: search };

    const skip = (Number(page) - 1) * Number(limit);
    const [courses, total] = await Promise.all([
      Course.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Course.countDocuments(filter),
    ]);

    const payload = { courses, total, page: Number(page), pages: Math.ceil(total / Number(limit)) };
    await setCache(cacheKey, payload);
    res.json({ success: true, ...payload });
  } catch (err) {
    next(err);
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const cacheKey = `course:${req.params.slug}`;
    const cached = await getCache(cacheKey);
    if (cached) return res.json({ success: true, course: cached, cached: true });

    const course = await Course.findOne({ slug: req.params.slug, published: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });

    await setCache(cacheKey, course);
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await withLock(`lock:course:create`, async () => {
      return Course.create(req.body);
    });
    await deleteCache("courses:*");
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await deleteCache("courses:*");
    await deleteCache(`course:${course.slug}`);
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    await deleteCache("courses:*");
    await deleteCache(`course:${course.slug}`);
    res.json({ success: true, message: "Course deleted" });
  } catch (err) {
    next(err);
  }
};

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
