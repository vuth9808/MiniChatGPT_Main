import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth";
import { showSuccess, showError } from "../utils/toast";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, password });
      showSuccess("Login successful! Welcome back.");
      navigate(user.role === "admin" ? "/admin-dashboard" : "/chat");
    } catch (err) {
      const message = err?.response?.data?.message || "Login failed";
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
          <div className="authTitle">Welcome back</div>
          <div className="authSub">Login to continue chatting.</div>
        </div>

        <form onSubmit={onSubmit} className="form">
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
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="authFooter">
          New here? <Link to="/register">Create an account</Link>
        </div>
      </div>
    </div>
  );
}

