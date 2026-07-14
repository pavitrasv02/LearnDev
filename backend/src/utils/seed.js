const mongoose = require("mongoose");
require("dotenv").config();
const Course = require("../models/Course");
const Section = require("../models/Section");
const Lesson = require("../models/Lesson");
const User = require("../models/User");
const logger = require("../config/logger");

// ── Helpers ───────────────────────────────────────────────────────────────
const YT_DEMO = "https://www.youtube.com/watch?v=PkZNo7MFNFg"; // JS Crash Course
const YT_NODE = "https://www.youtube.com/watch?v=fBNz5xF-Kx4"; // Node Crash Course
const YT_REACT = "https://www.youtube.com/watch?v=w7ejDZ8SWv8"; // React Crash Course
const YT_DOCKER = "https://www.youtube.com/watch?v=fqMOX6JJhGo"; // Docker tutorial
const YT_K8S = "https://www.youtube.com/watch?v=X48VuDVv0do"; // K8s tutorial
const PDF_DEMO = "https://www.w3.org/WAI/WCAG21/Techniques/pdf/PDF1";
const NOTES_DEMO = `# Lesson Notes

## Key Concepts

This lesson covers the foundational concepts you need to understand before moving forward.

### Topics Covered
- Core theory and motivation
- Practical examples with real code
- Common pitfalls and how to avoid them

### Code Example

\`\`\`javascript
// Example code snippet
const example = () => {
  console.log("Hello, LearnDev!");
};
\`\`\`

> **Tip:** Practice these concepts in your local environment before continuing.

---

*These notes are a supplement to the video. Watch the video first, then review here.*`;

