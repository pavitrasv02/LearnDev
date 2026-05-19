const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const Course = require("../models/Course");
const User = require("../models/User");
const logger = require("../config/logger");

const courses = [
  {
    title: "JavaScript Mastery",
    slug: "javascript-mastery",
    description: "Master modern JavaScript from fundamentals to advanced patterns including ES6+, async/await, and functional programming.",
    shortDescription: "Complete JavaScript course for modern web development",
    instructor: "Sarah Chen",
    category: "Programming",
    level: "Beginner",
    price: 0,
    isFree: true,
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465d2479?w=600&h=400&fit=crop",
    duration: "24 hours",
    lessons: 48,
    rating: 4.9,
    studentsCount: 15420,
    tags: ["javascript", "es6", "web"],
    featured: true,
    curriculum: [
      { title: "Fundamentals", lessons: [{ title: "Variables & Types", duration: "15m" }, { title: "Functions", duration: "20m" }] },
      { title: "Advanced", lessons: [{ title: "Promises", duration: "25m" }, { title: "Async/Await", duration: "20m" }] },
    ],
  },
  {
    title: "Docker for DevOps",
    slug: "docker-for-devops",
    description: "Learn containerization with Docker — images, containers, Docker Compose, and production deployment strategies.",
    shortDescription: "Containerize applications like a pro",
    instructor: "Marcus Johnson",
    category: "DevOps",
    level: "Intermediate",
    price: 29.99,
    thumbnail: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=600&h=400&fit=crop",
    duration: "18 hours",
    lessons: 36,
    rating: 4.8,
    studentsCount: 8930,
    tags: ["docker", "containers", "devops"],
    featured: true,
  },
  {
    title: "DevOps Fundamentals",
    slug: "devops-fundamentals",
    description: "CI/CD pipelines, infrastructure as code, monitoring, and the complete DevOps lifecycle.",
    shortDescription: "End-to-end DevOps practices",
    instructor: "Elena Rodriguez",
    category: "DevOps",
    level: "Intermediate",
    price: 39.99,
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d91fcb?w=600&h=400&fit=crop",
    duration: "32 hours",
    lessons: 64,
    rating: 4.7,
    studentsCount: 6720,
    tags: ["devops", "cicd", "jenkins"],
    featured: true,
  },
  {
    title: "AWS Cloud Architecture",
    slug: "aws-cloud-architecture",
    description: "Design and deploy scalable cloud solutions on AWS — EC2, S3, RDS, Lambda, and more.",
    shortDescription: "Build production cloud infrastructure",
    instructor: "David Park",
    category: "Cloud",
    level: "Advanced",
    price: 34.99,
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop",
    duration: "28 hours",
    lessons: 52,
    rating: 4.6,
    studentsCount: 5430,
    tags: ["aws", "cloud", "ec2"],
    featured: false,
  },
  {
    title: "Node.js Backend Development",
    slug: "nodejs-backend-development",
    description: "Build scalable REST APIs with Node.js, Express, MongoDB, authentication, and deployment.",
    shortDescription: "Production-ready Node.js APIs",
    instructor: "Alex Thompson",
    category: "Programming",
    level: "Intermediate",
    price: 0,
    isFree: true,
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&h=400&fit=crop",
    duration: "22 hours",
    lessons: 44,
    rating: 4.8,
    studentsCount: 11200,
    tags: ["nodejs", "express", "api"],
    featured: true,
  },
  {
    title: "Kubernetes Orchestration",
    slug: "kubernetes-orchestration",
    description: "Deploy, scale, and manage containerized applications with Kubernetes in production environments.",
    shortDescription: "Master K8s for production",
    instructor: "Marcus Johnson",
    category: "DevOps",
    level: "Advanced",
    price: 49.99,
    thumbnail: "https://images.unsplash.com/photo-1667372393119-3d4c48d91fcb?w=600&h=400&fit=crop",
    duration: "26 hours",
    lessons: 50,
    rating: 4.9,
    studentsCount: 3890,
    tags: ["kubernetes", "k8s", "orchestration"],
    featured: true,
  },
  {
    title: "React & Modern Frontend",
    slug: "react-modern-frontend",
    description: "Build stunning UIs with React, hooks, context, Tailwind CSS, and Framer Motion animations.",
    shortDescription: "Premium React development",
    instructor: "Sarah Chen",
    category: "Programming",
    level: "Intermediate",
    price: 24.99,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
    duration: "30 hours",
    lessons: 58,
    rating: 4.9,
    studentsCount: 18750,
    tags: ["react", "frontend", "tailwind"],
    featured: true,
  },
  {
    title: "Data Science with Python",
    slug: "data-science-python",
    description: "Pandas, NumPy, machine learning fundamentals, and data visualization for real-world projects.",
    shortDescription: "Analytics and ML foundations",
    instructor: "Dr. Priya Sharma",
    category: "Data Science",
    level: "Beginner",
    price: 44.99,
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop",
    duration: "35 hours",
    lessons: 70,
    rating: 4.7,
    studentsCount: 9210,
    tags: ["python", "data", "ml"],
    featured: false,
  },
];

async function seedDatabase() {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      logger.info("Database already seeded, skipping");
      return;
    }
    await Course.insertMany(courses);
    const adminExists = await User.findOne({ email: "admin@olp.dev" });
    if (!adminExists) {
      await User.create({
        name: "Admin User",
        email: "admin@olp.dev",
        password: "admin123",
        role: "admin",
      });
    }
    const demoExists = await User.findOne({ email: "demo@olp.dev" });
    if (!demoExists) {
      await User.create({
        name: "Demo Student",
        email: "demo@olp.dev",
        password: "demo123",
        role: "user",
      });
    }
    logger.info(`Seeded ${courses.length} courses and demo users`);
  } catch (err) {
    logger.error("Seed failed", { error: err.message });
  }
}

if (require.main === module) {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/olp";
  mongoose.connect(uri).then(async () => {
    await Course.deleteMany({});
    await seedDatabase();
    process.exit(0);
  });
}

module.exports = seedDatabase;
