import React, { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../state/auth";
import { showSuccess } from "../utils/toast";
import ThemeToggle from "./ThemeToggle";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLogout() {
    logout();
    showSuccess("Logged out successfully");
    setSidebarOpen(false);
  }

  return (
    <div className="app">
      {/* Mobile menu toggle */}
      <div className="mobileMenuToggle">
        <button 
          className="btn btnGhost" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="sidebarBackdrop open" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebarTop">
          <Link to="/admin-dashboard" className="logoLink" onClick={() => setSidebarOpen(false)}>
            <img src="/logo.png" alt="Mini ChatGPT" className="logo" />
          </Link>
          <Link className="brand" to="/admin-dashboard" onClick={() => setSidebarOpen(false)}>
            🔐 Admin
          </Link>
          <ThemeToggle />
        </div>

        <nav className="nav">
          <NavLink to="/admin-dashboard" className={({ isActive }) => (isActive ? "navItem active" : "navItem")} onClick={() => setSidebarOpen(false)}>
            📊 Dashboard
          </NavLink>
          <NavLink to="/admin-users" className={({ isActive }) => (isActive ? "navItem active" : "navItem")} onClick={() => setSidebarOpen(false)}>
            👥 Users
          </NavLink>
          <NavLink to="/admin-analytics" className={({ isActive }) => (isActive ? "navItem active" : "navItem")} onClick={() => setSidebarOpen(false)}>
            📈 Analytics
          </NavLink>
        </nav>

        <div style={{ flex: 1 }} />

        <div className="sidebarBottom">
          <div className="userLine">
            <div className="userMeta">
              <div className="userName">
                👨‍💼 {user?.username}
              </div>
              <div className="userEmail" style={{ fontSize: "11px" }}>
                Admin Access
              </div>
            </div>
            <button className="btn btnGhost" onClick={handleLogout}>
              Exit
            </button>
          </div>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
