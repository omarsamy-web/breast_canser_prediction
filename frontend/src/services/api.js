import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api",
  timeout: 45000
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config: req, response } = error;

    // Retry idempotent GET requests twice on network errors / 5xx / timeouts.
    const retryable = !response || response.status >= 500 || error.code === "ECONNABORTED";
    const isGet = (req?.method || "get").toLowerCase() === "get";
    if (retryable && isGet && req && (req.__retries || 0) < 2) {
      req.__retries = (req.__retries || 0) + 1;
      await new Promise((resolve) => setTimeout(resolve, 800 * req.__retries));
      return api.request(req);
    }

    if (response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.dispatchEvent(new Event("auth-expired"));
      }
    }
    return Promise.reject(error);
  }
);

function toMessage(error, fallback) {
  return error?.response?.data?.message || (error?.code === "ECONNABORTED" ? "The server took too long to respond. Please try again." : fallback);
}

export const loginUser = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const registerUser = (payload) =>
  api.post("/auth/register", payload).then((res) => res.data).catch((e) => Promise.reject(new Error(toMessage(e, "Registration failed"))));
export const predict = (payload) => api.post("/ml/predict", payload).then((res) => res.data);
export const evaluate = () => api.get("/ml/evaluate").then((res) => res.data);
export const analyzeDataset = () => api.get("/ml/analyze").then((res) => res.data);
export const getHistory = () => api.get("/ml/history").then((res) => res.data);
export const adminOverview = () => api.get("/admin/overview").then((res) => res.data);
export const adminUsers = () => api.get("/admin/users").then((res) => res.data);
export const getPublicPlans = () => api.get("/plans").then((res) => res.data.plans);
export const getBilling = () => api.get("/billing").then((res) => res.data);
export const changePlan = (plan) => api.post("/billing/plan", { plan }).then((res) => res.data);
export const getCreditStatus = () => api.get("/credits").then((res) => res.data);
export const checkoutCredits = (pack) => api.post("/checkout", { pack }).then((res) => res.data);
