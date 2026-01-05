import { useRef, useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import useInput from "../hooks/useInput";
import absLogo from "../assets/ABS-Logo.png";

import axios from "../api/axios";

const LOGIN_URL = "/auth";

const Login = () => {
  const { setAuth, persist, setPersist } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";

  const userRef = useRef();

  const [user, resetUser, userAttribs] = useInput("user", "");
  const [pwd, setPwd] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeUser, setWelcomeUser] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(
        LOGIN_URL,
        JSON.stringify({ email: user, password: pwd }),
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );

      const accessToken = response?.data?.accessToken;
      const roles = response?.data?.roles;
      const email = response?.data?.email;
      const fullName = response?.data?.fullName || email.split("@")[0];

      // Show welcome screen
      setWelcomeUser(fullName);
      setShowWelcome(true);

      // Set auth after a delay and navigate
      setTimeout(() => {
        setAuth({ user: email, roles, accessToken });
        setLoading(false);
        navigate(from, { replace: true });
      }, 2000);
    } catch (err) {
      if (!err?.response) {
        setErrMsg("No Server Response");
      } else if (err.response?.status === 400) {
        setErrMsg("Missing Email or Password");
      } else if (err.response?.status === 401) {
        setErrMsg("Unauthorized");
      } else {
        setErrMsg("Login Failed");
      }
      setLoading(false);
    }
  };

  const togglePersist = () => {
    setPersist((prev) => !prev);
  };

  useEffect(() => {
    localStorage.setItem("persist", persist);
  }, [persist]);

  // Welcome screen with smiley face
  if (showWelcome) {
    return (
      <div
        style={{
          background: "#2D2D31",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1rem",
        }}
      >
        <div
          className="animate-scaleIn"
          style={{
            textAlign: "center",
            padding: "3rem",
          }}
        >
          {/* Animated Smiley Face - CSS Design */}
          <div
            className="animate-float"
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #EA8303 0%, #f5a623 100%)",
              margin: "0 auto 2rem",
              position: "relative",
              boxShadow: "0 10px 40px rgba(234, 131, 3, 0.4)",
            }}
          >
            {/* Left Eye */}
            <div
              style={{
                position: "absolute",
                top: "35px",
                left: "30px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#1E1E1E",
              }}
            />
            {/* Right Eye */}
            <div
              style={{
                position: "absolute",
                top: "35px",
                right: "30px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#1E1E1E",
              }}
            />
            {/* Smile */}
            <div
              style={{
                position: "absolute",
                bottom: "30px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "50px",
                height: "25px",
                borderRadius: "0 0 50px 50px",
                border: "4px solid #1E1E1E",
                borderTop: "none",
                background: "transparent",
              }}
            />
          </div>

          {/* Welcome Text */}
          <h1
            className="animate-fadeInUp"
            style={{
              color: "#FFFFFF",
              fontSize: "2rem",
              fontWeight: "700",
              marginBottom: "0.5rem",
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            Welcome Back!
          </h1>

          {/* Username */}
          <p
            className="animate-fadeInUp"
            style={{
              color: "#EA8303",
              fontSize: "1.5rem",
              fontWeight: "600",
              margin: 0,
              animationDelay: "0.4s",
              animationFillMode: "both",
            }}
          >
            {welcomeUser}
          </p>

          {/* Loading dots */}
          <div
            className="animate-fadeIn"
            style={{
              marginTop: "2rem",
              display: "flex",
              justifyContent: "center",
              gap: "0.5rem",
              animationDelay: "0.6s",
              animationFillMode: "both",
            }}
          >
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#2D2D31",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "-20%",
          right: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(234, 131, 3, 0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(234, 131, 3, 0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-scaleIn"
        style={{
          background: "#1E1E1E",
          width: "100%",
          maxWidth: "440px",
          borderRadius: "16px",
          padding: "2.5rem",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Logo/Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1.5rem",
            }}
          >
            <img
              src={absLogo}
              alt="ABS Logo"
              className="animate-fadeIn"
              style={{ height: "60px", width: "auto" }}
            />
          </div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: "700",
              color: "#FFFFFF",
              marginBottom: "0.5rem",
              letterSpacing: "-0.025em",
            }}
          >
            Welcome Back
          </h1>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.5)",
              fontSize: "0.875rem",
              margin: 0,
            }}
          >
            Sign in to access the Dev Team Portal
          </p>
        </div>

        {/* Error Message */}
        {errMsg && (
          <div
            className="animate-slideDown"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "10px",
              padding: "0.875rem 1rem",
              marginBottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <i
              className="fas fa-exclamation-circle"
              style={{ color: "#ef4444" }}
            ></i>
            <p style={{ color: "#ef4444", fontSize: "0.875rem", margin: 0 }}>
              {errMsg}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Email Field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.8125rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255, 255, 255, 0.4)",
                  pointerEvents: "none",
                }}
              >
                <i
                  className="fas fa-envelope"
                  style={{ fontSize: "0.875rem" }}
                ></i>
              </div>
              <input
                type="email"
                id="email"
                ref={userRef}
                autoComplete="off"
                {...userAttribs}
                placeholder="Enter your email"
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.875rem 1rem 0.875rem 2.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#EA8303";
                  e.target.style.boxShadow = "0 0 0 3px rgba(234, 131, 3, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                color: "rgba(255, 255, 255, 0.7)",
                fontSize: "0.8125rem",
                fontWeight: "500",
                marginBottom: "0.5rem",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255, 255, 255, 0.4)",
                  pointerEvents: "none",
                }}
              >
                <i className="fas fa-lock" style={{ fontSize: "0.875rem" }}></i>
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                onChange={(e) => setPwd(e.target.value)}
                value={pwd}
                style={{
                  width: "100%",
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.875rem 3rem 0.875rem 2.75rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  transition: "all 0.2s ease",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#EA8303";
                  e.target.style.boxShadow = "0 0 0 3px rgba(234, 131, 3, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "1rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.4)",
                  cursor: "pointer",
                  padding: "0.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#EA8303";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.4)";
                }}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                  style={{ fontSize: "0.875rem" }}
                ></i>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="checkbox"
              id="persist"
              checked={persist}
              onChange={togglePersist}
              style={{
                width: "18px",
                height: "18px",
                borderRadius: "4px",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                background: persist ? "#EA8303" : "rgba(255, 255, 255, 0.04)",
                cursor: "pointer",
                accentColor: "#EA8303",
              }}
            />
            <label
              htmlFor="persist"
              style={{
                marginLeft: "0.75rem",
                fontSize: "0.875rem",
                color: "rgba(255, 255, 255, 0.6)",
                cursor: "pointer",
                userSelect: "none",
              }}
            >
              Keep me signed in
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "linear-gradient(135deg, rgba(234, 131, 3, 0.5) 0%, rgba(234, 131, 3, 0.3) 100%)"
                : "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "12px",
              padding: "0.875rem 1.5rem",
              fontSize: "0.9375rem",
              fontWeight: "600",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              boxShadow:
                "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 1) 0%, rgba(234, 131, 3, 0.85) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(234, 131, 3, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }
            }}
          >
            {loading ? (
              <span
                className="spinner"
                style={{
                  width: "1.2em",
                  height: "1.2em",
                  border: "2px solid #fff",
                  borderTop: "2px solid #ea8303",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
            ) : (
              <i className="fas fa-sign-in-alt"></i>
            )}
            {loading ? "Signing In..." : "Sign In"}
          </button>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "0.75rem",
              margin: 0,
            }}
          >
            ABS Development Team Portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
