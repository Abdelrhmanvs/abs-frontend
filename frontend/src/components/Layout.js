import { Outlet, useLocation } from "react-router-dom";
import UpperNav from "./UpperNav";

const Layout = () => {
  const location = useLocation();
  const isAuthPage =
    location.pathname === "/login" ||
    location.pathname === "/" ||
    location.pathname === "/unauthorized";

  return (
    <div className="App">
      {!isAuthPage ? (
        <div style={{ display: "flex" }}>
          <UpperNav />
          <main style={{ flex: 1 }}>
            <Outlet />
          </main>
        </div>
      ) : (
        <main>
          <Outlet />
        </main>
      )}
    </div>
  );
};

export default Layout;
