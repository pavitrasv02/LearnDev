const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "LearnDev API",
      version: "2.0.0",
      description:
        "Production-ready Online Learning Platform REST API. Built with Node.js + Express + MongoDB + Redis.",
      contact: { name: "LearnDev Team", email: "dev@learndev.io" },
    },
    servers: [
      { url: "/api", description: "Current environment" },
      { url: "http://localhost:5000/api", description: "Local development" },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Access token from POST /api/auth/login",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["student", "instructor", "admin"] },
            avatar: { type: "string" },
            isEmailVerified: { type: "boolean" },
          },
        },
        Course: {
          type: "object",
          properties: {
            _id: { type: "string" },
            title: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            instructor: { type: "string" },
            category: { type: "string" },
            level: { type: "string", enum: ["Beginner", "Intermediate", "Advanced"] },
            price: { type: "number" },
            isFree: { type: "boolean" },
            thumbnail: { type: "string" },
            duration: { type: "string" },
            rating: { type: "number" },
            studentsCount: { type: "integer" },
            published: { type: "boolean" },
          },
        },
        Enrollment: {
          type: "object",
          properties: {
            _id: { type: "string" },
            user: { type: "string" },
            course: { $ref: "#/components/schemas/Course" },
            progress: { type: "integer", minimum: 0, maximum: 100 },
            status: { type: "string", enum: ["active", "completed", "dropped"] },
            completedLessons: { type: "array", items: { type: "string" } },
            enrolledAt: { type: "string", format: "date-time" },
          },
        },
        Error: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string" },
          },
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication & account management" },
      { name: "Courses", description: "Course catalog & management" },
      { name: "Enrollments", description: "Student enrollment & progress" },
      { name: "Sections", description: "Course sections & lessons" },
      { name: "Certificates", description: "Completion certificates" },
      { name: "Users", description: "User profiles" },
      { name: "Admin", description: "Admin-only operations" },
    ],
  },
  apis: ["./src/routes/*.js", "./src/controllers/*.js"],
};

module.exports = swaggerJsdoc(options);
