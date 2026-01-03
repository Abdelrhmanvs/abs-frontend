import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useLogout from "../hooks/useLogout";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import absLogo from "../assets/ABS-Logo.png";

// NavItem component with enhanced hover
const NavItem = ({ to, icon, label, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={({ isActive }) => ({
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.5rem",
        color: isActive
          ? "#EA8303"
          : isHovered
          ? "#FFFFFF"
          : "rgba(255, 255, 255, 0.5)",
        textDecoration: "none",
        background: isActive
          ? "rgba(234, 131, 3, 0.12)"
          : isHovered
          ? "rgba(255, 255, 255, 0.05)"
          : "transparent",
        borderLeft: isActive
          ? "3px solid #EA8303"
          : isHovered
          ? "3px solid rgba(234, 131, 3, 0.5)"
          : "3px solid transparent",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        fontSize: "0.875rem",
        fontWeight: "500",
        position: "relative",
        overflow: "hidden",
      })}
    >
      {/* Hover glow effect */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "60px",
            background:
              "linear-gradient(90deg, rgba(234, 131, 3, 0.15) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      <i
        className={`fas ${icon}`}
        style={{
          fontSize: "1.125rem",
          transition: "transform 0.3s ease, color 0.3s ease",
          transform: isHovered ? "scale(1.15)" : "scale(1)",
          position: "relative",
          zIndex: 1,
        }}
      />
      <span
        style={{
          fontWeight: "500",
          position: "relative",
          zIndex: 1,
          transition: "transform 0.3s ease",
          transform: isHovered ? "translateX(4px)" : "translateX(0)",
        }}
      >
        {label}
      </span>
    </NavLink>
  );
};

const Sidebar = ({ isOpen, onClose }) => {
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

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="sidebar-overlay"
          onClick={onClose}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 998,
            display: "none",
          }}
        />
      )}

      {/* Sidebar */}
      <div
        className={`sidebar ${isOpen ? "sidebar-open" : ""}`}
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
          zIndex: 999,
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: "2px 0 8px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Logo Section */}
        <div
          className="animate-fadeIn"
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
              position: "relative",
            }}
          >
            {/* Orbiting particles */}
            <div
              className="orbit-container"
              style={{
                position: "absolute",
                width: "90px",
                height: "90px",
                animation: "orbitSpin 8s linear infinite",
              }}
            >
              <div
                className="orbit-particle"
                style={{
                  position: "absolute",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#EA8303",
                  top: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  boxShadow:
                    "0 0 10px #EA8303, 0 0 20px rgba(234, 131, 3, 0.5)",
                }}
              />
              <div
                className="orbit-particle"
                style={{
                  position: "absolute",
                  width: "4px",
                  height: "4px",
                  borderRadius: "50%",
                  background: "#fff",
                  bottom: "0",
                  left: "50%",
                  transform: "translateX(-50%)",
                  boxShadow: "0 0 8px #fff",
                  opacity: 0.7,
                }}
              />
            </div>
            {/* Second orbit - counter rotation */}
            <div
              className="orbit-container"
              style={{
                position: "absolute",
                width: "70px",
                height: "70px",
                animation: "orbitSpinReverse 6s linear infinite",
              }}
            >
              <div
                className="orbit-particle"
                style={{
                  position: "absolute",
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "rgba(234, 131, 3, 0.8)",
                  top: "50%",
                  right: "0",
                  transform: "translateY(-50%)",
                  boxShadow: "0 0 8px rgba(234, 131, 3, 0.6)",
                }}
              />
              <div
                className="orbit-particle"
                style={{
                  position: "absolute",
                  width: "3px",
                  height: "3px",
                  borderRadius: "50%",
                  background: "rgba(255, 255, 255, 0.6)",
                  top: "50%",
                  left: "0",
                  transform: "translateY(-50%)",
                  boxShadow: "0 0 6px rgba(255, 255, 255, 0.4)",
                }}
              />
            </div>
            {/* Pulsing core glow */}
            <div
              style={{
                position: "absolute",
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background:
                  "radial-gradient(circle, rgba(234, 131, 3, 0.3) 0%, transparent 70%)",
                animation: "coreGlow 2s ease-in-out infinite",
              }}
            />
            <img
              src={absLogo}
              alt="ABS Logo"
              style={{
                height: "32px",
                width: "auto",
                transition: "transform 0.3s ease",
                position: "relative",
                zIndex: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: "1rem 0" }}>
          <NavItem
            to="/dashboard"
            icon="fa-home"
            label="Dashboard"
            onClick={handleLinkClick}
          />

          <NavItem
            to="/requests"
            icon="fa-list"
            label="Requests"
            onClick={handleLinkClick}
          />

          {/* Admin-only pages */}
          {isAdmin && (
            <>
              <NavItem
                to="/hr-form"
                icon="fa-clipboard"
                label="HR Form"
                onClick={handleLinkClick}
              />

              <NavItem
                to="/add-employee"
                icon="fa-user-plus"
                label="Employees"
                onClick={handleLinkClick}
              />

              <NavItem
                to="/add-from-home"
                icon="fa-home"
                label="From Home"
                onClick={handleLinkClick}
              />
            </>
          )}
        </nav>

        {/* User Profile & Logout Section */}
        <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <ProfileLink
            to="/profile"
            onClick={handleLinkClick}
            userProfile={userProfile}
            auth={auth}
            isAdmin={isAdmin}
          />

          <LogoutButton onClick={handleLogout} />
        </div>
      </div>
    </>
  );
};

