/**
 * AI Service — Google Gemini integration with Redis caching.
 *
 * Architecture: Express → aiService → Redis cache → Gemini API
 * The API key is NEVER sent to the frontend.
 * All AI calls go through the backend.
 */
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { getRedis } = require("../config/redis");
const logger = require("../config/logger");

// Lazy-initialize so the app starts even if GEMINI_API_KEY is not set yet
let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY is not configured");
    genAI = new GoogleGenerativeAI(key);
    // Try gemini-1.5-flash first (fastest/cheapest), fallback alias also accepted
    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
    model = genAI.getGenerativeModel({ model: modelName });
    logger.info("Gemini AI initialized", { model: modelName });
  }
  return model;
}

const CACHE_TTL = Number(process.env.AI_CACHE_TTL) || 3600; // 1 hour default

// ── Cache helpers ─────────────────────────────────────────────────────────
function buildCacheKey(type, ...parts) {
  return `ai:${type}:${parts.map((p) => String(p).slice(0, 60)).join(":")}`;
}

async function getCached(key) {
  const redis = getRedis();
  if (!redis) return null;
  try {
    const val = await redis.get(key);
    return val ? JSON.parse(val) : null;
  } catch { return null; }
}

async function setCached(key, value, ttl = CACHE_TTL) {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.setex(key, ttl, JSON.stringify(value));
  } catch { /* silently ignore */ }
}

// ── Core Gemini call ──────────────────────────────────────────────────────
async function callGemini(prompt, cacheKey = null) {
  if (cacheKey) {
    const cached = await getCached(cacheKey);
    if (cached) {
      logger.info("AI cache hit", { cacheKey });
      return { ...cached, cached: true };
    }
  }

  let m;
  try {
    m = getModel();
  } catch (err) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    const result = await m.generateContent(prompt);
    const text = result.response.text();
    const response = { text, cached: false, generatedAt: new Date().toISOString() };
    if (cacheKey) await setCached(cacheKey, response);
    return response;
  } catch (err) {
    logger.error("Gemini API call failed", { error: err.message, code: err.status });
    // Surface friendly error messages
    if (err.status === 429) throw new Error("AI rate limit reached. Please wait a moment and try again.");
    if (err.status === 400) throw new Error("Invalid request to AI. Please try a different question.");
    if (err.status === 403) throw new Error("Gemini API key is invalid or has insufficient permissions.");
    if (err.message?.includes("API_KEY_INVALID")) throw new Error("Gemini API key is invalid. Please check your GEMINI_API_KEY.");
    throw new Error("AI service temporarily unavailable. Please try again.");
  }
}

// ── Context builder — keeps prompts consistent ────────────────────────────
function buildContext({ course, section, lesson, enrollment }) {
  const parts = [];
  if (course) parts.push(`Course: "${course.title}" (${course.category}, ${course.level})`);
  if (section) parts.push(`Section: "${section.title}"`);
  if (lesson) {
    parts.push(`Lesson: "${lesson.title}"`);
    if (lesson.description) parts.push(`Description: ${lesson.description}`);
    if (lesson.type === "notes" && lesson.content) {
      // Limit content to avoid token overflow
      parts.push(`Lesson Content:\n${lesson.content.slice(0, 2000)}`);
    }
  }
  if (enrollment) parts.push(`Student Progress: ${enrollment.progress || 0}% complete`);
  return parts.join("\n");
}

// ── 1. Chat / Ask AI ──────────────────────────────────────────────────────
async function askAI({ question, course, section, lesson, enrollment }) {
  const ctx = buildContext({ course, section, lesson, enrollment });
  const prompt = `You are an expert coding and technology tutor inside the LearnDev platform.
The student is learning in this context:
${ctx}

Student question: "${question}"

Answer as a knowledgeable mentor. Be concise, practical and use examples where helpful.
Use markdown formatting with code blocks where relevant.`;

  // Don't cache individual questions — they're user-specific
  return callGemini(prompt);
}

