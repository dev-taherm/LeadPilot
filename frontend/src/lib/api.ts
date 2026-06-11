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

    if (error.response?.data) {
      const errData = error.response.data as Record<string, unknown>;
      const backendError = errData.error as { message?: string } | undefined;

      let message: string | null = null;

      if (errData.errors && typeof errData.errors === 'object') {
        const fieldErrors = errData.errors as Record<string, string | string[]>;
        const first = Object.values(fieldErrors)[0];
        message = Array.isArray(first) ? first[0] : String(first);
      }

      if (!message) {
        message =
          (errData.message as string) ||
          backendError?.message ||
          (typeof errData.detail === 'string' ? errData.detail : null);
      }

      if (message) {
        return Promise.reject(new Error(message));
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
