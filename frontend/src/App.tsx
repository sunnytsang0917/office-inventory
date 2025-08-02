import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { AppProvider, useAppContext } from './contexts/AppContext';
import MainLayout from './components/layout/MainLayout';
import AuthLayout from './components/layout/AuthLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ItemsPage from './pages/ItemsPage';
import LocationsPage from './pages/LocationsPage';
import InventoryPage from './pages/InventoryPage';
import InboundPage from './pages/InboundPage';
import OutboundPage from './pages/OutboundPage';
import TransactionHistoryPage from './pages/TransactionHistoryPage';
import ReportsPage from './pages/ReportsPage';
import ApiTestPage from './pages/ApiTestPage';
import './App.css';

// 公共路由组件（已登录用户重定向到首页）
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { state } = useAppContext();
  
  if (state.user?.isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return <AuthLayout>{children}</AuthLayout>;
};

function AppRoutes() {
  return (
    <Router>
      <Routes>
        {/* 公共路由 */}
        <Route path="/login" element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } />
        
        {/* 受保护的路由 */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout>
              <HomePage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/items" element={
          <ProtectedRoute requireAdmin>
            <MainLayout>
              <ItemsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/locations" element={
          <ProtectedRoute requireAdmin>
            <MainLayout>
              <LocationsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/inventory" element={
          <ProtectedRoute>
            <MainLayout>
              <InventoryPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/inbound" element={
          <ProtectedRoute>
            <MainLayout>
              <InboundPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/outbound" element={
          <ProtectedRoute>
            <MainLayout>
              <OutboundPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/transactions/history" element={
          <ProtectedRoute>
            <MainLayout>
              <TransactionHistoryPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute>
            <MainLayout>
              <ReportsPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        <Route path="/api-test" element={
          <ProtectedRoute requireAdmin>
            <MainLayout>
              <ApiTestPage />
            </MainLayout>
          </ProtectedRoute>
        } />
        
        {/* 默认重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <AppProvider>
        <AppRoutes />
      </AppProvider>
    </ConfigProvider>
  );
}

export default App;
