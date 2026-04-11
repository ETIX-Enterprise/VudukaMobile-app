import axios, { AxiosInstance } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { auditLogger } from '../logging/auditLogger';

const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach JWT
apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: handle 401 auto-refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const currentToken = await SecureStore.getItemAsync('auth_token');
        const res = await axios.post(`${process.env.EXPO_PUBLIC_API_URL}/auth/refresh`, {}, {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const { token } = res.data;
        await SecureStore.setItemAsync('auth_token', token);
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch {
        // Refresh failed → force logout via event
        await SecureStore.deleteItemAsync('auth_token');
        // Emit logout event (listened by AuthContext)
      }
    }
    await auditLogger.log('API_ERROR', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default apiClient;