import axiosClient from '../api/axiosClient';
import type { ApiResponse, AuthResponseData, User } from '../api/types';

const TOKEN_KEY = 'synccampus_token';
const USER_KEY = 'synccampus_user';

export interface RegisterPayload {
  fullName: string;
  email: string;
  password: string;
  role: 'student' | 'faculty_leadership' | 'admin';
  title?: string;
  department?: string;
  studentIdNo?: string;
  phoneNumber?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

function persistSession(data: AuthResponseData) {
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponseData> {
    const res = await axiosClient.post<ApiResponse<AuthResponseData>>('/auth/register', payload);
    persistSession(res.data.data);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponseData> {
    const res = await axiosClient.post<ApiResponse<AuthResponseData>>('/auth/login', payload);
    persistSession(res.data.data);
    return res.data.data;
  },

  async getMe(): Promise<User> {
    const res = await axiosClient.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data.data.user;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getStoredUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    
    // Safety guard: If raw is empty or literal "undefined", return null safely
    if (!raw || raw === 'undefined') {
      return null;
    }

    try {
      return JSON.parse(raw) as User;
    } catch (error) {
      console.error('Failed to parse stored user data:', error);
      return null; 
    }
  },

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  },
};
