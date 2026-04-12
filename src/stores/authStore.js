// ============================================================
// Auth Store
// Manages authentication state, login, register, and profile
// ============================================================

import { createContext, useContext, useReducer, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

// Initial state
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      };
    case 'LOGOUT':
      return { ...initialState, isInitialized: true };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload }, isLoading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'INIT_COMPLETE':
      return { ...state, isInitialized: true, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext(null);

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const initialize = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (token) {
        const response = await api.auth.getMe();
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: response.data } });
      } else {
        dispatch({ type: 'INIT_COMPLETE' });
      }
    } catch {
      await AsyncStorage.removeItem('access_token');
      await AsyncStorage.removeItem('refresh_token');
      dispatch({ type: 'INIT_COMPLETE' });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.auth.login({ email, password });
      const { user, session } = response.data;

      await AsyncStorage.setItem('access_token', session.access_token);
      await AsyncStorage.setItem('refresh_token', session.refresh_token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { user } });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.auth.register(userData);
      dispatch({ type: 'SET_ERROR', payload: null });
      dispatch({ type: 'INIT_COMPLETE' });
      return { success: true, message: response.message };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout API errors
    }
    await AsyncStorage.removeItem('access_token');
    await AsyncStorage.removeItem('refresh_token');
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateProfile = useCallback(async (data) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.auth.updateProfile(data);
      dispatch({ type: 'UPDATE_USER', payload: response.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    initialize,
    login,
    register,
    logout,
    updateProfile,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default useAuth;
