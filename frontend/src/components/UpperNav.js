import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import absLogo from "../assets/ABS-Logo.png";

const UpperNav = () => {
  const { auth } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();
  const axiosPrivate = useAxiosPrivate();
  const [userProfile, setUserProfile] = useState(null);

  // Check if user is admin
  const isAdmin = auth?.roles?.includes("admin");

  // Fetch user profile to get title
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await axiosPrivate.get("/users/profile");
        setUserProfile(response.data.user);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    if (auth?.user) {
      fetchUserProfile();
    }
  }, [auth?.user, axiosPrivate]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "235px",
          background: "#1E1E1E",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          left: 0,
          top: 0,
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo Section */}
        <div
          style={{
            padding: "1.5rem 1rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            <img
              src={absLogo}
              alt="ABS Logo"
              style={{ height: "32px", width: "auto" }}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          <NavLink
            to="/dashboard"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1.5rem",
              color: isActive ? "#EA8303" : "rgba(255, 255, 255, 0.5)",
              textDecoration: "none",
              background: isActive ? "rgba(234, 131, 3, 0.12)" : "transparent",
              borderLeft: isActive
                ? "3px solid #EA8303"
                : "3px solid transparent",
              transition: "all 0.2s",
              fontSize: "0.875rem",
              fontWeight: "500",
            })}
          >
            <i className="fas fa-home" style={{ fontSize: "1.125rem" }}></i>
            <span style={{ fontWeight: "500" }}>Dashboard</span>
          </NavLink>

          <NavLink
            to="/requests"
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1.5rem",
              color: isActive ? "#EA8303" : "rgba(255, 255, 255, 0.5)",
              textDecoration: "none",
              background: isActive ? "rgba(234, 131, 3, 0.12)" : "transparent",
              borderLeft: isActive
                ? "3px solid #EA8303"
                : "3px solid transparent",
              transition: "all 0.2s",
              fontSize: "0.875rem",
              fontWeight: "500",
            })}
          >
            <i className="fas fa-list" style={{ fontSize: "1.125rem" }}></i>
            <span style={{ fontWeight: "500" }}>Requests</span>
          </NavLink>

          {/* Admin-only pages */}
          {isAdmin && (
            <>
              <NavLink
                to="/hr-form"
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  color: isActive ? "#EA8303" : "rgba(255, 255, 255, 0.5)",
                  textDecoration: "none",
                  background: isActive
                    ? "rgba(234, 131, 3, 0.12)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid #EA8303"
                    : "3px solid transparent",
                  transition: "all 0.2s",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                })}
              >
                <i
                  className="fas fa-clipboard"
                  style={{ fontSize: "1.125rem" }}
                ></i>
                <span style={{ fontWeight: "500" }}>HR Form</span>
              </NavLink>

              <NavLink
                to="/add-employee"
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  color: isActive ? "#EA8303" : "rgba(255, 255, 255, 0.5)",
                  textDecoration: "none",
                  background: isActive
                    ? "rgba(234, 131, 3, 0.12)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid #EA8303"
                    : "3px solid transparent",
                  transition: "all 0.2s",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                })}
              >
                <i
                  className="fas fa-user-plus"
                  style={{ fontSize: "1.125rem" }}
                ></i>
                <span style={{ fontWeight: "500" }}>Employees</span>
              </NavLink>

              <NavLink
                to="/add-from-home"
                style={({ isActive }) => ({
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.75rem 1.5rem",
                  color: isActive ? "#EA8303" : "rgba(255, 255, 255, 0.5)",
                  textDecoration: "none",
                  background: isActive
                    ? "rgba(234, 131, 3, 0.12)"
                    : "transparent",
                  borderLeft: isActive
                    ? "3px solid #EA8303"
                    : "3px solid transparent",
                  transition: "all 0.2s",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                })}
              >
                <i className="fas fa-home" style={{ fontSize: "1.125rem" }}></i>
                <span style={{ fontWeight: "500" }}>From Home</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User Profile & Logout Section */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div
            style={{
              padding: "1rem 1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                background: "rgba(234, 131, 3, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#EA8303",
                fontWeight: "600",
                fontSize: "0.875rem",
              }}
            >
              {userProfile?.fullName
                ? userProfile.fullName.substring(0, 2).toUpperCase()
                : auth?.user
                ? auth.user.substring(0, 2).toUpperCase()
                : "JD"}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: "#FFFFFF",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                }}
              >
                {userProfile?.fullName ||
                  userProfile?.name ||
                  auth?.user ||
                  "John Doe"}
              </div>
              <div
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                }}
              >
                {isAdmin ? "Admin" : userProfile?.title || "Employee"}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.75rem 1.5rem",
              color: "rgba(255, 255, 255, 0.5)",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: "0.875rem",
              fontWeight: "500",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#EA8303";
              e.currentTarget.style.background = "rgba(234, 131, 3, 0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <i
              className="fas fa-sign-out-alt"
              style={{ fontSize: "1.125rem" }}
            ></i>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Top Navbar for Notifications */}
      <div
        style={{
          marginLeft: "235px",
          width: "calc(100% - 235px)",
          position: "fixed",
          top: 0,
          right: 0,
          background: "#2D2D31",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          padding: "1rem 2rem",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <button
          style={{
            background: "transparent",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            cursor: "pointer",
            fontSize: "1.25rem",
            padding: "0.5rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#EA8303";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
          }}
        >
          <i className="fas fa-bell"></i>
        </button>
      </div>
    </div>
  );
};

export default UpperNav;
