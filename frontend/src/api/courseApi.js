/**
 * Course Builder API — section and lesson management.
 * Uses the authenticated axios instance (Bearer token auto-attached).
 */
import api from "./axios";

export const courseApi = {
  // ── Course ─────────────────────────────────────────────────────────────
  getCourse: (slug) => api.get(`/courses/${slug}`),
  getCourseById: (id) => api.get(`/courses/by-id/${id}`),
  createCourse: (data) => api.post("/courses", data),
  updateCourse: (id, data) => api.put(`/courses/${id}`, data),
  publishCourse: (id) => api.patch(`/courses/${id}/publish`),
  deleteCourse: (id) => api.delete(`/courses/${id}`),

  // ── Sections ───────────────────────────────────────────────────────────
  getSections: (courseId) => api.get(`/courses/${courseId}/sections`),
  createSection: (courseId, data) => api.post(`/courses/${courseId}/sections`, data),
  updateSection: (courseId, sectionId, data) =>
    api.put(`/courses/${courseId}/sections/${sectionId}`, data),
  deleteSection: (courseId, sectionId) =>
    api.delete(`/courses/${courseId}/sections/${sectionId}`),
  reorderSections: (courseId, orderedIds) =>
    api.put(`/courses/${courseId}/sections/reorder`, { orderedIds }),

  // ── Lessons ────────────────────────────────────────────────────────────
  createLesson: (courseId, sectionId, data) =>
    api.post(`/courses/${courseId}/sections/${sectionId}/lessons`, data),
  updateLesson: (courseId, sectionId, lessonId, data) =>
    api.put(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, data),
  deleteLesson: (courseId, sectionId, lessonId) =>
    api.delete(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),
  getLesson: (courseId, sectionId, lessonId) =>
    api.get(`/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`),
};
