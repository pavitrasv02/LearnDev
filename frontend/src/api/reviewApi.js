import api from "./axios";

export const reviewApi = {
  getReviews: (courseId, params) => api.get(`/courses/${courseId}/reviews`, { params }),
  createReview: (courseId, data) => api.post(`/courses/${courseId}/reviews`, data),
  updateReview: (courseId, reviewId, data) => api.put(`/courses/${courseId}/reviews/${reviewId}`, data),
  deleteReview: (courseId, reviewId) => api.delete(`/courses/${courseId}/reviews/${reviewId}`),
  voteHelpful: (courseId, reviewId) => api.patch(`/courses/${courseId}/reviews/${reviewId}/helpful`),
  reportReview: (courseId, reviewId, reason) => api.patch(`/courses/${courseId}/reviews/${reviewId}/report`, { reason }),
};

export const notificationApi = {
  getAll: (params) => api.get("/notifications", { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/read-all"),
  broadcast: (data) => api.post("/notifications/broadcast", data),
  notifyUser: (data) => api.post("/notifications/notify-user", data),
};

export const bookmarkApi = {
  getBookmarks: () => api.get("/users/bookmarks"),
  checkBookmark: (courseId) => api.get(`/courses/${courseId}/bookmark`),
  toggleBookmark: (courseId) => api.post(`/courses/${courseId}/bookmark`),
};

export const complaintApi = {
  submit: (data) => api.post("/complaints", data),
  getMyComplaints: (params) => api.get("/complaints", { params }),
  reply: (id, message) => api.post(`/complaints/${id}/reply`, { message }),
  // Admin
  getAll: (params) => api.get("/admin/complaints", { params }),
  update: (id, data) => api.patch(`/admin/complaints/${id}`, data),
  adminReply: (id, message) => api.post(`/admin/complaints/${id}/reply`, { message }),
};
