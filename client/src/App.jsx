import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import "./App.css";

function App() {
  const token = localStorage.getItem("token");

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  return (
    <BrowserRouter>
      <Routes>
        {/* Root route */}
        <Route
          path="/"
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : user?.role === "admin" ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={<Login />}
        />

        {/* Agent Dashboard */}
        <Route
          path="/dashboard"
          element={
            token && user?.role === "agent" ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            token && user?.role === "admin" ? (
              <AdminDashboard />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Unknown route */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;