import api from "./axios";

export const adminApi = {
  getStats: () => api.get("/admin/stats"),
  getUsers: (params) => api.get("/admin/users", { params }),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  toggleBlockUser: (id) => api.patch(`/admin/users/${id}/block`),
  getUserEnrollments: (id) => api.get(`/admin/users/${id}/enrollments`),
  getCourses: (params) => api.get("/admin/courses", { params }),
  createCourse: (data) => api.post("/admin/courses", data),
  updateCourse: (id, data) => api.put(`/admin/courses/${id}`, data),
  deleteCourse: (id) => api.delete(`/admin/courses/${id}`),
  getEnrollments: (params) => api.get("/admin/enrollments", { params }),
  changePassword: (data) => api.patch("/admin/settings/password", data),
  updateProfile: (data) => api.put("/admin/settings/profile", data),
};
