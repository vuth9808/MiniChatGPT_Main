import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../state/auth";
import { showSuccess, showError } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConvId, setDeleteConvId] = useState(null);

  async function load() {
    if (!user) {
      setError("Please log in to view chat history");
      setLoading(false);
      return;
    }

    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/conversations");
      setConversations(data.conversations || []);
    } catch (err) {
      const message = err?.response?.data?.message || "Failed to load history";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [user]);

  async function deleteConversation(id) {
    setDeleteConvId(id);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteConvId) return;
    const prev = conversations;
    setConversations((c) => c.filter((x) => x.id !== deleteConvId));
    try {
      await api.delete(`/conversations/${deleteConvId}`);
      showSuccess("Conversation deleted");
    } catch (err) {
      setConversations(prev);
      const message = err?.response?.data?.message || "Delete failed";
      showError(message);
    }
    setShowDeleteModal(false);
    setDeleteConvId(null);
  }

  function openConversation(id) {
    navigate(`/chat?id=${id}`);
  }

  function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">Chat History</div>
          <div className="pageSub">Your saved conversations.</div>
        </div>
        <button className="btn btnGhost" onClick={load}>
          Refresh
        </button>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}
      {error ? <div className="error">{error}</div> : null}

      <div className="table">
        <div className="tableHead">
          <div>Title</div>
          <div>Created</div>
          <div>Updated</div>
          <div />
        </div>
        {conversations.map((c) => (
          <div key={c.id} className="tableRow">
            <div
              className="cell clip"
              title={c.title}
              style={{ cursor: "pointer", color: "var(--primary)" }}
              onClick={() => openConversation(c.id)}
            >
              {c.title}
            </div>
            <div className="cell">{formatDate(c.created_at)}</div>
            <div className="cell">{formatDate(c.updated_at)}</div>
            <div className="cell right">
              <button className="btn btnDanger" onClick={() => deleteConversation(c.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && !conversations.length ? <div className="muted">No conversations yet.</div> : null}
      </div>

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

