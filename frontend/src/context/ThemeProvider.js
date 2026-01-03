import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("theme");
      if (saved === "dark") {
        setTheme("dark");
        document.documentElement.classList.add("dark-theme");
      } else {
        setTheme("light");
        document.documentElement.classList.remove("dark-theme");
        document.documentElement.classList.add("light-theme");
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "light" ? "dark" : "light";
      try {
        if (next === "dark") {
          document.documentElement.classList.add("dark-theme");
          document.documentElement.classList.remove("light-theme");
        } else {
          document.documentElement.classList.remove("dark-theme");
          document.documentElement.classList.add("light-theme");
        }
        localStorage.setItem("theme", next);
      } catch (e) {
        // ignore
      }
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
