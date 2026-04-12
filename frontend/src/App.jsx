import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import AdminDashboard from "./pages/AdminDashboard";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppShell from "./components/AppShell";
import AdminLayout from "./components/AdminLayout";
import { useAuth } from "./state/auth";

function RootRedirect() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin-dashboard" replace />;
  return <Navigate to="/chat" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* User Routes */}
      <Route path="/" element={<AppShell />}>
        <Route index element={<RootRedirect />} />
        <Route path="chat" element={<ChatPage />} />
        <Route
          path="history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Admin Routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        </ProtectedRoute>
      }>
        <Route path="admin-dashboard" element={<AdminDashboard />} />
        <Route path="admin-users" element={<AdminUsers />} />
        <Route path="admin-analytics" element={<AdminAnalytics />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

