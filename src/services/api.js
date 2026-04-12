// ============================================================
// API Service
// Axios-based HTTP client for the backend API
// ============================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_API_PORT = '3000';

const getExpoHost = () => {
  const hostCandidates = [
    Constants.expoConfig?.hostUri,
    Constants.expoGoConfig?.debuggerHost,
    Constants.manifest2?.extra?.expoClient?.hostUri,
    Constants.manifest?.debuggerHost,
  ];

  const resolvedHost = hostCandidates.find((value) => typeof value === 'string' && value.length > 0);
  return resolvedHost ? resolvedHost.split(':')[0] : null;
};

const getApiBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `http://${window.location.hostname}:${DEFAULT_API_PORT}/api`;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_API_PORT}/api`;
  }

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${DEFAULT_API_PORT}/api`;
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
};

const API_BASE_URL = getApiBaseUrl();

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  async getHeaders() {
    const token = await AsyncStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = await this.getHeaders();

    const config = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw {
          status: response.status,
          message: data.error || 'An error occurred',
          details: data.details,
        };
      }

      return data;
    } catch (error) {
      if (error.status) throw error;
      throw {
        status: 0,
        message: `Network error. Could not reach ${this.baseUrl}. Make sure the backend server is running and reachable from this device.`,
      };
    }
  }

  // GET request
  async get(endpoint, params = {}) {
    const queryString = Object.keys(params).length
      ? '?' + new URLSearchParams(params).toString()
      : '';
    return this.request(`${endpoint}${queryString}`, { method: 'GET' });
  }

  // POST request
  async post(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  // PATCH request
  async patch(endpoint, body = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  // DELETE request
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // POST with FormData (for file uploads)
  async postFormData(endpoint, formData) {
    const token = await AsyncStorage.getItem('access_token');
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw { status: response.status, message: data.error || 'Upload failed' };
      }
      return data;
    } catch (error) {
      if (error.status) throw error;
      throw { status: 0, message: 'Network error during upload.' };
    }
  }

  // ============================================================
  // AUTH ENDPOINTS
  // ============================================================
  auth = {
    register: (data) => this.post('/auth/register', data),
    login: (data) => this.post('/auth/login', data),
    getMe: () => this.get('/auth/me'),
    updateProfile: (data) => this.patch('/auth/profile', data),
    logout: () => this.post('/auth/logout'),
  };

  // ============================================================
  // REPORT ENDPOINTS
  // ============================================================
  reports = {
    create: (formData) => this.postFormData('/reports', formData),
    getAll: (params) => this.get('/reports', params),
    getById: (id) => this.get(`/reports/${id}`),
    updateStatus: (id, data) => this.patch(`/reports/${id}/status`, data),
    addComment: (id, data) => this.post(`/reports/${id}/comments`, data),
  };

  // ============================================================
  // ITEM ENDPOINTS
  // ============================================================
  items = {
    create: (data) => this.post('/items', data),
    getAll: (params) => this.get('/items', params),
    getById: (id) => this.get(`/items/${id}`),
    getByQR: (qrCode) => this.get(`/items/qr/${qrCode}`),
    update: (id, data) => this.patch(`/items/${id}`, data),
    retire: (id) => this.delete(`/items/${id}`),
  };

  // ============================================================
  // BORROW ENDPOINTS
  // ============================================================
  borrow = {
    create: (data) => this.post('/borrow', data),
    getAll: (params) => this.get('/borrow', params),
    approve: (id, data) => this.patch(`/borrow/${id}/approve`, data),
    activate: (id) => this.patch(`/borrow/${id}/activate`),
    returnItem: (id, data) => this.patch(`/borrow/${id}/return`, data),
    checkOverdue: () => this.post('/borrow/check-overdue'),
  };

  // ============================================================
  // NOTIFICATION ENDPOINTS
  // ============================================================
  notifications = {
    getAll: (params) => this.get('/notifications', params),
    getUnreadCount: () => this.get('/notifications/unread-count'),
    markAsRead: (id) => this.patch(`/notifications/${id}/read`),
    markAllAsRead: () => this.patch('/notifications/read-all'),
  };

  // ============================================================
  // ADMIN ENDPOINTS
  // ============================================================
  admin = {
    getAnalytics: () => this.get('/admin/analytics'),
    getActivityLogs: (params) => this.get('/admin/activity-logs', params),
    getUsers: (params) => this.get('/admin/users', params),
    getStaff: () => this.get('/admin/staff'),
    getPendingApprovals: () => this.get('/admin/pending-approvals'),
    approveUser: (id, data) => this.patch(`/admin/users/${id}/approve`, data),
    updateUserRole: (id, role) => this.patch(`/admin/users/${id}/role`, { role }),
    toggleUserStatus: (id) => this.patch(`/admin/users/${id}/status`),
  };
}

export const api = new ApiService();
export default api;
