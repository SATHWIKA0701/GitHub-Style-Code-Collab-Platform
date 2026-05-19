import axios from "axios";

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
  withCredentials: true,
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("ccp-token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.response?.data);

    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message;

    return Promise.reject(new Error(message));
  }
);

export default http;