// Profile Link Component with enhanced hover
const ProfileLink = ({ to, onClick, userProfile, auth, isAdmin }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <NavLink
      to={to}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={({ isActive }) => ({
        padding: "1rem 1.5rem",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        textDecoration: "none",
        background: isActive
          ? "rgba(234, 131, 3, 0.12)"
          : isHovered
          ? "rgba(255, 255, 255, 0.05)"
          : "transparent",
        borderLeft: isActive
          ? "3px solid #EA8303"
          : isHovered
          ? "3px solid rgba(234, 131, 3, 0.5)"
          : "3px solid transparent",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      })}
    >
      {/* Hover glow effect */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "80px",
            background:
              "linear-gradient(90deg, rgba(234, 131, 3, 0.15) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: isHovered
            ? "rgba(234, 131, 3, 0.25)"
            : "rgba(234, 131, 3, 0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#EA8303",
          fontWeight: "600",
          fontSize: "0.875rem",
          transition: "all 0.3s ease",
          transform: isHovered ? "scale(1.05)" : "scale(1)",
          boxShadow: isHovered ? "0 4px 12px rgba(234, 131, 3, 0.3)" : "none",
          position: "relative",
          zIndex: 1,
        }}
      >
        {userProfile?.firstName
          ? userProfile.firstName.substring(0, 2).toUpperCase()
          : userProfile?.fullName
          ? userProfile.fullName.substring(0, 2).toUpperCase()
          : auth?.user
          ? auth.user.substring(0, 2).toUpperCase()
          : "JD"}
      </div>
      <div style={{ flex: 1, position: "relative", zIndex: 1 }}>
        <div
          style={{
            color: "#FFFFFF",
            fontSize: "0.875rem",
            fontWeight: "500",
            transition: "transform 0.3s ease",
            transform: isHovered ? "translateX(4px)" : "translateX(0)",
          }}
        >
          {userProfile?.firstName ||
            userProfile?.fullName ||
            userProfile?.name ||
            auth?.user ||
            "John Doe"}
        </div>
        <div
          style={{
            color: isHovered
              ? "rgba(255, 255, 255, 0.7)"
              : "rgba(255, 255, 255, 0.5)",
            fontSize: "0.75rem",
            transition: "all 0.3s ease",
            transform: isHovered ? "translateX(4px)" : "translateX(0)",
          }}
        >
          {isAdmin ? "Admin" : userProfile?.title || "Employee"}
        </div>
      </div>
    </NavLink>
  );
};

// Logout Button Component with enhanced hover
const LogoutButton = ({ onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1.5rem",
        color: isHovered ? "#EF4444" : "rgba(255, 255, 255, 0.5)",
        background: isHovered ? "rgba(239, 68, 68, 0.1)" : "transparent",
        border: "none",
        borderLeft: isHovered ? "3px solid #EF4444" : "3px solid transparent",
        cursor: "pointer",
        fontSize: "0.875rem",
        fontWeight: "500",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Hover glow effect */}
      {isHovered && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "60px",
            background:
              "linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)",
            pointerEvents: "none",
          }}
        />
      )}
      <i
        className="fas fa-sign-out-alt"
        style={{
          fontSize: "1.125rem",
          transition: "transform 0.3s ease",
          transform: isHovered
            ? "translateX(-2px) scale(1.1)"
            : "translateX(0) scale(1)",
          position: "relative",
          zIndex: 1,
        }}
      />
      <span
        style={{
          transition: "transform 0.3s ease",
          transform: isHovered ? "translateX(4px)" : "translateX(0)",
          position: "relative",
          zIndex: 1,
        }}
      >
        Logout
      </span>
    </button>
  );
};

export default Sidebar;
