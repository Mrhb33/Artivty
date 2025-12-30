import api from './api';
import { useAuthStore } from '../stores/authStore';
import * as SecureStore from 'expo-secure-store';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  name: string;
  username?: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

// Secure storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export const authService = {
  // Login user
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    const { access_token, refresh_token } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh_token);

    // Update Zustand store
    useAuthStore.getState().setTokens(access_token, refresh_token);

    return response.data;
  },

  // Register user
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    const { access_token, refresh_token } = response.data;

    // Store tokens securely
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, access_token);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refresh_token);

    // Update Zustand store
    useAuthStore.getState().setTokens(access_token, refresh_token);

    return response.data;
  },

  // Logout user
  async logout(): Promise<void> {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);

      // Clear Zustand store
      useAuthStore.getState().logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  // Check if user is authenticated
  async checkAuth(): Promise<boolean> {
    try {
      const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
      const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

      if (accessToken && refreshToken) {
        useAuthStore.getState().setTokens(accessToken, refreshToken);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  },

  // Get current user profile
  async getCurrentUser() {
    const response = await api.get('/users/me');
    return response.data;
  },

  // Update current user profile
  async updateUser(updates: { name?: string; bio?: string; profile_picture_url?: string | null; role?: 'customer' | 'artist' }) {
    const response = await api.put('/users/me', updates);
    return response.data;
  },
};
