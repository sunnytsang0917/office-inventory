import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { AuthApi, User } from '../services/authApi';

// 定义应用状态类型
export interface AppState {
  user: {
    id: string;
    name: string;
    username: string;
    role: 'admin' | 'employee';
    isAuthenticated: boolean;
  } | null;
  loading: boolean;
  error: string | null;
}

// 定义动作类型
export type AppAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' }
  | { type: 'INIT_AUTH'; payload: User | null };

// 初始状态
const initialState: AppState = {
  user: null,
  loading: true, // 初始时为true，等待认证检查
  error: null,
};

// Reducer函数
const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: {
          ...action.payload,
          isAuthenticated: true,
        },
        loading: false,
        error: null,
      };
    case 'INIT_AUTH':
      return {
        ...state,
        user: action.payload ? {
          ...action.payload,
          isAuthenticated: true,
        } : null,
        loading: false,
        error: null,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        error: null,
        loading: false,
      };
    default:
      return state;
  }
};

// 创建Context
const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
} | undefined>(undefined);

// Provider组件
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 初始化认证状态
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (AuthApi.isLoggedIn()) {
          const user = await AuthApi.getCurrentUser();
          dispatch({ type: 'INIT_AUTH', payload: user });
        } else {
          dispatch({ type: 'INIT_AUTH', payload: null });
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        dispatch({ type: 'INIT_AUTH', payload: null });
      }
    };

    initAuth();
  }, []);

  // 登录函数
  const login = async (username: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
    
    try {
      const response = await AuthApi.login({ username, password });
      dispatch({ type: 'SET_USER', payload: response.user });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || '登录失败';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // 登出函数
  const logout = async () => {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: 'LOGOUT' });
    }
  };

  return (
    <AppContext.Provider value={{ state, dispatch, login, logout }}>
      {children}
    </AppContext.Provider>
  );
};

// 自定义Hook
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};