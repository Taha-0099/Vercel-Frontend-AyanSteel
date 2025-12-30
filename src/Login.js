import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { loginDemo } from "./auth";

// 🔑 Hardcoded admin credentials
const ADMIN_EMAIL = "admin@ayansteel.com";
const ADMIN_PASSWORD = "123456";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      Swal.fire("Missing Data", "Please enter email and password", "warning");
      return;
    }

    setLoading(true);
    try {
      let role = "user";

      if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
        role = "admin";
      }

      // Create a demo JWT token and save it (no backend in this demo)
      loginDemo({ email, role });

      Swal.fire({
        icon: "success",
        title: role === "admin" ? "Welcome, Admin" : "Welcome",
        text:
          role === "admin"
            ? "You have full access including Admin Panel."
            : "You can now create ledger entries and sales.",
        timer: 1600,
        showConfirmButton: false
      });

      navigate("/");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Login failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Small CSS block just for this page */}
      <style>{`
        @keyframes floatCard {
          0% { transform: translateY(0px); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18); }
          50% { transform: translateY(-5px); box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28); }
          100% { transform: translateY(0px); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18); }
        }
        .login-card {
          animation: floatCard 6s ease-in-out infinite;
        }
        .login-pill-btn:active {
          transform: scale(0.98);
        }
        .login-input::placeholder {
          color: #9ca3af !important;
          opacity: 1;
        }
      `}</style>

      <div
        className="d-flex align-items-center justify-content-center"
        style={{
          minHeight: "100vh",
          padding: "20px",
          background:
            "linear-gradient(135deg, #e0f2fe 0%, #f9fafb 30%, #dbeafe 60%, #e5e7eb 100%)"
        }}
      >
        <div className="container" style={{ maxWidth: "440px" }}>
          <div
            className="card border-0 login-card"
            style={{
              borderRadius: "22px",
              background: "#ffffff",
              overflow: "hidden"
            }}
          >
            {/* Top accent strip */}
            <div
              style={{
                height: "5px",
                background:
                  "linear-gradient(90deg, #0ea5e9, #22c55e, #f59e0b, #6366f1)"
              }}
            ></div>

            <div className="card-body p-4 p-md-5">
              {/* Header */}
              <div className="mb-4 text-center">
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "20px",
                    margin: "0 auto 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, #0ea5e9, #22c55e, #10b981)",
                    color: "#0f172a"
                  }}
                >
                  <i
                    className="fa-solid fa-shield-halved"
                    style={{ fontSize: 30 }}
                  ></i>
                </div>
                <h4
                  className="mb-1"
                  style={{ fontWeight: 700, color: "#111827" }}
                >
                  Ayan Steel System
                </h4>
                <p
                  className="mb-0"
                  style={{ color: "#6b7280", fontSize: "0.85rem" }}
                >
                  Sign in to manage your ledger &amp; admin analytics
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                {/* Email */}
                <div className="mb-3">
                  <label
                    className="form-label text-uppercase"
                    style={{
                      fontSize: "0.74rem",
                      letterSpacing: "0.12em",
                      color: "#9ca3af",
                      fontWeight: 600
                    }}
                  >
                    Email
                  </label>
                  <div className="input-group input-group-lg">
                    <span
                      className="input-group-text border-end-0"
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderColor: "#e5e7eb"
                      }}
                    >
                      <i className="fa-regular fa-envelope text-primary"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0 login-input"
                      placeholder="you@ayansteel.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="username"
                      required
                      style={{
                        backgroundColor: "#f9fafb",
                        borderColor: "#e5e7eb",
                        borderRadius: "0 0.75rem 0.75rem 0",
                        fontSize: "0.95rem"
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="mb-2">
                  <label
                    className="form-label text-uppercase"
                    style={{
                      fontSize: "0.74rem",
                      letterSpacing: "0.12em",
                      color: "#9ca3af",
                      fontWeight: 600
                    }}
                  >
                    Password
                  </label>
                  <div className="input-group input-group-lg">
                    <span
                      className="input-group-text border-end-0"
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderColor: "#e5e7eb"
                      }}
                    >
                      <i className="fa-solid fa-lock text-emerald-500"></i>
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control border-0 border-start-0 login-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      required
                      style={{
                        backgroundColor: "#f9fafb",
                        borderColor: "#e5e7eb",
                        borderRadius: 0,
                        fontSize: "0.95rem"
                      }}
                    />
                    <span
                      className="input-group-text border-start-0"
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderColor: "#e5e7eb",
                        cursor: "pointer"
                      }}
                      onClick={() => setShowPassword((p) => !p)}
                    >
                      <i
                        className={
                          showPassword
                            ? "fa-regular fa-eye-slash"
                            : "fa-regular fa-eye"
                        }
                      ></i>
                    </span>
                  </div>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-4">
                  <small style={{ color: "#6b7280" }}>
                    <i className="fa-solid fa-user-shield me-1 text-primary"></i>
                    Only <strong>Admin</strong> can open Admin Panel.
                  </small>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  className="btn btn-lg w-100 login-pill-btn"
                  disabled={loading}
                  style={{
                    borderRadius: "999px",
                    background:
                      "linear-gradient(135deg, #0ea5e9, #22c55e, #4ade80)",
                    border: "none",
                    fontWeight: 600,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#f9fafb",
                    boxShadow: "0 12px 25px rgba(34, 197, 94, 0.35)"
                  }}
                >
                  {loading ? (
                    <>
                      <i className="fa-solid fa-circle-notch fa-spin me-2"></i>
                      Signing in...
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-right-to-bracket me-2"></i>
                      Sign In
                    </>
                  )}
                </button>

                {/* Demo access box */}
                <div
                  className="mt-4 p-3 rounded-3"
                  style={{
                    backgroundColor: "#f3f4f6",
                    border: "1px dashed #d1d5db",
                    fontSize: "0.85rem"
                  }}
                >
                  <div className="d-flex align-items-center mb-2">
                    <i className="fa-solid fa-wand-magic-sparkles text-indigo-500 me-2"></i>
                    <span style={{ color: "#4b5563", fontWeight: 600 }}>
                      Demo access
                    </span>
                  </div>
                  <div className="d-flex justify-content-between flex-wrap">
                    <div className="mb-1">
                      <span className="text-success fw-semibold">Admin: </span>
                      <code>{ADMIN_EMAIL}</code>
                    </div>
                  </div>
                  <div className="mb-1">
                    <span className="text-success fw-semibold">Password: </span>
                    <code>{ADMIN_PASSWORD}</code>
                  </div>
                  <div style={{ color: "#6b7280" }}>
                    Any other email with same password logs in as{" "}
                    <strong>User</strong> (no admin panel).
                  </div>
                </div>
              </form>
            </div>
          </div>

          <p
            className="text-center mt-3"
            style={{ color: "#6b7280", fontSize: "0.8rem" }}
          >
            © {new Date().getFullYear()} Ayan Steel · Internal Ledger System
          </p>
        </div>
      </div>
    </>
  );
}

export default Login;
