import axios from "axios";

let accessToken: string | null = null;

export function getStoredToken() {
  return accessToken;
}

export function setStoredToken(token: string) {
  accessToken = token;
}

export function clearStoredToken() {
  accessToken = null;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
