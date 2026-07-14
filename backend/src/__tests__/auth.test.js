/**
 * Authentication API Tests
 * Uses supertest against the Express app.
 * MongoDB and Redis connections are made to test instances.
 */
const request = require("supertest");
const mongoose = require("mongoose");

// Load env before app (test values)
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret";
process.env.JWT_ACCESS_EXPIRES = "15m";
process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/olp-test";
process.env.REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
process.env.LOG_LEVEL = "error"; // suppress logs during tests

const app = require("../app");

// ── Helpers ────────────────────────────────────────────────────────────────
const uniqueEmail = () => `test.${Date.now()}@learndev.test`;

beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI);
  }
});

afterAll(async () => {
  // Clean test users
  const User = require("../models/User");
  await User.deleteMany({ email: /@learndev\.test$/ });
  await mongoose.disconnect();
});

// ── Register ───────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("registers a new student and returns accessToken", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Student",
      email: uniqueEmail(),
      password: "testpass123",
      role: "student",
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken || res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("student");
  });

  it("registers an instructor", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test Instructor",
      email: uniqueEmail(),
      password: "testpass123",
      role: "instructor",
    });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe("instructor");
  });

  it("rejects duplicate email", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({ name: "A", email, password: "pass123" });
    const res = await request(app).post("/api/auth/register").send({ name: "B", email, password: "pass456" });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects missing required fields", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: uniqueEmail() });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("rejects short password", async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "Test",
      email: uniqueEmail(),
      password: "abc",
    });
    expect(res.status).toBe(400);
  });
});

// ── Login ──────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  const email = uniqueEmail();
  const password = "logintest123";

  beforeAll(async () => {
    await request(app).post("/api/auth/register").send({ name: "Login Test", email, password });
  });

  it("logs in with valid credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken || res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it("rejects wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({ email, password: "wrongpassword" });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("rejects unknown email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nobody@learndev.test",
      password: "anypassword",
    });
    expect(res.status).toBe(401);
  });

  it("rejects invalid email format", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "not-an-email",
      password,
    });
    expect(res.status).toBe(400);
  });
});

// ── Get Me ─────────────────────────────────────────────────────────────────
describe("GET /api/auth/me", () => {
  let token;
  const email = uniqueEmail();

  beforeAll(async () => {
    const res = await request(app).post("/api/auth/register").send({
      name: "GetMe Test",
      email,
      password: "getmetest123",
    });
    token = res.body.accessToken || res.body.token;
  });

  it("returns current user with valid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
  });

  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns 401 with malformed token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer this.is.garbage");
    expect(res.status).toBe(401);
  });
});

// ── Forgot Password ────────────────────────────────────────────────────────
describe("POST /api/auth/forgot-password", () => {
  it("always returns 200 (prevents account enumeration)", async () => {
    const res = await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "doesnotexist@learndev.test" });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 200 for real email too", async () => {
    const email = uniqueEmail();
    await request(app).post("/api/auth/register").send({ name: "FP Test", email, password: "fp12345" });
    const res = await request(app).post("/api/auth/forgot-password").send({ email });
    expect(res.status).toBe(200);
  });
});

// ── Health endpoints ───────────────────────────────────────────────────────
describe("Health checks", () => {
  it("GET /health returns ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
