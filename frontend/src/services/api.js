import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4000/api"
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.dispatchEvent(new Event("auth-expired"));
      }
    }
    return Promise.reject(error);
  }
);

export const loginUser = (payload) => api.post("/auth/login", payload).then((res) => res.data);
export const registerUser = (payload) => api.post("/auth/register", payload).then((res) => res.data);
export const uploadDataset = (file) => {
  const form = new FormData();
  form.append("file", file);
  return api.post("/dataset/upload", form).then((res) => res.data);
};
export const getDatasets = () => api.get("/dataset").then((res) => res.data);
export const trainModel = (payload) => api.post("/ml/train", payload).then((res) => res.data);
export const predict = (payload) => api.post("/ml/predict", payload).then((res) => res.data);
export const evaluate = () => api.get("/ml/evaluate").then((res) => res.data);
export const getHistory = () => api.get("/ml/history").then((res) => res.data);
export const adminOverview = () => api.get("/admin/overview").then((res) => res.data);
export const adminUsers = () => api.get("/admin/users").then((res) => res.data);
