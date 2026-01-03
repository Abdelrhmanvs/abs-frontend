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

  useEffect(() => {
    setErrMsg("");
  }, [user, pwd]);

  const handleSubmit = async (e) => {
    e.preventDefault();

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

      setAuth({ user: email, roles, accessToken });
      navigate(from, { replace: true });
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
    }
  };

  const togglePersist = () => {
    setPersist((prev) => !prev);
  };

  useEffect(() => {
    localStorage.setItem("persist", persist);
  }, [persist]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "#1a1a1a",
      }}
    >
      <div
        className="w-full max-w-lg rounded-2xl p-10"
        style={{
          background: "#2d2d2d",
        }}
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <img
            src={absLogo}
            alt="ABS Logo"
            className="mx-auto mb-4"
            style={{ height: "80px", width: "auto" }}
          />
          <h2 className="text-xl font-semibold text-white">Dev Team Portal</h2>
        </div>

        {errMsg && (
          <div className="mb-6 p-3 rounded-lg bg-red-500 bg-opacity-10 border border-red-500">
            <p className="text-red-400 text-sm text-center">{errMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium mb-2 text-white"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              ref={userRef}
              autoComplete="off"
              {...userAttribs}
              placeholder="Enter your email"
              className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              style={{
                background: "#3a3a3a",
                borderColor: "#4a4a4a",
                color: "#ffffff",
              }}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium mb-2 text-white"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                onChange={(e) => setPwd(e.target.value)}
                value={pwd}
                className="w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                style={{
                  background: "#3a3a3a",
                  borderColor: "#4a4a4a",
                  color: "#ffffff",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                style={{ color: "#9ca3af" }}
              >
                <i
                  className={`fas ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                ></i>
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="persist"
              checked={persist}
              onChange={togglePersist}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 focus:ring-2 focus:ring-orange-500 cursor-pointer"
              style={{
                accentColor: "#f97316",
              }}
            />
            <label
              htmlFor="persist"
              className="ml-2 text-sm text-gray-300 cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-lg text-white font-semibold transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background: "#f97316",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "#ea580c";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "#f97316";
            }}
          >
            <i className="fas fa-sign-in-alt"></i>
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
