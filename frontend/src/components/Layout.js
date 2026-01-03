import { Outlet, useLocation } from "react-router-dom";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Snowfall from "./Snowfall";

const Layout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/" ||
    location.pathname === "/unauthorized";

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="App">
      <Snowfall />
      {!isAuthPage ? (
        <>
          <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
          {/* Mobile Menu Button */}
          <button
            className="mobile-menu-btn"
            onClick={toggleSidebar}
            style={{
              position: "fixed",
              top: "1rem",
              left: "1rem",
              zIndex: 997,
              background: "#1E1E1E",
              border: "1px solid rgba(255, 255, 255, 0.08)",
              borderRadius: "8px",
              color: "#FFFFFF",
              cursor: "pointer",
              fontSize: "1.25rem",
              padding: "0.625rem 0.75rem",
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
              transition: "all 0.2s ease",
            }}
          >
            <i className="fas fa-bars"></i>
          </button>
          <main className="main-content">
            <Outlet />
          </main>
        </>
      ) : (
        <main>
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default Layout;
