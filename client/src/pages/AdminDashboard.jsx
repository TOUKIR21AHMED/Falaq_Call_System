import { useEffect, useState } from "react";
import api from "../services/api";

function AdminDashboard() {
  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  const [overview, setOverview] = useState(null);
  const [agents, setAgents] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      setLoading(true);

      const [overviewResponse, agentsResponse] =
        await Promise.all([
          api.get("/admin/overview"),
          api.get("/admin/agents"),
        ]);

      setOverview(overviewResponse.data.overview);
      setRecentCalls(
        overviewResponse.data.recentCalls || []
      );

      setAgents(
        agentsResponse.data.agents || []
      );
    } catch (error) {
      console.error(
        "Failed to load admin dashboard:",
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchAdminData();

  const interval = setInterval(() => {
    fetchAdminData();
  }, 10000);

  return () => clearInterval(interval);
}, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/login";
  };

  if (loading) {
    return (
      <div className="admin-loading">
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar admin-sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            F
          </div>

          <div>
            <strong>Falaq</strong>
            <span>
              Admin Console
            </span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button className="nav-item active">
            <span>◉</span>
            Overview
          </button>

          <button className="nav-item">
            <span>◎</span>
            Agents
          </button>

          <button className="nav-item">
            <span>☎</span>
            Calls
          </button>
        </nav>

        <div className="sidebar-user">
          <div className="user-avatar">
            {user?.name?.charAt(0) || "A"}
          </div>

          <div className="sidebar-user-info">
            <strong>
              {user?.name}
            </strong>

            <span>
              Administrator
            </span>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
          >
            ↗
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-overline">
              ADMIN CONTROL CENTER
            </p>

            <h1>
              Operations overview
            </h1>

            <p>
              Monitor agent availability and call activity
              across the platform.
            </p>
          </div>

          <button
            className="refresh-button"
            onClick={fetchAdminData}
          >
            Refresh data
          </button>
        </header>

        <section className="stats-grid">
          <article className="stat-card">
            <span className="stat-label">
              Total agents
            </span>

            <strong>
              {overview?.agents?.total || 0}
            </strong>

            <small>
              Registered agents
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Available
            </span>

            <strong>
              {overview?.agents?.available || 0}
            </strong>

            <small>
              Ready for calls
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Busy
            </span>

            <strong>
              {overview?.agents?.busy || 0}
            </strong>

            <small>
              Handling calls
            </small>
          </article>

          <article className="stat-card status-stat-card">
            <span className="stat-label">
              Offline
            </span>

            <strong>
              {overview?.agents?.offline || 0}
            </strong>

            <small>
              Currently inactive
            </small>
          </article>
        </section>

        <section className="stats-grid admin-call-stats">
          <article className="stat-card">
            <span className="stat-label">
              Total calls
            </span>

            <strong>
              {overview?.calls?.total || 0}
            </strong>

            <small>
              All call records
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Completed
            </span>

            <strong>
              {overview?.calls?.completed || 0}
            </strong>

            <small>
              Successfully handled
            </small>
          </article>

          <article className="stat-card">
  <span className="stat-label">
    Missed
  </span>

  <strong>
    {overview?.calls?.missed || 0}
  </strong>

  <small>
    Unanswered calls
  </small>
</article>

          <article className="stat-card">
            <span className="stat-label">
              Ringing
            </span>

            <strong>
              {overview?.calls?.ringing || 0}
            </strong>

            <small>
              Waiting / active routing
            </small>
          </article>

          <article className="stat-card">
            <span className="stat-label">
              Rejected
            </span>

            <strong>
              {overview?.calls?.rejected || 0}
            </strong>

            <small>
              Rejected by agents
            </small>
          </article>
        </section>

        <section className="admin-grid">
          <div className="workspace-card">
            <div className="section-heading">
              <div>
                <span className="section-overline">
                  AGENT MONITORING
                </span>

                <h2>
                  Agent status
                </h2>
              </div>

              <span className="live-badge">
                <span />
                Live view
              </span>
            </div>

            <div className="agent-table">
              <div className="agent-table-header">
                <span>Agent</span>
                <span>Email</span>
                <span>Status</span>
              </div>

              {agents.map((agent) => (
                <div
                  className="agent-table-row"
                  key={agent._id}
                >
                  <div className="agent-cell">
                    <div className="history-avatar">
                      {agent.name?.charAt(0)}
                    </div>

                    <strong>
                      {agent.name}
                    </strong>
                  </div>

                  <span className="agent-email">
                    {agent.email}
                  </span>

                  <span
                    className={`agent-status-pill agent-${agent.status}`}
                  >
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="history-card">
            <div className="section-heading">
              <div>
                <span className="section-overline">
                  RECENT CALLS
                </span>

                <h2>
                  Call activity
                </h2>
              </div>
            </div>

            <div className="history-list">
              {recentCalls.length === 0 ? (
                <p className="history-message">
                  No calls recorded yet.
                </p>
              ) : (
                recentCalls.slice(0, 8).map((call) => (
                  <div
                    className="history-item"
                    key={call._id}
                  >
                    <div className="history-avatar">
                      {call.customer?.name?.charAt(0) || "C"}
                    </div>

                    <div className="history-details">
                      <strong>
                        {call.customer?.name || "Unknown"}
                      </strong>

                      <span>
                        {call.agent?.name || "Unassigned"} ·{" "}
                        {call.status}
                      </span>
                    </div>

                    <span className="history-duration">
                      {call.durationSeconds || 0}s
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default AdminDashboard;