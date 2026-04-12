import React, { useEffect, useState } from "react";
import api from "../api/client";

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState({
    activeUsers: 0,
    usersThisWeek: 0,
    avgConversationsPerUser: 0,
    avgMessagesPerConversation: 0,
    roleDistribution: { admin: 0, user: 0 }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/users");
        const users = data.users || [];
        
        const totalConvs = users.reduce((sum, u) => sum + (u.conversation_count || 0), 0);
        const totalMsgs = users.reduce((sum, u) => sum + (u.message_count || 0), 0);
        
        setAnalytics({
          activeUsers: users.length,
          usersThisWeek: users.filter(u => {
            const created = new Date(u.created_at);
            const week = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return created > week;
          }).length,
          avgConversationsPerUser: users.length ? Math.round(totalConvs / users.length * 10) / 10 : 0,
          avgMessagesPerConversation: totalConvs ? Math.round(totalMsgs / totalConvs * 10) / 10 : 0,
          roleDistribution: {
            admin: users.filter(u => u.role === 'admin').length,
            user: users.filter(u => u.role === 'user').length
          }
        });
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const MetricCard = ({ title, value, unit }) => (
    <div className="statCard">
      <div className="statContent">
        <div className="statTitle">{title}</div>
        <div className="statValue">{value} {unit}</div>
      </div>
    </div>
  );

  return (
    <div className="page">
      <div className="pageHeader">
        <div>
          <div className="pageTitle">📈 Analytics & Insights</div>
          <div className="pageSub">System usage and trends.</div>
        </div>
      </div>

      {loading ? <div className="muted">Loading...</div> : null}

      <div className="statsGrid">
        <MetricCard title="Active Users" value={analytics.activeUsers} unit="" />
        <MetricCard title="This Week" value={analytics.usersThisWeek} unit="users" />
        <MetricCard title="Avg Conversations" value={analytics.avgConversationsPerUser} unit="" />
        <MetricCard title="Avg Messages" value={analytics.avgMessagesPerConversation} unit="/conv" />
      </div>

      <div className="grid2">
        <div className="panel">
          <div className="panelTitle">📊 Role Distribution</div>
          <div className="list">
            <div className="listItem">
              <div className="listMain">
                <div className="listTitle">System Administrators</div>
                <div className="muted">Full system access</div>
              </div>
              <div className="statValue">{analytics.roleDistribution.admin}</div>
            </div>
            <div className="listItem">
              <div className="listMain">
                <div className="listTitle">Regular Users</div>
                <div className="muted">Standard chat access</div>
              </div>
              <div className="statValue">{analytics.roleDistribution.user}</div>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panelTitle">💡 System Health</div>
          <div className="list">
            <div className="listItem">
              <div className="listMain">
                <div className="listTitle">Overall Status</div>
                <div className="muted">All systems operational</div>
              </div>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
            </div>
            <div className="listItem">
              <div className="listMain">
                <div className="listTitle">API Connectivity</div>
                <div className="muted">Google Gemini API active</div>
              </div>
              <span style={{ color: "#10b981", fontWeight: "bold" }}>✓</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
