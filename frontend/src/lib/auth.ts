import { jwtDecode } from 'jwt-decode';
import { post } from './api';
import type { User, ApiResponse } from '@/types';

interface TokenPair {
  access: string;
  refresh: string;
}

interface JWTPayload {
  user_id: number;
  email: string;
  role: string;
  exp: number;
}

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;
  try {
    const payload = jwtDecode<JWTPayload>(token);
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function getUser(): User | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = jwtDecode<JWTPayload>(token);
    return {
      id: payload.user_id,
      email: payload.email,
      role: payload.role as User['role'],
      first_name: '',
      last_name: '',
      phone: '',
      avatar: null,
      business_id: null,
    };
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<TokenPair> {
  const { data } = await post<ApiResponse<TokenPair>>('/auth/login/', { email, password });
  if (!data.data) throw new Error(data.message || 'Login failed');
  setToken(data.data.access);
  setRefreshToken(data.data.refresh);
  return data.data;
}

export async function register(payload: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  business_name?: string;
}): Promise<TokenPair> {
  const { data } = await post<ApiResponse<TokenPair>>('/auth/register/', payload);
  if (!data.data) throw new Error(data.message || 'Registration failed');
  setToken(data.data.access);
  setRefreshToken(data.data.refresh);
  return data.data;
}

export function logout(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
