import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../state/auth";
import { showSuccess, showError, showInfo } from "../utils/toast";
import ThemeToggle from "./ThemeToggle";
import ConfirmModal from "./ConfirmModal";

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [conversations, setConversations] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConvId, setDeleteConvId] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    // Load conversations only once per user session (prevent API spam)
    // Skip in Strict Mode double-renders by tracking initialization
    if (loadedRef.current) return;
    if (!user) {
      setConversations([]);
      return;
    }

    loadedRef.current = true;

    (async () => {
      try {
        const { data } = await api.get("/conversations");
        setConversations(data.conversations || []);
      } catch {
        // ignore
      }
    })();
  }, [user]);

  function handleLogout() {
    logout();
    showSuccess("Logged out successfully");
    setSidebarOpen(false);
    navigate("/login");
  }

  function getConversationPreview(conv) {
    // Extract title or show first message
    return conv.title || "Untitled Conversation";
  }

  async function handleDeleteConversation(e, convId) {
    e.preventDefault();
    e.stopPropagation();
    setDeleteConvId(convId);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteConvId) return;

    try {
      await api.delete(`/conversations/${deleteConvId}`);
      setConversations(conversations.filter(c => c.id !== deleteConvId));
      showSuccess("Conversation deleted");
    } catch (error) {
      showError("Failed to delete conversation");
    }
    setShowDeleteModal(false);
    setDeleteConvId(null);
    setHoveredId(null);
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
          <Link to="/chat?reset=true" className="logoLink" onClick={() => setSidebarOpen(false)}>
            <img src="/logo.png" alt="Mini ChatGPT" className="logo" />
          </Link>
          <Link className="brand" to="/chat?reset=true" onClick={() => setSidebarOpen(false)}>
              Mini ChatGPT          
          </Link>
          <ThemeToggle />
        </div>

        <nav className="nav" style={{ display: "none" }}>
          <NavLink to="/chat" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
            Chat
          </NavLink>
          <NavLink to="/history" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
            History
          </NavLink>
          {user?.role === "admin" ? (
            <NavLink to="/admin" className={({ isActive }) => (isActive ? "navItem active" : "navItem")}>
              Admin
            </NavLink>
          ) : null}
        </nav>

        {user && (
          <>
            <div className="sidebarSectionTitle">Recent Conversations</div>
            <div className="recentList">
              {conversations.slice(0, 10).map((c) => (
                <div
                  key={c.id}
                  className="recentItemContainer"
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <Link
                    to={`/chat?id=${c.id}`}
                    className="recentItem"
                    title={getConversationPreview(c)}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {getConversationPreview(c)}
                  </Link>
                  {hoveredId === c.id && (
                    <button
                      className="deleteBtn"
                      onClick={(e) => handleDeleteConversation(e, c.id)}
                      title="Delete conversation"
                      aria-label="Delete"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
              {!conversations.length ? <div className="muted">No conversations yet.</div> : null}
            </div>
          </>
        )}

        <div className="sidebarBottom">
          {user ? (
            <div className="userLine">
              <div className="userMeta">
                <div className="userName">{user.username}</div>
                <div className="userEmail">{user.email}</div>
              </div>
              <button className="btn btnGhost" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <div className="userLine">
              <div className="userMeta">
                <div className="userName">Guest</div>
                <div className="userEmail">Sign in to save history</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Link className="btn btnGhost" to="/login" onClick={() => setSidebarOpen(false)}>
                  Login
                </Link>
                <Link className="btn btnPrimary" to="/register" onClick={() => setSidebarOpen(false)}>
                  Register
                </Link>

              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete Conversation?"
        message="This action cannot be undone. All messages in this conversation will be permanently deleted."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteConvId(null);
        }}
        isDanger={true}
      />
    </div>
  );
}

