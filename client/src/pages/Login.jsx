import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const response = await api.post("/auth/login", formData);

      const { token, user } = response.data;

    localStorage.setItem("token", token);
localStorage.setItem("user", JSON.stringify(user));

if (user.role === "admin") {
  window.location.href = "/admin";
} else {
  window.location.href = "/dashboard";
}
    } catch (error) {
      setError(
        error.response?.data?.message ||
          "Unable to sign in. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />

      <section className="login-shell">
        <div className="login-brand-panel">
          <div className="brand-badge">F</div>

          <div>
            <p className="brand-eyebrow">FALAQ DIGITAL</p>

            <h1>
              Human conversations,
              <span> handled smarter.</span>
            </h1>

            <p className="brand-copy">
              A modern in-house call center workspace for
              agents, customers, and real-time conversations.
            </p>
          </div>

          <div className="brand-feature-grid">
            <div>
              <strong>Realtime</strong>
              <span>Agent routing</span>
            </div>

            <div>
              <strong>Secure</strong>
              <span>Role-based access</span>
            </div>

            <div>
              <strong>Scalable</strong>
              <span>50 → 500+ agents</span>
            </div>
          </div>
        </div>

        <div className="login-card">
          <div className="login-card-heading">
            <div className="mobile-brand">F</div>

            <p className="login-overline">AGENT PORTAL</p>
            <h2>Welcome back</h2>
            <p>
              Sign in to start managing customer conversations.
            </p>
          </div>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email address</label>

              <input
                id="email"
                type="email"
                name="email"
                placeholder="agent@falaq.com"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="current-password"
                required
              />
            </div>

            <button
              className="login-button"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <span>→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-security">
            <span className="security-dot" />
            Secure internal access
          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;