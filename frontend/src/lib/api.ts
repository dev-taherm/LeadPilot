import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, setToken, getRefreshToken, clearTokens } from './auth';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();
      if (refreshToken) {
        try {
          const { data } = await axios.post(
            `${api.defaults.baseURL}/auth/token/refresh/`,
            { refresh: refreshToken }
          );
          setToken(data.access);
          if (data.refresh) setToken(data.refresh);
          originalRequest.headers.Authorization = `Bearer ${data.access}`;
          return api(originalRequest);
        } catch {
          clearTokens();
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return Promise.reject(error);
        }
      } else {
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return Promise.reject(error);
  }
);

export function get<T>(url: string, params?: Record<string, unknown>) {
  return api.get<T>(url, { params });
}

export function post<T>(url: string, data?: unknown) {
  return api.post<T>(url, data);
}

export function put<T>(url: string, data?: unknown) {
  return api.put<T>(url, data);
}

export function patch<T>(url: string, data?: unknown) {
  return api.patch<T>(url, data);
}

export function del<T>(url: string) {
  return api.delete<T>(url);
}

export default api;
