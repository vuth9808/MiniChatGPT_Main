import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000"
});

// Request interceptor: Add token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: Handle errors consistently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle different error codes
    switch (error?.response?.status) {
      case 401:
        // Session expired
        console.warn("Unauthorized: Invalid or missing token");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        break;

      case 429:
        // Rate limited - message will be handled in ChatPage
        console.warn("Rate limited: Too many requests");
        break;

      case 503:
        // Service unavailable
        console.warn("Service unavailable: API is down");
        break;

      case 504:
        // Timeout
        console.warn("Timeout: Request took too long");
        break;

      default:
        break;
    }

    return Promise.reject(error);
  }
);

export default api;


