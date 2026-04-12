import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { showSuccess, showError } from "../utils/toast";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await register({ username, email, password });
      showSuccess("Account created! Welcome aboard.");
      navigate(user.role === "admin" ? "/admin-dashboard" : "/chat");
    } catch (err) {
      const message = err?.response?.data?.message || "Registration failed";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="authWrap">
      <div className="authCard">
        <div className="authHeader">
          <div className="authTitle">Create account</div>
          <div className="authSub">Start chatting with AI in seconds.</div>
        </div>

        <form onSubmit={onSubmit} className="form">
          <label className="label">
            Username
            <input className="input" value={username} onChange={(e) => setUsername(e.target.value)} />
          </label>
          <label className="label">
            Email
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </label>
          <label className="label">
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
            />
          </label>
          {error ? <div className="error">{error}</div> : null}
          <button className="btn btnPrimary" disabled={loading}>
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        <div className="authFooter">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

