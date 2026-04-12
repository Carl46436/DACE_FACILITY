// ============================================================
// Report Store
// Manages report state: listing, creation, status updates
// ============================================================

import { createContext, useContext, useReducer, useCallback } from 'react';
import { api } from '../services/api';

const initialState = {
  reports: [],
  currentReport: null,
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

const reportReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: true, error: null };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: true };
    case 'SET_REPORTS':
      return {
        ...state,
        reports: action.payload.data,
        pagination: action.payload.pagination,
        isLoading: false,
        isRefreshing: false,
      };
    case 'APPEND_REPORTS':
      return {
        ...state,
        reports: [...state.reports, ...action.payload.data],
        pagination: action.payload.pagination,
        isLoading: false,
        isRefreshing: false,
      };
    case 'ADD_REPORT':
      return {
        ...state,
        reports: [action.payload, ...state.reports],
        isLoading: false,
      };
    case 'SET_CURRENT_REPORT':
      return { ...state, currentReport: action.payload, isLoading: false };
    case 'UPDATE_REPORT':
      return {
        ...state,
        reports: state.reports.map((r) =>
          r.id === action.payload.id ? { ...r, ...action.payload } : r
        ),
        currentReport:
          state.currentReport?.id === action.payload.id
            ? { ...state.currentReport, ...action.payload }
            : state.currentReport,
        isLoading: false,
      };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false, isRefreshing: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
};

const ReportContext = createContext(null);

export const ReportProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reportReducer, initialState);

  const fetchReports = useCallback(async (params = {}, isRefresh = false) => {
    dispatch({ type: isRefresh ? 'SET_REFRESHING' : 'SET_LOADING' });
    try {
      const response = await api.reports.getAll(params);
      dispatch({
        type: params.page && params.page > 1 ? 'APPEND_REPORTS' : 'SET_REPORTS',
        payload: response.data,
      });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const fetchReportById = useCallback(async (id) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.reports.getById(id);
      dispatch({ type: 'SET_CURRENT_REPORT', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const createReport = useCallback(async (formData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.reports.create(formData);
      dispatch({ type: 'ADD_REPORT', payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const updateReportStatus = useCallback(async (id, statusData) => {
    dispatch({ type: 'SET_LOADING' });
    try {
      const response = await api.reports.updateStatus(id, statusData);
      dispatch({ type: 'UPDATE_REPORT', payload: response.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const addComment = useCallback(async (reportId, commentData) => {
    try {
      const response = await api.reports.addComment(reportId, commentData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const value = {
    ...state,
    fetchReports,
    fetchReportById,
    createReport,
    updateReportStatus,
    addComment,
    clearError,
  };

  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
};

export const useReports = () => {
  const context = useContext(ReportContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportProvider');
  }
  return context;
};

export default useReports;
