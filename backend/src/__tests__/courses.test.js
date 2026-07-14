/**
 * Course API Tests
 */
const request = require("supertest");
const mongoose = require("mongoose");

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/olp-test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.LOG_LEVEL = "error";

const app = require("../app");
const Course = require("../models/Course");

let adminToken;
let adminId;

const uniqueSlug = () => `test-course-${Date.now()}`;
const uniqueEmail = () => `admin.${Date.now()}@learndev.test`;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
  // Create admin user and login
  const email = uniqueEmail();
  const User = require("../models/User");
  const admin = await User.create({ name: "Admin", email, password: "admin12345", role: "admin" });
  adminId = admin._id;
  const res = await request(app).post("/api/auth/login").send({ email, password: "admin12345" });
  adminToken = res.body.accessToken || res.body.token;
});

afterAll(async () => {
  const User = require("../models/User");
  await Course.deleteMany({ slug: /^test-course-/ });
  await User.deleteMany({ email: /@learndev\.test$/ });
  await mongoose.disconnect();
});

// ── GET /api/courses ────────────────────────────────────────────────────────
describe("GET /api/courses", () => {
  it("returns a list of courses with pagination", async () => {
    const res = await request(app).get("/api/courses");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.courses)).toBe(true);
    expect(res.body).toHaveProperty("total");
    expect(res.body).toHaveProperty("pages");
  });

  it("accepts category filter", async () => {
    const res = await request(app).get("/api/courses?category=Programming");
    expect(res.status).toBe(200);
  });

  it("accepts search query", async () => {
    const res = await request(app).get("/api/courses?search=javascript");
    expect(res.status).toBe(200);
  });

  it("respects pagination params", async () => {
    const res = await request(app).get("/api/courses?page=1&limit=3");
    expect(res.status).toBe(200);
    expect(res.body.courses.length).toBeLessThanOrEqual(3);
  });
});

// ── POST /api/courses (admin) ───────────────────────────────────────────────
describe("POST /api/courses", () => {
  it("admin can create a course", async () => {
    const slug = uniqueSlug();
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Test Course",
        slug,
        description: "A test course description",
        instructor: "Test Instructor",
        category: "Programming",
        level: "Beginner",
        price: 0,
        isFree: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.course.slug).toBe(slug);
  });

  it("requires auth", async () => {
    const res = await request(app).post("/api/courses").send({
      title: "Unauth Course",
      slug: uniqueSlug(),
      description: "desc",
      instructor: "Someone",
      category: "Programming",
    });
    expect(res.status).toBe(401);
  });

  it("rejects missing required fields", async () => {
    const res = await request(app)
      .post("/api/courses")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ title: "Missing Fields" });
    expect(res.status).toBe(400);
  });
});

// ── GET /api/courses/:slug ──────────────────────────────────────────────────
describe("GET /api/courses/:slug", () => {
  let testSlug;

  beforeAll(async () => {
    testSlug = uniqueSlug();
    await Course.create({
      title: "Slug Test Course",
      slug: testSlug,
      description: "desc",
      instructor: "Someone",
      category: "Programming",
      published: true,
    });
  });

  it("returns course by slug", async () => {
    const res = await request(app).get(`/api/courses/${testSlug}`);
    expect(res.status).toBe(200);
    expect(res.body.course.slug).toBe(testSlug);
  });

  it("returns 404 for unknown slug", async () => {
    const res = await request(app).get("/api/courses/totally-unknown-slug-xyz");
    expect(res.status).toBe(404);
  });
});
