import React, { useEffect, useState } from "react";
import api from "../api/client";
import { showSuccess, showError } from "../utils/toast";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConversations: 0,
    totalMessages: 0,
    adminCount: 0,
    recentUsers: [],
    userGrowthData: [],
    conversationData: [],
    roleData: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStats() {
    setError("");
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      const users = data.users || [];
      const adminCount = users.filter(u => u.role === 'admin').length;
      const recentUsers = users.slice(0, 5);

      // Conversations per user (top 8)
      const conversationData = users
        .sort((a, b) => (b.conversation_count || 0) - (a.conversation_count || 0))
        .slice(0, 8)
        .map(u => ({
          name: u.username.substring(0, 10),
          conversations: u.conversation_count || 0,
          messages: u.message_count || 0
        }));

      // User growth over days (last 7 days)
      const daysAgo = {};
      users.forEach(u => {
        const date = new Date(u.created_at);
        const dayStr = date.toLocaleDateString();
        daysAgo[dayStr] = (daysAgo[dayStr] || 0) + 1;
      });
      const userGrowthData = Object.entries(daysAgo)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .slice(-7)
        .map(([day, count]) => ({ day, users: count }));

      // Role distribution
      const roleData = [
        { name: 'Admin', value: adminCount, fill: '#7c5cff' },
        { name: 'User', value: users.length - adminCount, fill: '#48c6ef' }
      ];

      setStats({
        totalUsers: users.length,
        totalConversations: users.reduce((sum, u) => sum + (u.conversation_count || 0), 0),
        totalMessages: users.reduce((sum, u) => sum + (u.message_count || 0), 0),
        adminCount,
        recentUsers,
        userGrowthData,
        conversationData,
        roleData
      });
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ title, value, icon }) => (
    <div className="statCard">
      <div className="statIcon">{icon}</div>
      <div className="statContent">
        <div className="statTitle">{title}</div>
        <div className="statValue">{value}</div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">📊 Admin Dashboard</div>
          <div className="pageSub">System overview and key metrics.</div>
        </div>
        <button className="btn btnGhost" onClick={loadStats}>
          🔄 Refresh
        </button>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}
      {error ? <div className="error">{error}</div> : null}

      {/* Stats Grid */}
      <div className="statsGrid">
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" />
        <StatCard title="Conversations" value={stats.totalConversations} icon="💬" />
        <StatCard title="Messages" value={stats.totalMessages} icon="💭" />
        <StatCard title="Admins" value={stats.adminCount} icon="🔐" />
      </div>

      {/* Recent Users */}
      <div className="panel">
        <div className="panelTitle">📱 Recent Users</div>
        <div className="list">
          {stats.recentUsers.map((u) => (
            <div key={u.id} className="listItem">
              <div className="listMain">
                <div className="listTitle">{u.username}</div>
                <div className="muted">{u.email}</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <span className="pill">{u.role}</span>
                <span className="pill">{new Date(u.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="chartsGrid">
        {/* User Growth Chart */}
        <div className="chartPanel">
          <div className="panelTitle">📈 User Growth (Last 7 Days)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="day" stroke="var(--muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text)" }}
              />
              <Line type="monotone" dataKey="users" stroke="#7c5cff" strokeWidth={2} dot={{ fill: "#7c5cff", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Conversations Chart */}
        <div className="chartPanel">
          <div className="panelTitle">💬 Top Users by Conversations</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.conversationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="var(--muted)" tick={{ fontSize: 12 }} />
              <YAxis stroke="var(--muted)" tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text)" }}
              />
              <Legend />
              <Bar dataKey="conversations" fill="#48c6ef" />
              <Bar dataKey="messages" fill="#7c5cff" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Role Distribution Chart */}
        <div className="chartPanel">
          <div className="panelTitle">🔐 Role Distribution</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: "8px" }}
                labelStyle={{ color: "var(--text)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

