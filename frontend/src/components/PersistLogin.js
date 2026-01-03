import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import useRefreshToken from "../hooks/useRefreshToken";
import useAuth from "../hooks/useAuth";
import useLocalStorage from "../hooks/useLocalStorage";

const PersistLogin = () => {
  const [isLoading, setIsLoading] = useState(true);
  const refresh = useRefreshToken();
  const { auth } = useAuth();
  const [persist] = useLocalStorage("persist", false);

  useEffect(() => {
    let isMounted = true;

    const verifyRefreshToken = async () => {
      try {
        await refresh();
      } catch (err) {
        console.error(err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Only verify if we don't have an access token and persist is enabled
    if (!auth?.accessToken && persist) {
      verifyRefreshToken();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []); // Only run once on mount

  // Don't show loading for non-persist mode or if auth already exists
  if (!persist) {
    return <Outlet />;
  }

  // Show a minimal loading indicator that doesn't cause layout shift
  if (isLoading) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1a1a1a",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            color: "#f97316",
            fontSize: "1.5rem",
            fontWeight: "600",
          }}
        >
          Loading...
        </div>
      </div>
    );
  }

  return <Outlet />;
};

export default PersistLogin;