// ── 2. Lesson Summary ─────────────────────────────────────────────────────
async function generateSummary({ course, section, lesson }) {
  const ctx = buildContext({ course, section, lesson });
  const cacheKey = buildCacheKey("summary", lesson?._id || lesson?.title || "");

  const prompt = `You are an expert technical writer for LearnDev, an online learning platform.
Context:
${ctx}

Generate a comprehensive lesson summary with these sections:
## Key Concepts
(3-5 bullet points of the main concepts)

## Important Points
(practical takeaways)

## Common Mistakes
(what students often get wrong)

## Interview Questions
(3 relevant interview questions with brief answers)

## Quick Revision
(one-paragraph summary for revision)

Use markdown formatting.`;

  return callGemini(prompt, cacheKey);
}

// ── 3. Quiz Generator ─────────────────────────────────────────────────────
async function generateQuiz({ course, section, lesson, difficulty = "medium", count = 5, scope = "lesson" }) {
  const ctx = buildContext({ course, section, lesson });
  const scopeLabel = scope === "course" ? "entire course" : scope === "section" ? "current section" : "current lesson";
  const cacheKey = buildCacheKey("quiz", lesson?._id || "", difficulty, count, scope);

  const prompt = `You are a quiz generator for LearnDev.
Context:
${ctx}
Scope: ${scopeLabel}
Difficulty: ${difficulty}

Generate ${count} multiple-choice questions. Return ONLY valid JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "question text",
    "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
    "correctAnswer": "A",
    "explanation": "why this is correct",
    "difficulty": "${difficulty}"
  }
]
No extra text, only the JSON array.`;

  const result = await callGemini(prompt, cacheKey);

  // Parse the JSON from the AI response
  try {
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      result.questions = JSON.parse(jsonMatch[0]);
    } else {
      result.questions = [];
    }
  } catch {
    result.questions = [];
  }
  return result;
}

// ── 4. Flashcard Generator ────────────────────────────────────────────────
async function generateFlashcards({ course, section, lesson, count = 8 }) {
  const ctx = buildContext({ course, section, lesson });
  const cacheKey = buildCacheKey("flashcards", lesson?._id || "", count);

  const prompt = `You are a flashcard generator for LearnDev.
Context:
${ctx}

Generate ${count} flashcards. Return ONLY valid JSON array:
[
  {
    "id": 1,
    "front": "question or concept",
    "back": "answer or explanation"
  }
]
No extra text, only the JSON array.`;

  const result = await callGemini(prompt, cacheKey);

  try {
    const jsonMatch = result.text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      result.flashcards = JSON.parse(jsonMatch[0]);
    } else {
      result.flashcards = [];
    }
  } catch {
    result.flashcards = [];
  }
  return result;
}

// ── 5. Study Mentor Report ────────────────────────────────────────────────
async function generateMentorReport({ studentName, enrollments, certificates, totalStudyMinutes }) {
  const cacheKey = buildCacheKey("mentor", studentName, enrollments.length, certificates.length);

  const coursesSummary = enrollments.map((e) =>
    `- ${e.course?.title || "Unknown"} (${e.progress || 0}% complete, status: ${e.status})`
  ).join("\n");

  const certsSummary = certificates.map((c) => `- ${c.courseTitle}`).join("\n") || "None yet";

  const prompt = `You are an AI Study Mentor for LearnDev, an online learning platform.

Student: ${studentName}
Courses enrolled:
${coursesSummary || "No enrollments yet"}

Certificates earned:
${certsSummary}

Total study time: ~${Math.round((totalStudyMinutes || 0) / 60)} hours

Generate a personalized Learning Health Report. Return ONLY valid JSON:
{
  "healthScore": <0-100 number>,
  "consistency": "<low|medium|high>",
  "strongSubjects": ["subject1", "subject2"],
  "weakSubjects": ["subject1", "subject2"],
  "estimatedCompletionDays": <number>,
  "recommendedDailyHours": <number>,
  "insights": ["insight1", "insight2", "insight3"],
  "nextRecommendedCourse": "<course title or topic>",
  "weeklyGoal": "<specific actionable goal>",
  "motivationalMessage": "<short personalized message>"
}
No extra text, only JSON.`;

  const result = await callGemini(prompt, cacheKey);
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    result.report = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    result.report = null;
  }
  return result;
}

