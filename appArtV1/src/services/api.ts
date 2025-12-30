import axios from 'axios';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { useAuthStore } from '../stores/authStore';
import { API_CONFIG } from '../config/api';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

/**
 * Test backend connectivity
 * Useful for debugging network issues
 */
export const testBackendConnection = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await axios.get(`${API_CONFIG.BASE_URL}/health`, {
      timeout: 5000,
    });
    return {
      success: true,
      message: `Backend is reachable (${API_CONFIG.BASE_URL}) [${Platform.OS}, isDevice=${Device.isDevice}]`,
    };
  } catch (error: any) {
    if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
      return {
        success: false,
        message: `Cannot reach backend at ${API_CONFIG.BASE_URL} [${Platform.OS}, isDevice=${Device.isDevice}]. Ensure backend is running with --host 0.0.0.0`,
      };
    }
    if (error.code === 'ETIMEDOUT') {
      return {
        success: false,
        message: `Backend timeout. Check firewall settings for port 8000.`,
      };
    }
    return {
      success: false,
      message: `Connection error: ${error.message}`,
    };
  }
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const { accessToken } = useAuthStore.getState();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { refreshToken } = useAuthStore.getState();
        if (refreshToken) {
          const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.REFRESH}`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token } = response.data;
          useAuthStore.getState().setTokens(access_token, refresh_token);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh token failed, logout user
        useAuthStore.getState().logout();
      }
    }

    return Promise.reject(error);
  }
);

export default api;
