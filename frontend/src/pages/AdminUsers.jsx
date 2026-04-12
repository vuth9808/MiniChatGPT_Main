import React, { useEffect, useState } from "react";
import api from "../api/client";
import { showSuccess, showError } from "../utils/toast";
import ConfirmModal from "../components/ConfirmModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState(null);
  const [deleteUsername, setDeleteUsername] = useState("");

  async function loadUsers() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data.users || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function deleteUser(id, username) {
    setDeleteUserId(id);
    setDeleteUsername(username);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!deleteUserId) return;
    const prev = users;
    setUsers((u) => u.filter((x) => x.id !== deleteUserId));
    try {
      await api.delete(`/users/${deleteUserId}`);
      showSuccess(`User "${deleteUsername}" deleted`);
    } catch (err) {
      setUsers(prev);
      const message = err?.response?.data?.message || "Delete failed";
      showError(message);
    }
    setShowDeleteModal(false);
    setDeleteUserId(null);
    setDeleteUsername("");
  }

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">👥 User Management</div>
          <div className="pageSub">View and manage all users.</div>
        </div>
        <button className="btn btnGhost" onClick={loadUsers}>
          🔄 Refresh
        </button>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}
      {error ? <div className="error">{error}</div> : null}

      <div className="table">
        <div className="tableHead">
          <div>User</div>
          <div>Email</div>
          <div>Role</div>
          <div>Joined</div>
          <div />
        </div>
        {users.map((u) => (
          <div key={u.id} className="tableRow">
            <div className="cell listTitle">{u.username}</div>
            <div className="cell clip">{u.email}</div>
            <div className="cell">
              <span className="pill">{u.role}</span>
            </div>
            <div className="cell">{new Date(u.created_at).toLocaleDateString()}</div>
            <div className="cell right">
              <button 
                className="btn btnDanger" 
                onClick={() => deleteUser(u.id, u.username)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {!loading && !users.length ? <div className="muted">No users found.</div> : null}
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete User?"
        message={`Delete user "${deleteUsername}"? All their data will be permanently removed. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteUserId(null);
          setDeleteUsername("");
        }}
        isDanger={true}
      />
    </div>
  );
}
