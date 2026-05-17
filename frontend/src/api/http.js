import axios from 'axios';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

const extractErrorMessage = (error) => {
  const data = error.response?.data;

  if (data?.details && Array.isArray(data.details)) {
    return data.details.map((item) => item.message).join('\n');
  }

  return data?.message || data?.error || error.message || 'Something went wrong';
};

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('ccp-token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(new Error(extractErrorMessage(error)));
  }
);

export default http;