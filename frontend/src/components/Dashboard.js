import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const Dashboard = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch recent requests on component mount
  useEffect(() => {
    const fetchRecentRequests = async () => {
      try {
        const endpoint = auth?.roles?.includes("admin")
          ? "/requests?limit=5"
          : "/requests/my?limit=5";
        const response = await axiosPrivate.get(endpoint);
        const formattedRequests = response.data.map((req) => ({
          id: req._id,
          type: req.type,
          date: new Date(req.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
          status: req.status,
        }));
        setRecentRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching recent requests:", error);
        // Keep empty array on error
      }
    };

    fetchRecentRequests();
  }, [axiosPrivate, auth?.roles]);

  const [weekSchedule, setWeekSchedule] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [teamWFH, setTeamWFH] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    requestType: "",
    startDate: "",
    endDate: "",
  });
  const [customFormData, setCustomFormData] = useState({
    employeeId: "",
    requestType: "",
    startDate: "",
    endDate: "",
  });

  // Get current week days (Saturday to Friday, Egypt week)
  const getCurrentWeek = (offset = 0) => {
    // تاريخ النهارده الحقيقي
    const realToday = new Date();
    realToday.setHours(0, 0, 0, 0);

    // اليوم الأساسي للحساب (ممكن يكون أسبوع فات أو جاي)
    const baseDate = new Date(realToday);
    baseDate.setDate(baseDate.getDate() + offset * 7);

    // JS: 0 = Sunday ... 6 = Saturday
    const dayOfWeek = baseDate.getDay();

    // Egypt week starts on Saturday
    // نحسب عدد الأيام اللي نرجعها لحد السبت الحالي
    const diffToSaturday = (dayOfWeek + 1) % 7;

    const saturday = new Date(baseDate);
    saturday.setDate(baseDate.getDate() - diffToSaturday);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(saturday);
      day.setDate(saturday.getDate() + i);

      const localDate = new Date(
        day.getFullYear(),
        day.getMonth(),
        day.getDate()
      );
      week.push({
        date: localDate.toLocaleDateString("en-CA"),
        dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day.getDate(),
        isToday: day.toDateString() === realToday.toDateString(),
      });
    }

    return week;
  };

  const currentWeek = getCurrentWeek(weekOffset);

  // Fetch WFH schedule for current week
  useEffect(() => {
    const fetchWeekSchedule = async () => {
      try {
        const response = await axiosPrivate.get("/requests/week");
        setWeekSchedule(response.data);
      } catch (error) {
        console.error("Error fetching week schedule:", error);
        setWeekSchedule([]);
      }
    };

    fetchWeekSchedule();
  }, [axiosPrivate]);

  // Fetch team WFH data for team leads and admins
  useEffect(() => {
    const fetchTeamWFH = async () => {
      try {
        const response = await axiosPrivate.get("/requests/weekly-wfh");
        // Filter for today only
        const today = new Date().toLocaleDateString("en-CA");
        const todayWFH = [];

        response.data.employees.forEach((employee) => {
          const todaySchedule = employee.weekSchedule.find(
            (day) => day.date === today && day.isWFH
          );
          if (todaySchedule) {
            todayWFH.push({
              name: employee.employeeName,
              fingerprint: employee.fingerprint,
              type: todaySchedule.type,
            });
          }
        });

        setTeamWFH(todayWFH);
      } catch (error) {
        console.error("Error fetching team WFH:", error);
        // If 403, user is not a team lead/admin
        setTeamWFH([]);
      }
    };

    fetchTeamWFH();
  }, [axiosPrivate]);

  const isWFHDay = (date) => {
    const targetDate = new Date(
      new Date(date).getFullYear(),
      new Date(date).getMonth(),
      new Date(date).getDate()
    );

    const schedule = weekSchedule.find((schedule) => {
      const scheduleDate = new Date(
        new Date(schedule.date).getFullYear(),
        new Date(schedule.date).getMonth(),
        new Date(schedule.date).getDate()
      );
      return scheduleDate.getTime() === targetDate.getTime();
    });

    return schedule
      ? { hasRequest: true, type: schedule.type }
      : { hasRequest: false, type: null };
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "rejected":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Fetch employees for custom request (admin only)
  useEffect(() => {
    if (auth?.roles?.includes("admin")) {
      const fetchEmployees = async () => {
        try {
          const response = await axiosPrivate.get("/users/employees");
          setEmployees(response.data);
        } catch (error) {
          console.error("Error fetching employees:", error);
        }
      };
      fetchEmployees();
    }
  }, [auth?.roles, axiosPrivate]);

  const handleNewRequest = () => {
    setShowModal(true);
  };

  const handleCustomRequest = () => {
    setShowCustomModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      requestType: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleCloseCustomModal = () => {
    setShowCustomModal(false);
    setCustomFormData({
      employeeId: "",
      requestType: "",
      startDate: "",
      endDate: "",
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Auto-set end date when start date is selected
      ...(name === "startDate" && { endDate: value }),
    }));
  };

  const handleCustomFormChange = (e) => {
    const { name, value } = e.target;
    setCustomFormData((prev) => ({
      ...prev,
      [name]: value,
      // Auto-set end date when start date is selected
      ...(name === "startDate" && { endDate: value }),
    }));
  };

  const handleSubmitCustomRequest = async (e) => {
    e.preventDefault();

    if (
      !customFormData.employeeId ||
      !customFormData.requestType ||
      !customFormData.startDate ||
      !customFormData.endDate
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const start = new Date(customFormData.startDate);
      const end = new Date(customFormData.endDate);
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const requestData = {
        employeeId: customFormData.employeeId,
        type: customFormData.requestType,
        startDate: customFormData.startDate,
        endDate: customFormData.endDate,
        numberOfDays: numberOfDays,
      };

      await axiosPrivate.post("/requests/admin", requestData);
      handleCloseCustomModal();

      // Refresh recent requests
      const response = await axiosPrivate.get("/requests/my?limit=5");
      const formattedRequests = response.data.map((req) => ({
        id: req._id,
        type: req.type,
        date: new Date(req.createdAt).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        status: req.status,
      }));
      setRecentRequests(formattedRequests);
    } catch (error) {
      console.error("Error creating custom request:", error);
      alert(
        error.response?.data?.message ||
          "Failed to create request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!formData.requestType || !formData.startDate || !formData.endDate) {
      alert("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      // Calculate number of days
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      const numberOfDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      const requestData = {
        type: formData.requestType,
        startDate: formData.startDate,
        endDate: formData.endDate,
        numberOfDays: numberOfDays,
      };

      await axiosPrivate.post("/requests", requestData);
      handleCloseModal();
      // Redirect to requests page
      navigate("/requests");
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error.response?.data?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#2D2D31", minHeight: "100vh", padding: "2rem" }}>
      {/* Quick Actions Bar */}
      <div
        className="animate-fadeInDown"
        style={{
          background: "#1E1E1E",
          borderRadius: "12px",
          padding: "1rem 1.5rem",
          marginBottom: "2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
        }}
      >
        <h2
          style={{
            fontSize: "0.875rem",
            fontWeight: "500",
            color: "#FFFFFF",
            margin: 0,
            opacity: 0.7,
            letterSpacing: "0.5px",
          }}
        >
          Quick Actions
        </h2>
        <div>
          {!auth?.roles?.includes("admin") && (
            <button
              onClick={handleNewRequest}
              style={{
                background:
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 1) 0%, rgba(234, 131, 3, 0.85) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(234, 131, 3, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>+</span>
              New Request
            </button>
          )}
          {auth?.roles?.includes("admin") && (
            <button
              onClick={handleCustomRequest}
              style={{
                background:
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#FFFFFF",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "12px",
                padding: "0.625rem 1.25rem",
                fontSize: "0.875rem",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
                boxShadow:
                  "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 1) 0%, rgba(234, 131, 3, 0.85) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 6px 20px rgba(234, 131, 3, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)";
                e.currentTarget.style.boxShadow =
                  "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <span style={{ fontSize: "1.125rem", lineHeight: "1" }}>+</span>
              Custom Request
            </button>
          )}
        </div>
      </div>

      {/* Current Week Schedule Section */}
      <div
        className="animate-fadeInUp hover-lift"
        style={{
          background: "#1E1E1E",
          borderRadius: "16px",
          padding: "2rem",
          marginBottom: "2.5rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          animationDelay: "0.1s",
          animationFillMode: "both",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "1.75rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "1.125rem",
                fontWeight: "600",
                color: "#FFFFFF",
                letterSpacing: "-0.01em",
                marginBottom: "0.25rem",
              }}
            >
              My Schedule
            </h2>

            <div
              style={{
                fontSize: "0.75rem",
                color: "rgba(255, 255, 255, 0.5)",
                fontWeight: "500",
              }}
            >
              {new Date(currentWeek[0].date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              →{" "}
              {new Date(currentWeek[6].date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>

          <button
            onClick={() => setWeekOffset(0)}
            disabled={weekOffset === 0}
            style={{
              background:
                weekOffset === 0
                  ? "rgba(255, 255, 255, 0.04)"
                  : "linear-gradient(135deg, rgba(234, 131, 3, 0.9), rgba(234, 131, 3, 0.7))",
              border:
                weekOffset === 0
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid rgba(234, 131, 3, 0.6)",
              color: weekOffset === 0 ? "rgba(255, 255, 255, 0.4)" : "#FFFFFF",
              borderRadius: "999px",
              padding: "0.45rem 1rem",
              fontSize: "0.75rem",
              fontWeight: "600",
              cursor: weekOffset === 0 ? "not-allowed" : "pointer",
              opacity: weekOffset === 0 ? 0.7 : 1,
              boxShadow:
                weekOffset === 0
                  ? "none"
                  : "0 4px 14px rgba(234, 131, 3, 0.35)",
              transition: "all 0.25s ease",
            }}
          >
            Current Week
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "stretch",
            gap: "0.75rem",
          }}
        >
          {/* Previous Week */}
          <button
            onClick={() => setWeekOffset((prev) => prev - 1)}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              borderRadius: "14px",
              width: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ◀
          </button>

          {/* Days */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))",
              gap: "1rem",
              flex: 1,
            }}
          >
            {currentWeek.map((day, index) => {
              const daySchedule = isWFHDay(day.date);
              const isFriday = day.dayName === "Fri";
              const isHighlighted = day.isToday || daySchedule.hasRequest;

              return (
                <div
                  key={index}
                  style={{
                    background: day.isToday ? "#2A2A2E" : "#1E1E1E",
                    border: day.isToday
                      ? "2px solid #EA8303"
                      : "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: "12px",
                    padding: "1.25rem 0.75rem",
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: "600",
                      color: day.isToday
                        ? "#EA8303"
                        : "rgba(255, 255, 255, 0.5)",
                      marginBottom: "0.625rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {day.dayName}
                  </div>
                  <div
                    style={{
                      fontSize: "1.75rem",
                      fontWeight: "600",
                      color: day.isToday ? "#EA8303" : "#FFFFFF",
                      marginBottom: "0.75rem",
                      lineHeight: "1",
                    }}
                  >
                    {day.dayNumber}
                  </div>
                  {isFriday ? (
                    <div
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: "500",
                        color: "rgba(255, 255, 255, 0.4)",
                        background: "rgba(255, 255, 255, 0.05)",
                        padding: "0.375rem 0.5rem",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <i
                        className="fas fa-calendar-times"
                        style={{ fontSize: "0.625rem" }}
                      ></i>
                      Holiday
                    </div>
                  ) : daySchedule.hasRequest ? (
                    <div
                      style={{
                        fontSize: "0.625rem",
                        fontWeight: "500",
                        color: "#EA8303",
                        background: "rgba(234, 131, 3, 0.12)",
                        padding: "0.375rem 0.5rem",
                        borderRadius: "6px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <i
                        className="fas fa-home"
                        style={{ fontSize: "0.625rem" }}
                      ></i>
                      {daySchedule.type === "WFH" ? "WFH" : "Leave"}
                    </div>
                  ) : (
                    <div
                      style={{
                        fontSize: "0.6875rem",
                        fontWeight: "500",
                        color: "rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      Office
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Next Week */}
          <button
            onClick={() => setWeekOffset((prev) => prev + 1)}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              borderRadius: "14px",
              width: "42px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1rem",
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Team WFH Today Section - Only for Team Leads and Admins */}
      {teamWFH.length > 0 && (
        <div
          className="animate-fadeInUp hover-lift"
          style={{
            background: "#1E1E1E",
            borderRadius: "16px",
            padding: "2rem",
            marginBottom: "2.5rem",
            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
            animationDelay: "0.2s",
            animationFillMode: "both",
          }}
        >
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              marginBottom: "1.75rem",
              letterSpacing: "-0.01em",
            }}
          >
            Team Working From Home Today
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            {teamWFH.map((employee, index) => (
              <div
                key={index}
                style={{
                  background: "#1E1E1E",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "12px",
                  padding: "1.25rem",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#2A2A2E";
                  e.currentTarget.style.borderColor = "rgba(234, 131, 3, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1E1E1E";
                  e.currentTarget.style.borderColor =
                    "rgba(255, 255, 255, 0.08)";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                  }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "10px",
                      background: "rgba(234, 131, 3, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#EA8303",
                      fontWeight: "600",
                      fontSize: "0.9375rem",
                      flexShrink: 0,
                    }}
                  >
                    {employee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: "#FFFFFF",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        marginBottom: "0.25rem",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {employee.name}
                    </div>
                    <div
                      style={{
                        color: "rgba(255, 255, 255, 0.4)",
                        fontSize: "0.75rem",
                        fontWeight: "400",
                      }}
                    >
                      {employee.fingerprint}
                    </div>
                  </div>
                  <div
                    style={{
                      background:
                        employee.type === "WFH"
                          ? "rgba(234, 131, 3, 0.12)"
                          : "rgba(255, 255, 255, 0.08)",
                      color:
                        employee.type === "WFH"
                          ? "#EA8303"
                          : "rgba(255, 255, 255, 0.6)",
                      padding: "0.375rem 0.625rem",
                      borderRadius: "6px",
                      fontSize: "0.6875rem",
                      fontWeight: "600",
                      letterSpacing: "0.3px",
                      flexShrink: 0,
                    }}
                  >
                    {employee.type === "WFH" ? "WFH" : "Vacation"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Requests Section */}
      <div
        className="animate-fadeInUp hover-lift"
        style={{
          background: "#1E1E1E",
          borderRadius: "16px",
          padding: "2rem",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.2)",
          animationDelay: "0.3s",
          animationFillMode: "both",
        }}
      >
        <h2
          style={{
            fontSize: "1.125rem",
            fontWeight: "600",
            color: "#FFFFFF",
            marginBottom: "1.75rem",
            letterSpacing: "-0.01em",
          }}
        >
          Recent Requests
        </h2>

        {/* Table */}
        {recentRequests.length > 0 ? (
          <div
            style={{ overflowX: "auto", margin: "0 -2rem", padding: "0 2rem" }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "separate",
                borderSpacing: 0,
              }}
            >
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    Request Type
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    Date
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: "rgba(255, 255, 255, 0.5)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                      background: "rgba(255, 255, 255, 0.02)",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request, index) => (
                  <tr
                    key={request.id}
                    style={{
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.03)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td
                      style={{
                        padding: "1rem",
                        color: "#FFFFFF",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                        borderBottom:
                          index === recentRequests.length - 1
                            ? "none"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {request.type}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.6)",
                        fontSize: "0.875rem",
                        fontWeight: "400",
                        borderBottom:
                          index === recentRequests.length - 1
                            ? "none"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      {request.date}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        borderBottom:
                          index === recentRequests.length - 1
                            ? "none"
                            : "1px solid rgba(255, 255, 255, 0.05)",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "0.375rem 0.75rem",
                          borderRadius: "6px",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          letterSpacing: "0.3px",
                          background:
                            request.status.toLowerCase() === "approved"
                              ? "rgba(16, 185, 129, 0.12)"
                              : request.status.toLowerCase() === "pending"
                              ? "rgba(234, 131, 3, 0.12)"
                              : "rgba(239, 68, 68, 0.12)",
                          color:
                            request.status.toLowerCase() === "approved"
                              ? "#10b981"
                              : request.status.toLowerCase() === "pending"
                              ? "#EA8303"
                              : "#ef4444",
                        }}
                      >
                        {request.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            style={{
              textAlign: "center",
              padding: "3rem 1rem",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(255, 255, 255, 0.05)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1.25rem",
              }}
            >
              <i
                className="fas fa-inbox"
                style={{
                  fontSize: "1.75rem",
                  color: "rgba(255, 255, 255, 0.2)",
                }}
              ></i>
            </div>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.4)",
                fontSize: "0.875rem",
                fontWeight: "500",
                margin: 0,
              }}
            >
              No recent requests
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal-animate-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                background:
                  "linear-gradient(to right, rgba(234, 131, 3, 0.1), transparent)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  Create New Request
                </h2>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  Submit a new request for approval
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  width: "2rem",
                  height: "2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Form */}
            <div style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto" }}>
              <form onSubmit={handleSubmitRequest} style={{ padding: "2rem" }}>
                {/* Request Type */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Request Type
                  </label>
                  <select
                    name="requestType"
                    value={formData.requestType}
                    onChange={handleFormChange}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      color: formData.requestType
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.4)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#EA8303";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(234, 131, 3, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    <option value="WFH">العمل من المنزل</option>
                    <option value="VACATION">إجازة</option>
                    <option value="LATE_PERMISSION">اذن تاخير</option>
                    <option value="EARLY_LEAVE">انصراف مبكر</option>
                  </select>
                </div>

                {/* Date Fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        colorScheme: "dark",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#EA8303";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(234, 131, 3, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        colorScheme: "dark",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#EA8303";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(234, 131, 3, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "0.75rem 1.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.12)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.25)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading
                        ? "rgba(255, 255, 255, 0.1)"
                        : "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#FFFFFF",
                      border: loading
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      padding: "0.75rem 1.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: loading
                        ? "none"
                        : "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
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
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Custom Request Modal for Admin */}
      {showCustomModal && (
        <div
          className="modal-animate-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.8)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
          }}
          onClick={handleCloseCustomModal}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background:
                  "linear-gradient(to right, rgba(234, 131, 3, 0.1), transparent)",
              }}
            >
              <div>
                <h2
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: "600",
                    color: "#FFFFFF",
                    margin: 0,
                    marginBottom: "0.25rem",
                  }}
                >
                  Create Custom Request
                </h2>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  Create a request for an employee
                </p>
              </div>
              <button
                onClick={handleCloseCustomModal}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  color: "rgba(255, 255, 255, 0.5)",
                  border: "none",
                  width: "2rem",
                  height: "2rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
                  e.currentTarget.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.color = "rgba(255, 255, 255, 0.5)";
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Modal Form */}
            <div style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto" }}>
              <form
                onSubmit={handleSubmitCustomRequest}
                style={{ padding: "2rem" }}
              >
                {/* Employee Selection */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Employee *
                  </label>
                  <select
                    name="employeeId"
                    value={customFormData.employeeId}
                    onChange={handleCustomFormChange}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#EA8303";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(234, 131, 3, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="" disabled>
                      Select employee
                    </option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.fullName} (
                        {emp.fingerprint ||
                          emp.fingerprintCode ||
                          emp.employeeCode}
                        )
                      </option>
                    ))}
                  </select>
                </div>

                {/* Request Type */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Request Type *
                  </label>
                  <select
                    name="requestType"
                    value={customFormData.requestType}
                    onChange={handleCustomFormChange}
                    required
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      borderRadius: "10px",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      outline: "none",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#EA8303";
                      e.target.style.boxShadow =
                        "0 0 0 3px rgba(234, 131, 3, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  >
                    <option value="" disabled>
                      Select type
                    </option>
                    <option value="WFH">العمل من المنزل</option>
                    <option value="VACATION">إجازة</option>
                    <option value="LATE_PERMISSION">اذن تاخير</option>
                    <option value="EARLY_LEAVE">انصراف مبكر</option>
                  </select>
                </div>

                {/* Date Fields */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Start Date
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={customFormData.startDate}
                      onChange={handleCustomFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#EA8303";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(234, 131, 3, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      End Date
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={customFormData.endDate}
                      onChange={handleCustomFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#EA8303";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(234, 131, 3, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor =
                          "rgba(255, 255, 255, 0.08)";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseCustomModal}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#FFFFFF",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      borderRadius: "12px",
                      padding: "0.75rem 1.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.12)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.25)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.06)";
                      e.currentTarget.style.borderColor =
                        "rgba(255, 255, 255, 0.15)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      background: loading
                        ? "rgba(255, 255, 255, 0.1)"
                        : "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "#FFFFFF",
                      border: loading
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      borderRadius: "12px",
                      padding: "0.75rem 1.5rem",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: loading
                        ? "none"
                        : "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
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
                    {loading ? "Submitting..." : "Submit Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
