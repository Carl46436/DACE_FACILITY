// ============================================================
// Borrow Store
// Manages borrowing state: requests, approvals, returns
// ============================================================

import { createContext, useContext, useReducer, useCallback } from "react";
import { api } from "../services/api";

const initialState = {
  borrowRecords: [],
  items: [],
  pagination: null,
  isLoading: false,
  isRefreshing: false,
  error: null,
};

const borrowReducer = (state, action) => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: true, error: null };
    case "SET_REFRESHING":
      return { ...state, isRefreshing: true };
    case "SET_BORROW_RECORDS":
      return {
        ...state,
        borrowRecords: action.payload.data,
        pagination: action.payload.pagination,
        isLoading: false,
        isRefreshing: false,
      };
    case "SET_ITEMS":
      return { ...state, items: action.payload.data, isLoading: false };
    case "ADD_BORROW":
      return {
        ...state,
        borrowRecords: [action.payload, ...state.borrowRecords],
        isLoading: false,
      };
    case "UPDATE_BORROW":
      return {
        ...state,
        borrowRecords: state.borrowRecords.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b,
        ),
        isLoading: false,
      };
    case "ACTIVATE_BORROW":
      return {
        ...state,
        borrowRecords: state.borrowRecords.map((b) =>
          b.id === action.payload.id ? { ...b, ...action.payload } : b,
        ),
        isLoading: false,
      };
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isLoading: false,
        isRefreshing: false,
      };
    case "CLEAR_ERROR":
      return { ...state, error: null };
    case "CLEAR_DATA":
      return { ...initialState };
    default:
      return state;
  }
};

const BorrowContext = createContext(null);

export const BorrowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(borrowReducer, initialState);

  const fetchBorrowRecords = useCallback(
    async (params = {}, isRefresh = false) => {
      dispatch({ type: isRefresh ? "SET_REFRESHING" : "SET_LOADING" });
      try {
        const response = await api.borrow.getAll(params);
        dispatch({ type: "SET_BORROW_RECORDS", payload: response.data });
        return { success: true, data: response.data };
      } catch (error) {
        dispatch({ type: "SET_ERROR", payload: error.message });
        return { success: false, error: error.message };
      }
    },
    [],
  );

  const fetchItems = useCallback(async (params = {}) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.items.getAll(params);
      dispatch({ type: "SET_ITEMS", payload: response.data });
      return { success: true, data: response.data.data };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const createBorrowRequest = useCallback(async (data) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.borrow.create(data);
      dispatch({ type: "ADD_BORROW", payload: response.data });
      return { success: true, data: response.data };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const approveBorrowRequest = useCallback(async (id, data) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.borrow.approve(id, data);
      dispatch({ type: "UPDATE_BORROW", payload: response.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const activateBorrow = useCallback(async (id) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.borrow.activate(id);
      dispatch({ type: "ACTIVATE_BORROW", payload: response.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const returnItem = useCallback(async (id, data) => {
    dispatch({ type: "SET_LOADING" });
    try {
      const response = await api.borrow.returnItem(id, data);
      dispatch({ type: "UPDATE_BORROW", payload: response.data });
      return { success: true };
    } catch (error) {
      dispatch({ type: "SET_ERROR", payload: error.message });
      return { success: false, error: error.message };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const clearData = useCallback(() => {
    dispatch({ type: "CLEAR_DATA" });
  }, []);

  const value = {
    ...state,
    fetchBorrowRecords,
    fetchItems,
    createBorrowRequest,
    approveBorrowRequest,
    activateBorrow,
    returnItem,
    clearError,
    clearData,
  };

  return (
    <BorrowContext.Provider value={value}>{children}</BorrowContext.Provider>
  );
};

export const useBorrow = () => {
  const context = useContext(BorrowContext);
  if (!context) {
    throw new Error("useBorrow must be used within a BorrowProvider");
  }
  return context;
};

export default useBorrow;
