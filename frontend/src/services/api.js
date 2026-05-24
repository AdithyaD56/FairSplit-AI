import axios from "axios";

export const TOKEN_KEY = "fairsplit_token";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
});

export function getWebSocketUrl(pathname = "/ws/live", token) {
  const base = api.defaults.baseURL || window.location.origin;
  const url = new URL(pathname, base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  if (token) {
    url.searchParams.set("token", token);
  }
  return url.toString();
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  signup: async (payload) => {
    const { data } = await api.post("/signup", payload);
    return data;
  },
  login: async (payload) => {
    const { data } = await api.post("/login", payload);
    return data;
  },
  me: async () => {
    const { data } = await api.get("/me");
    return data;
  },
  getOAuthUrl: async (provider) => {
    const { data } = await api.get(`/oauth/${provider}/url`);
    return data.url;
  },
  forgotPassword: async (payload) => {
    const { data } = await api.post("/forgot-password", payload);
    return data;
  },
  verifyResetCode: async (payload) => {
    const { data } = await api.post("/verify-reset-code", payload);
    return data;
  },
  resetPassword: async (payload) => {
    const { data } = await api.post("/reset-password", payload);
    return data;
  },
};

export const expenseApi = {
  analyzeExpense: async (scenario) => {
    const { data } = await api.post("/analyze-expense", { scenario });
    return data;
  },
  getHistory: async () => {
    const { data } = await api.get("/history");
    return data;
  },
  planTripBudget: async (payload) => {
    const { data } = await api.post("/plan-trip-budget", payload);
    return data;
  },
  planTripFromPrompt: async (payload) => {
    const { data } = await api.post("/plan-trip-from-prompt", payload);
    return data;
  },
  getLiveInsights: async (payload) => {
    const { data } = await api.post("/integrations/live-insights", payload);
    return data;
  },
  getTravelAssistant: async (payload) => {
    const { data } = await api.post("/integrations/travel-assistant", payload);
    return data;
  },
  chatAssistant: async (payload) => {
    const { data } = await api.post("/integrations/assistant-chat", payload);
    return data;
  },
};

export const adminApi = {
  getOverview: async () => {
    const { data } = await api.get("/admin/overview");
    return data;
  },
  getReviews: async () => {
    const { data } = await api.get("/admin/reviews");
    return data;
  },
  getDeveloperProfile: async () => {
    const { data } = await api.get("/admin/developer-profile");
    return data;
  },
  updateDeveloperProfile: async (payload) => {
    const { data } = await api.put("/admin/developer-profile", payload);
    return data;
  },
  uploadDeveloperAvatar: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post("/admin/developer-profile/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
  getUsers: async () => {
    const { data } = await api.get("/admin/users");
    return data;
  },
  getExpenses: async () => {
    const { data } = await api.get("/admin/expenses");
    return data;
  },
  deleteUser: async (userId) => {
    await api.delete(`/admin/users/${userId}`);
  },
  deleteExpense: async (expenseId) => {
    await api.delete(`/admin/expenses/${expenseId}`);
  },
};

export const developerApi = {
  getProfile: async () => {
    const { data } = await api.get("/developer-profile");
    return data;
  },
};

export const tripApi = {
  generateTrip: async (payload) => {
    const { data } = await api.post("/trips/generate", payload);
    return data;
  },
  getTrips: async () => {
    const { data } = await api.get("/trips");
    return data;
  },
  getTrip: async (tripId) => {
    const { data } = await api.get(`/trips/${tripId}`);
    return data;
  },
};

export const notificationApi = {
  getNotifications: async () => {
    const { data } = await api.get("/notifications");
    return data;
  },
  markRead: async (notificationId) => {
    const { data } = await api.patch(`/notifications/${notificationId}/read`);
    return data;
  },
  markAllRead: async () => {
    const { data } = await api.patch("/notifications/read-all");
    return data;
  },
};

export const reviewApi = {
  getReviews: async () => {
    const { data } = await api.get("/reviews");
    return data;
  },
  getMyReviews: async () => {
    const { data } = await api.get("/reviews/me");
    return data;
  },
  createReview: async (payload) => {
    const { data } = await api.post("/reviews", payload);
    return data;
  },
};

export function getApiError(error) {
  return error?.response?.data?.detail || "Something went wrong. Please try again.";
}
