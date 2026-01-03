import React, { useState } from "react";

const Snowfall = () => {
  const [isSnowing, setIsSnowing] = useState(false);

  // Generate 40 snowflakes
  const snowflakes = Array.from({ length: 40 }, (_, i) => (
    <div key={i} className="snowflake" />
  ));

  return (
    <>
      {isSnowing && <div className="snowfall-container">{snowflakes}</div>}
      <button
        onClick={() => setIsSnowing(!isSnowing)}
        title={isSnowing ? "Stop snow" : "Let it snow!"}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          zIndex: 10000,
          width: "45px",
          height: "45px",
          borderRadius: "50%",
          border: "none",
          background: "rgba(30, 30, 30, 0.8)",
          backdropFilter: "blur(10px)",
          color: "#fff",
          fontSize: "1.2rem",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.3)",
          transition: "all 0.3s ease",
          opacity: 0.7,
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = "1";
          e.target.style.transform = "scale(1.1)";
          e.target.style.background = isSnowing
            ? "rgba(234, 131, 3, 0.8)"
            : "rgba(30, 30, 30, 0.9)";
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = "0.7";
          e.target.style.transform = "scale(1)";
          e.target.style.background = "rgba(30, 30, 30, 0.8)";
        }}
      >
        {isSnowing ? "❄️" : "☀️"}
      </button>
    </>
  );
};

export default Snowfall;
