/**
 * AI API client — all calls go through the backend.
 * The Gemini API key is NEVER exposed to the frontend.
 */
import api from "./axios";

export const aiApi = {
  ask:              (data) => api.post("/ai/ask", data),
  summary:          (data) => api.post("/ai/summary", data),
  quiz:             (data) => api.post("/ai/quiz", data),
  flashcards:       (data) => api.post("/ai/flashcards", data),
  mentorReport:     ()     => api.get("/ai/mentor"),
  interviewScore:   ()     => api.get("/ai/interview-score"),
  recommendations:  (params) => api.get("/ai/recommendations", { params }),
};
