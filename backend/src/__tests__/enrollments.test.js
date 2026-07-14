/**
 * Enrollment API Tests
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
const Enrollment = require("../models/Enrollment");

let studentToken;
let studentId;
let courseId;

const email = `student.${Date.now()}@learndev.test`;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }

  // Create student
  const regRes = await request(app).post("/api/auth/register").send({
    name: "Enroll Tester",
    email,
    password: "enroll12345",
    role: "student",
  });
  studentToken = regRes.body.accessToken || regRes.body.token;
  studentId = regRes.body.user.id;

  // Create test course
  const course = await Course.create({
    title: "Enrollable Course",
    slug: `enrollable-${Date.now()}`,
    description: "A course to enroll in",
    instructor: "Prof Test",
    category: "Programming",
    published: true,
  });
  courseId = course._id;
});

afterAll(async () => {
  const User = require("../models/User");
  await Enrollment.deleteMany({ user: studentId });
  await Course.deleteMany({ slug: /^enrollable-/ });
  await User.deleteMany({ email: /@learndev\.test$/ });
  await mongoose.disconnect();
});

// ── Enroll ─────────────────────────────────────────────────────────────────
describe("POST /api/enrollments/:courseId", () => {
  it("student can enroll in a course", async () => {
    const res = await request(app)
      .post(`/api/enrollments/${courseId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.enrollment.course.toString()).toBe(courseId.toString());
  });

  it("rejects duplicate enrollment", async () => {
    const res = await request(app)
      .post(`/api/enrollments/${courseId}`)
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already enrolled/i);
  });

  it("requires auth", async () => {
    const res = await request(app).post(`/api/enrollments/${courseId}`);
    expect(res.status).toBe(401);
  });
});

// ── Get My Enrollments ─────────────────────────────────────────────────────
describe("GET /api/enrollments", () => {
  it("returns student enrollments", async () => {
    const res = await request(app)
      .get("/api/enrollments")
      .set("Authorization", `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.enrollments)).toBe(true);
    expect(res.body.enrollments.length).toBeGreaterThan(0);
  });

  it("requires auth", async () => {
    const res = await request(app).get("/api/enrollments");
    expect(res.status).toBe(401);
  });
});

// ── Update Progress ────────────────────────────────────────────────────────
describe("PATCH /api/enrollments/:courseId/progress", () => {
  it("updates progress for enrolled student", async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${courseId}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ progress: 50 });
    expect(res.status).toBe(200);
    expect(res.body.enrollment.progress).toBe(50);
  });

  it("marks as completed when progress is 100", async () => {
    const res = await request(app)
      .patch(`/api/enrollments/${courseId}/progress`)
      .set("Authorization", `Bearer ${studentToken}`)
      .send({ progress: 100 });
    expect(res.status).toBe(200);
    expect(res.body.enrollment.status).toBe("completed");
  });
});
