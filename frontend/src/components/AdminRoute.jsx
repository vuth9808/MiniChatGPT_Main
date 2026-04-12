import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth";

export default function AdminRoute({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/chat" replace />;
  return children;
}