// ── 6. Interview Readiness Score ──────────────────────────────────────────
async function generateInterviewScore({ studentName, enrollments, certificates, quizScores = [] }) {
  const cacheKey = buildCacheKey("interview", studentName, enrollments.length, certificates.length);

  const completed = enrollments.filter((e) => e.status === "completed");
  const inProgress = enrollments.filter((e) => e.status === "active");
  const avgProgress = inProgress.length
    ? Math.round(inProgress.reduce((a, e) => a + (e.progress || 0), 0) / inProgress.length)
    : 0;

  const completedCourses = completed.map((e) => e.course?.title).filter(Boolean);
  const inProgressCourses = inProgress.map((e) => `${e.course?.title} (${e.progress || 0}%)`).filter(Boolean);

  const prompt = `You are an Interview Readiness Evaluator for tech professionals.

Student: ${studentName}
Completed courses: ${completedCourses.join(", ") || "None"}
In progress: ${inProgressCourses.join(", ") || "None"}
Certificates: ${certificates.length}
Average course progress: ${avgProgress}%

Calculate interview readiness for a software development role. Return ONLY valid JSON:
{
  "score": <0-100>,
  "grade": "<A|B|C|D|F>",
  "level": "<Junior|Mid-level|Senior>",
  "strengths": ["topic1", "topic2", "topic3"],
  "improvements": ["topic1", "topic2", "topic3"],
  "recommendations": ["action1", "action2", "action3"],
  "topicsToRevise": ["topic1", "topic2"],
  "estimatedReadyInDays": <number or 0 if ready>,
  "radarData": [
    {"subject": "Frontend", "score": <0-100>},
    {"subject": "Backend", "score": <0-100>},
    {"subject": "DevOps", "score": <0-100>},
    {"subject": "System Design", "score": <0-100>},
    {"subject": "Data Structures", "score": <0-100>},
    {"subject": "Cloud", "score": <0-100>}
  ],
  "summary": "<2-3 sentence personalized assessment>"
}
No extra text, only JSON.`;

  const result = await callGemini(prompt, cacheKey);
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    result.data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    result.data = null;
  }
  return result;
}

// ── 7. Recommendations ───────────────────────────────────────────────────
async function generateRecommendations({ enrollments, bookmarks, category }) {
  const completed = enrollments.filter((e) => e.status === "completed").map((e) => e.course?.title).filter(Boolean);
  const inProgress = enrollments.filter((e) => e.status === "active").map((e) => e.course?.title).filter(Boolean);
  const savedCategories = bookmarks.map((b) => b.course?.category).filter(Boolean);
  const cacheKey = buildCacheKey("recs", completed.length, category || "any");

  const prompt = `You are a Learning Path Advisor for LearnDev.

Completed courses: ${completed.join(", ") || "none"}
Currently studying: ${inProgress.join(", ") || "none"}
Bookmarked categories: ${[...new Set(savedCategories)].join(", ") || "none"}
Primary interest: ${category || "software development"}

Suggest a personalized learning path. Return ONLY valid JSON:
{
  "nextTopics": ["topic1", "topic2", "topic3"],
  "recommendedCategories": ["cat1", "cat2"],
  "learningPath": ["step1", "step2", "step3", "step4"],
  "practiceAreas": ["area1", "area2"],
  "reason": "<one sentence explaining why these recommendations>"
}
No extra text, only JSON.`;

  const result = await callGemini(prompt, cacheKey);
  try {
    const jsonMatch = result.text.match(/\{[\s\S]*\}/);
    result.data = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch {
    result.data = null;
  }
  return result;
}

module.exports = {
  askAI,
  generateSummary,
  generateQuiz,
  generateFlashcards,
  generateMentorReport,
  generateInterviewScore,
  generateRecommendations,
};
