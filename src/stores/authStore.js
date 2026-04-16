// ============================================================
// Auth Store
// Manages authentication state, login, register, and profile
// ============================================================

import { createContext, useContext, useReducer, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../services/api";
import { supabase } from "../services/supabase";

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
    case "SET_LOADING":
      return { ...state, isLoading: true, error: null };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        isInitialized: true,
        error: null,
      };
    case "LOGOUT":
      return { ...initialState, isInitialized: true };
    case "UPDATE_USER":
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        isLoading: false,
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "INIT_COMPLETE":
      return { ...state, isInitialized: true, isLoading: false };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    default:
      return state;
  }
};

// Context
const AuthContext = createContext(null);

// Refs to store external clear functions
const reportClearRef = { current: null };
const borrowClearRef = { current: null };

// Functions to register external clear functions
export const registerReportClear = (clearFn) => {
  reportClearRef.current = clearFn;
};

export const registerBorrowClear = (clearFn) => {
  borrowClearRef.current = clearFn;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const ensureSupabaseSession = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      return session;
    }

    const token = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (!token || !refreshToken) return null;

    const { data, error } = await supabase.auth.setSession({
      access_token: token,
      refresh_token: refreshToken,
    });

    if (error) {
      return null;
    }

    return data.session || null;
  }, []);

  const initialize = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      const refreshToken = await AsyncStorage.getItem("refresh_token");
      if (token) {
        if (refreshToken) {
          await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken,
          });
        }
        const response = await api.auth.getMe();
        dispatch({ type: "LOGIN_SUCCESS", payload: { user: response.data } });
      } else {
        dispatch({ type: "INIT_COMPLETE" });
      }
    } catch {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
      dispatch({ type: "INIT_COMPLETE" });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.auth.login({ email, password });
      const { user, session } = response.data;

      await AsyncStorage.setItem("access_token", session.access_token);
      await AsyncStorage.setItem("refresh_token", session.refresh_token);
      await supabase.auth.setSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });

      dispatch({ type: "LOGIN_SUCCESS", payload: { user } });
      // Clear report and borrow store data on successful login
      if (reportClearRef.current) reportClearRef.current();
      if (borrowClearRef.current) borrowClearRef.current();
      return { success: true };
    } catch (error) {
      const isApprovalError = error.message
        ?.toLowerCase()
        .includes("pending approval");
      dispatch({ type: "SET_ERROR", payload: error.message });
      return {
        success: false,
        error: error.message,
        errorType: isApprovalError ? "pending_approval" : "generic",
      };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.auth.register(userData);
      dispatch({ type: "SET_ERROR", payload: null });
      dispatch({ type: "INIT_COMPLETE" });
      return { success: true, message: response.message };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.auth.logout();
    } catch {
      // Ignore logout API errors
    }
    await AsyncStorage.removeItem("access_token");
    await AsyncStorage.removeItem("refresh_token");
    await supabase.auth.signOut();
    // Clear report and borrow store data on logout
    if (reportClearRef.current) reportClearRef.current();
    if (borrowClearRef.current) borrowClearRef.current();
    dispatch({ type: "LOGOUT" });
  }, []);

  const updateProfile = useCallback(
    async (data) => {
      dispatch({ type: "SET_LOADING" });
      if (!state.user?.id) {
        dispatch({
          type: "SET_ERROR",
          payload: "No authenticated user found.",
        });
        return { success: false, error: "No authenticated user found." };
      }

      // Supabase-first update so profile edits work even when local backend is offline.
      try {
        await ensureSupabaseSession();
        const { data: updatedUser, error: supabaseError } = await supabase
          .from("users")
          .update(data)
          .eq("id", state.user.id)
          .select()
          .single();

        if (supabaseError) {
          throw new Error(supabaseError.message);
        }

        dispatch({ type: "UPDATE_USER", payload: updatedUser });
        return { success: true };
      } catch (supabaseUpdateError) {
        // Backend fallback for environments where direct Supabase access is blocked.
        try {
          const response = await api.auth.updateProfile(data);
          dispatch({ type: "UPDATE_USER", payload: response.data });
          return { success: true };
        } catch (apiError) {
          const message =
            supabaseUpdateError.message ||
            apiError.message ||
            "Failed to update profile.";
          dispatch({ type: "SET_ERROR", payload: message });
          return { success: false, error: message };
        }
      }
    },
    [ensureSupabaseSession, state.user?.id],
  );

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value = {
    ...state,
    ensureSupabaseSession,
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default useAuth;