// ── Course definitions ─────────────────────────────────────────────────────
const courses = [
  {
    title: "JavaScript Mastery",
    slug: "javascript-mastery",
    description: "Master modern JavaScript from fundamentals to advanced patterns including ES6+, async/await, closures, and functional programming.",
    shortDescription: "Complete JavaScript course for modern web development",
    instructor: "Sarah Chen",
    category: "Programming",
    level: "Beginner",
    price: 0,
    isFree: true,
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465d2479?w=600&h=400&fit=crop",
    duration: "24 hours",
    rating: 4.9,
    studentsCount: 15420,
    tags: ["javascript", "es6", "web"],
    featured: true,
    sectionsData: [
      {
        title: "JavaScript Fundamentals",
        lessons: [
          { title: "Introduction to JavaScript", type: "video", content: YT_DEMO, duration: 1200, description: "What is JavaScript and why it matters.", isPreview: true },
          { title: "Variables & Data Types", type: "video", content: YT_DEMO, duration: 900, description: "var, let, const and primitive types." },
          { title: "Functions & Scope", type: "video", content: YT_DEMO, duration: 1080, description: "Function declarations, expressions and scope chains." },
          { title: "JS Fundamentals Notes", type: "notes", content: NOTES_DEMO, duration: 0, description: "Key notes from the fundamentals section." },
        ],
      },
      {
        title: "Modern ES6+ Features",
        lessons: [
          { title: "Arrow Functions & Template Literals", type: "video", content: YT_DEMO, duration: 780, description: "ES6 syntax improvements.", isPreview: true },
          { title: "Destructuring & Spread", type: "video", content: YT_DEMO, duration: 840, description: "Array and object destructuring." },
          { title: "Modules: import & export", type: "video", content: YT_DEMO, duration: 660, description: "ES Modules system." },
        ],
      },
      {
        title: "Async JavaScript",
        lessons: [
          { title: "Callbacks & the Event Loop", type: "video", content: YT_DEMO, duration: 1020, description: "How JavaScript handles async operations." },
          { title: "Promises in Depth", type: "video", content: YT_DEMO, duration: 1140, description: "Creating and chaining promises." },
          { title: "async/await", type: "video", content: YT_DEMO, duration: 900, description: "Writing cleaner async code." },
          { title: "Exercise Resources", type: "resource", content: "", resourceUrl: PDF_DEMO, duration: 0, description: "Practice exercises for async JS." },
        ],
      },
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
    rating: 4.8,
    studentsCount: 8930,
    tags: ["docker", "containers", "devops"],
    featured: true,
    sectionsData: [
      {
        title: "Introduction to Docker",
        lessons: [
          { title: "What is Docker?", type: "video", content: YT_DOCKER, duration: 900, description: "Containerization vs virtualisation.", isPreview: true },
          { title: "Installing Docker", type: "video", content: YT_DOCKER, duration: 600, description: "Install on Linux, Mac, and Windows." },
          { title: "Docker Architecture Overview", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "Images & Containers",
        lessons: [
          { title: "Building Your First Image", type: "video", content: YT_DOCKER, duration: 1080, description: "Writing a Dockerfile from scratch." },
          { title: "Running Containers", type: "video", content: YT_DOCKER, duration: 840, description: "docker run, exec, stop, rm commands." },
          { title: "Volumes & Bind Mounts", type: "video", content: YT_DOCKER, duration: 960, description: "Persisting data with Docker volumes." },
          { title: "Networking Basics", type: "video", content: YT_DOCKER, duration: 780, description: "Bridge, host, and overlay networks." },
        ],
      },
      {
        title: "Docker Compose",
        lessons: [
          { title: "Intro to Docker Compose", type: "video", content: YT_DOCKER, duration: 1020, description: "Managing multi-container apps.", isPreview: true },
          { title: "Multi-Container App", type: "video", content: YT_DOCKER, duration: 1440, description: "Node.js + MongoDB + Redis stack." },
          { title: "Production Best Practices", type: "video", content: YT_DOCKER, duration: 900, description: "Security, logging, health checks." },
          { title: "Docker Cheat Sheet", type: "resource", content: "", resourceUrl: PDF_DEMO, duration: 0, description: "Handy reference for Docker commands." },
        ],
      },
    ],
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
    rating: 4.8,
    studentsCount: 11200,
    tags: ["nodejs", "express", "api"],
    featured: true,
    sectionsData: [
      {
        title: "Express Basics",
        lessons: [
          { title: "Setting Up Express", type: "video", content: YT_NODE, duration: 780, description: "Your first Node.js + Express server.", isPreview: true },
          { title: "Routing", type: "video", content: YT_NODE, duration: 900, description: "GET, POST, PUT, DELETE routes." },
          { title: "Middleware", type: "video", content: YT_NODE, duration: 840, description: "Writing and using custom middleware." },
          { title: "Express Cheat Sheet", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "MongoDB & Mongoose",
        lessons: [
          { title: "MongoDB Fundamentals", type: "video", content: YT_NODE, duration: 1020, description: "Documents, collections, CRUD." },
          { title: "Mongoose Schemas & Models", type: "video", content: YT_NODE, duration: 960, description: "Defining data models with validation." },
          { title: "Relationships & Population", type: "video", content: YT_NODE, duration: 900, description: "References and virtual populate." },
        ],
      },
      {
        title: "Authentication & Security",
        lessons: [
          { title: "JWT Authentication", type: "video", content: YT_NODE, duration: 1080, description: "Access and refresh token strategy." },
          { title: "Password Hashing with bcrypt", type: "video", content: YT_NODE, duration: 600, description: "Securely storing passwords." },
          { title: "Rate Limiting & Helmet", type: "video", content: YT_NODE, duration: 660, description: "Protecting your API." },
          { title: "Security Checklist", type: "resource", content: "", resourceUrl: PDF_DEMO, duration: 0, description: "Production API security checklist." },
        ],
      },
    ],
  },
  {
    title: "React & Modern Frontend",
    slug: "react-modern-frontend",
    description: "Build stunning UIs with React, hooks, context, Tailwind CSS, and modern state management.",
    shortDescription: "Premium React development",
    instructor: "Sarah Chen",
    category: "Programming",
    level: "Intermediate",
    price: 24.99,
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop",
    duration: "30 hours",
    rating: 4.9,
    studentsCount: 18750,
    tags: ["react", "frontend", "tailwind"],
    featured: true,
    sectionsData: [
      {
        title: "React Foundations",
        lessons: [
          { title: "JSX & Component Model", type: "video", content: YT_REACT, duration: 900, description: "Understanding JSX and component composition.", isPreview: true },
          { title: "Props & State", type: "video", content: YT_REACT, duration: 1020, description: "Passing data and managing local state." },
          { title: "Event Handling", type: "video", content: YT_REACT, duration: 720, description: "Handling user interactions in React." },
        ],
      },
      {
        title: "React Hooks",
        lessons: [
          { title: "useState & useEffect", type: "video", content: YT_REACT, duration: 1080, description: "The two most essential hooks." },
          { title: "useContext", type: "video", content: YT_REACT, duration: 840, description: "Avoiding prop drilling with context." },
          { title: "Custom Hooks", type: "video", content: YT_REACT, duration: 960, description: "Extracting reusable stateful logic." },
          { title: "Hooks Reference Notes", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "Forms & Data Fetching",
        lessons: [
          { title: "Controlled Forms", type: "video", content: YT_REACT, duration: 780, description: "Building forms with React state." },
          { title: "API Calls with Axios", type: "video", content: YT_REACT, duration: 900, description: "Fetching and displaying remote data." },
          { title: "Loading & Error States", type: "video", content: YT_REACT, duration: 660, description: "UX patterns for async operations." },
        ],
      },
    ],
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
    rating: 4.9,
    studentsCount: 3890,
    tags: ["kubernetes", "k8s", "orchestration"],
    featured: true,
    sectionsData: [
      {
        title: "Kubernetes Basics",
        lessons: [
          { title: "What is Kubernetes?", type: "video", content: YT_K8S, duration: 900, description: "Containers at scale — why K8s.", isPreview: true },
          { title: "Pods & Deployments", type: "video", content: YT_K8S, duration: 1080, description: "Core workload resources." },
          { title: "Services & Networking", type: "video", content: YT_K8S, duration: 960, description: "Exposing applications inside and outside the cluster." },
        ],
      },
      {
        title: "Configuration & Storage",
        lessons: [
          { title: "ConfigMaps & Secrets", type: "video", content: YT_K8S, duration: 780, description: "Injecting config and sensitive data." },
          { title: "Persistent Volumes", type: "video", content: YT_K8S, duration: 900, description: "Stateful workloads with PVCs." },
          { title: "K8s Config Cheat Sheet", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "Production K8s",
        lessons: [
          { title: "Ingress Controllers", type: "video", content: YT_K8S, duration: 1020, description: "Routing external traffic into the cluster." },
          { title: "Horizontal Pod Autoscaler", type: "video", content: YT_K8S, duration: 840, description: "Auto-scaling based on CPU and custom metrics." },
          { title: "Helm Charts", type: "video", content: YT_K8S, duration: 1080, description: "Packaging and deploying with Helm." },
          { title: "K8s Manifests Reference", type: "resource", content: "", resourceUrl: PDF_DEMO, duration: 0, description: "Complete manifest reference guide." },
        ],
      },
    ],
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
    rating: 4.7,
    studentsCount: 6720,
    tags: ["devops", "cicd", "jenkins"],
    featured: true,
    sectionsData: [
      {
        title: "CI/CD Pipelines",
        lessons: [
          { title: "What is CI/CD?", type: "video", content: YT_DOCKER, duration: 780, description: "The philosophy behind continuous delivery.", isPreview: true },
          { title: "GitHub Actions Deep Dive", type: "video", content: YT_DOCKER, duration: 1200, description: "Building production pipelines." },
          { title: "Pipeline Notes", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "Monitoring & Observability",
        lessons: [
          { title: "Prometheus & Grafana", type: "video", content: YT_DOCKER, duration: 1080, description: "Metrics collection and dashboards." },
          { title: "Structured Logging", type: "video", content: YT_DOCKER, duration: 720, description: "JSON logs with ELK / Loki." },
          { title: "Alerting Rules", type: "video", content: YT_DOCKER, duration: 840, description: "Setting up PagerDuty and Slack alerts." },
        ],
      },
    ],
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
    rating: 4.6,
    studentsCount: 5430,
    tags: ["aws", "cloud", "ec2"],
    featured: false,
    sectionsData: [
      {
        title: "AWS Core Services",
        lessons: [
          { title: "EC2 & VPC", type: "video", content: YT_DOCKER, duration: 1200, description: "Virtual machines and networking.", isPreview: true },
          { title: "S3 & CloudFront", type: "video", content: YT_DOCKER, duration: 900, description: "Object storage and CDN." },
          { title: "RDS & DynamoDB", type: "video", content: YT_DOCKER, duration: 1020, description: "Managed relational and NoSQL databases." },
        ],
      },
      {
        title: "Serverless & Lambda",
        lessons: [
          { title: "Lambda Functions", type: "video", content: YT_DOCKER, duration: 960, description: "Event-driven serverless compute." },
          { title: "API Gateway + Lambda", type: "video", content: YT_DOCKER, duration: 840, description: "Building REST APIs without servers." },
          { title: "AWS Architecture Notes", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
    ],
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
    rating: 4.7,
    studentsCount: 9210,
    tags: ["python", "data", "ml"],
    featured: false,
    sectionsData: [
      {
        title: "Python for Data Science",
        lessons: [
          { title: "NumPy Fundamentals", type: "video", content: YT_DEMO, duration: 1080, description: "Arrays, broadcasting, and vectorization.", isPreview: true },
          { title: "Pandas DataFrames", type: "video", content: YT_DEMO, duration: 1200, description: "Data manipulation and analysis." },
          { title: "Data Wrangling Notes", type: "notes", content: NOTES_DEMO, duration: 0 },
        ],
      },
      {
        title: "Machine Learning Basics",
        lessons: [
          { title: "scikit-learn Introduction", type: "video", content: YT_DEMO, duration: 1080, description: "Train your first ML model." },
          { title: "Classification & Regression", type: "video", content: YT_DEMO, duration: 1140, description: "Supervised learning algorithms." },
          { title: "Model Evaluation", type: "video", content: YT_DEMO, duration: 900, description: "Accuracy, precision, recall, F1." },
          { title: "ML Exercises", type: "resource", content: "", resourceUrl: PDF_DEMO, duration: 0, description: "Practice notebooks and datasets." },
        ],
      },
    ],
  },
];

// ── Seed function ─────────────────────────────────────────────────────────
async function seedDatabase() {
  try {
    const count = await Course.countDocuments();
    if (count > 0) {
      logger.info("Database already seeded — skipping");
      return;
    }

    // Create users first
    let adminUser = await User.findOne({ email: "admin@olp.dev" });
    if (!adminUser) {
      adminUser = await User.create({ name: "Admin User", email: "admin@olp.dev", password: "admin123", role: "admin" });
    }

    if (!(await User.findOne({ email: "demo@olp.dev" }))) {
      await User.create({ name: "Demo Student", email: "demo@olp.dev", password: "demo123", role: "student" });
    }

    if (!(await User.findOne({ email: "instructor@olp.dev" }))) {
      await User.create({ name: "Sarah Chen", email: "instructor@olp.dev", password: "instructor123", role: "instructor" });
    }

    // Create each course + its sections + lessons
    for (const courseData of courses) {
      const { sectionsData, ...courseFields } = courseData;

      const course = await Course.create({
        ...courseFields,
        instructorId: adminUser._id,
        published: true,
        lessons: 0, // will be incremented as lessons are created
      });

      for (let si = 0; si < sectionsData.length; si++) {
        const sectionData = sectionsData[si];
        const section = await Section.create({
          course: course._id,
          title: sectionData.title,
          order: si,
        });

        const lessonIds = [];
        for (let li = 0; li < sectionData.lessons.length; li++) {
          const lessonData = sectionData.lessons[li];
          const lesson = await Lesson.create({
            section: section._id,
            course: course._id,
            title: lessonData.title,
            description: lessonData.description || "",
            type: lessonData.type,
            content: lessonData.content || "",
            resourceUrl: lessonData.resourceUrl || "",
            duration: lessonData.duration || 0,
            order: li,
            isPreview: lessonData.isPreview || false,
          });
          lessonIds.push(lesson._id);
        }

        section.lessons = lessonIds;
        await section.save();

        await Course.findByIdAndUpdate(course._id, {
          $push: { sections: section._id },
          $inc: { lessons: lessonIds.length },
        });
      }
    }

    logger.info(`Seeded ${courses.length} courses with full Section + Lesson content`);
  } catch (err) {
    logger.error("Seed failed", { error: err.message, stack: err.stack });
    throw err;
  }
}

// ── Force reseed (wipes existing data) ────────────────────────────────────
async function forceSeed() {
  await Course.deleteMany({});
  await Section.deleteMany({});
  await Lesson.deleteMany({});
  await seedDatabase();
}

// ── CLI entry point ───────────────────────────────────────────────────────
if (require.main === module) {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/olp";
  const force = process.argv.includes("--force");
  mongoose.connect(uri).then(async () => {
    if (force) {
      logger.info("Force reseed requested — clearing existing data...");
      await forceSeed();
    } else {
      await seedDatabase();
    }
    process.exit(0);
  }).catch((err) => {
    logger.error("Seed connection failed", { error: err.message });
    process.exit(1);
  });
}

module.exports = seedDatabase;
