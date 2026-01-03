import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Requests from "./components/Requests";
import HRForm from "./components/HRForm";
import Employees from "./components/Employees";
import FromHome from "./components/FromHome";
import Layout from "./components/Layout";
import Missing from "./components/Missing";
import Unauthorized from "./components/Unauthorized";
import RequireAuth from "./components/RequireAuth";
import PersistLogin from "./components/PersistLogin";
import { Routes, Route } from "react-router-dom";

const roles = {
  admin: "admin",
  user: "user",
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* public routes */}
        <Route index element={<Login />} />
        <Route path="login" element={<Login />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        {/* protected routes */}
        <Route element={<PersistLogin />}>
          {/* Routes accessible by both admin and user */}
          <Route
            element={<RequireAuth allowedRoles={[roles.admin, roles.user]} />}
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/requests" element={<Requests />} />
          </Route>

          {/* Admin-only routes */}
          <Route element={<RequireAuth allowedRoles={[roles.admin]} />}>
            <Route path="/hr-form" element={<HRForm />} />
            <Route path="/add-employee" element={<Employees />} />
            <Route path="/add-from-home" element={<FromHome />} />
          </Route>
        </Route>

        {/* catch all */}
        <Route path="*" element={<Missing />} />
      </Route>
    </Routes>
  );
}

export default App;
