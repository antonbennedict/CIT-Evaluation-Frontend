import axios from 'axios';

const envUrl = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = envUrl !== undefined && envUrl !== '' ? envUrl : '';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

// Task 4: Axios Interceptor for secure JWT transmission
apiClient.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getApiErrorMessage = (error, fallback = 'Request failed. Please try again.') => {
  const serverMessage = error?.response?.data?.message || error?.response?.data?.error;
  return serverMessage || fallback;
};
