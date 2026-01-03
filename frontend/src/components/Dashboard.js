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
        console.error("Error fetching recent requests:", error);
        // Keep empty array on error
      }
    };

    fetchRecentRequests();
  }, [axiosPrivate]);

  const [weekSchedule, setWeekSchedule] = useState([]);
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

  // Get current week days (Sunday to Saturday)
  const getCurrentWeek = () => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - dayOfWeek);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(sunday);
      day.setDate(sunday.getDate() + i);
      week.push({
        date: day.toISOString().split("T")[0],
        dayName: day.toLocaleDateString("en-US", { weekday: "short" }),
        dayNumber: day.getDate(),
        isToday: day.toDateString() === today.toDateString(),
      });
    }
    return week;
  };

  const currentWeek = getCurrentWeek();

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
        const today = new Date().toISOString().split("T")[0];
        const todayWFH = [];

        response.data.employees.forEach((employee) => {
          const todaySchedule = employee.weekSchedule.find(
            (day) => day.date === today && day.isWFH
          );
          if (todaySchedule) {
            todayWFH.push({
              name: employee.employeeName,
              code: employee.employeeCode,
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
    const schedule = weekSchedule.find((schedule) => schedule.date === date);
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
    }));
  };

  const handleCustomFormChange = (e) => {
    const { name, value } = e.target;
    setCustomFormData((prev) => ({
      ...prev,
      [name]: value,
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
    <div
      style={{
        marginLeft: "235px",
        marginTop: "65px",
        minHeight: "calc(100vh - 65px)",
        background: "#1a1a1a",
        padding: "2rem",
      }}
    >
      {/* Quick Actions Section */}
      <div
        style={{
          background: "#2d2d2d",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "1rem",
          }}
        >
          Quick Actions
        </h2>
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          {!auth?.roles?.includes("admin") && (
            <button
              onClick={handleNewRequest}
              style={{
                background: "#f97316",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#ea580c";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f97316";
              }}
            >
              <span style={{ fontSize: "1rem" }}>+</span>
              New Request
            </button>
          )}
          {auth?.roles?.includes("admin") && (
            <button
              onClick={handleCustomRequest}
              style={{
                background: "#f97316",
                color: "#ffffff",
                padding: "0.75rem 1.5rem",
                borderRadius: "0.5rem",
                border: "none",
                fontSize: "0.875rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => {
                e.target.style.background = "#ea580c";
              }}
              onMouseLeave={(e) => {
                e.target.style.background = "#f97316";
              }}
            >
              <span style={{ fontSize: "1rem" }}>+</span>
              Custom Request
            </button>
          )}
        </div>
      </div>

      {/* Current Week Schedule Section */}
      <div
        style={{
          background: "#2d2d2d",
          borderRadius: "0.75rem",
          padding: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "1.5rem",
          }}
        >
          My Schedule - Current Week
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: "0.75rem",
          }}
        >
          {currentWeek.map((day, index) => {
            const daySchedule = isWFHDay(day.date);
            const isFriday = day.dayName === "Fri";
            return (
              <div
                key={index}
                style={{
                  background: isFriday
                    ? "rgba(239, 68, 68, 0.1)"
                    : day.isToday
                    ? "#3a3a3a"
                    : daySchedule.hasRequest
                    ? "rgba(249, 115, 22, 0.1)"
                    : "#2d2d2d",
                  border: isFriday
                    ? "1px solid #ef4444"
                    : day.isToday
                    ? "2px solid #f97316"
                    : daySchedule.hasRequest
                    ? "1px solid #f97316"
                    : "1px solid #404040",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  textAlign: "center",
                  transition: "all 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "600",
                    color: isFriday ? "#ef4444" : "#9ca3af",
                    marginBottom: "0.5rem",
                    textTransform: "uppercase",
                  }}
                >
                  {day.dayName}
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: "700",
                    color: isFriday
                      ? "#ef4444"
                      : day.isToday
                      ? "#f97316"
                      : "#ffffff",
                    marginBottom: "0.5rem",
                  }}
                >
                  {day.dayNumber}
                </div>
                {isFriday ? (
                  <div
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: "600",
                      color: "#ef4444",
                      background: "rgba(239, 68, 68, 0.2)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <i
                      className="fas fa-calendar-times"
                      style={{ marginRight: "0.25rem" }}
                    ></i>
                    Holiday
                  </div>
                ) : daySchedule.hasRequest ? (
                  <div
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: "600",
                      color: "#f97316",
                      background: "rgba(249, 115, 22, 0.2)",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      marginTop: "0.5rem",
                    }}
                  >
                    <i
                      className="fas fa-home"
                      style={{ marginRight: "0.25rem" }}
                    ></i>
                    {daySchedule.type === "WFH" ? "Work From Home" : "Leave"}
                  </div>
                ) : (
                  <div
                    style={{
                      fontSize: "0.625rem",
                      fontWeight: "600",
                      color: "#6b7280",
                      marginTop: "0.5rem",
                    }}
                  >
                    Office
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Team WFH Today Section - Only for Team Leads and Admins */}
      {teamWFH.length > 0 && (
        <div
          style={{
            background: "#2d2d2d",
            borderRadius: "0.75rem",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#ffffff",
              marginBottom: "1.5rem",
            }}
          >
            Team Working From Home Today
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
              gap: "1rem",
            }}
          >
            {teamWFH.map((employee, index) => (
              <div
                key={index}
                style={{
                  background: "#3a3a3a",
                  border: "1px solid #4a4a4a",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#404040";
                  e.currentTarget.style.borderColor = "#f97316";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3a3a3a";
                  e.currentTarget.style.borderColor = "#4a4a4a";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background: "#f97316",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontWeight: "bold",
                      fontSize: "0.875rem",
                    }}
                  >
                    {employee.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        color: "#ffffff",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {employee.name}
                    </div>
                    <div
                      style={{
                        color: "#9ca3af",
                        fontSize: "0.75rem",
                      }}
                    >
                      {employee.code}
                    </div>
                  </div>
                  <div
                    style={{
                      background:
                        employee.type === "WFH"
                          ? "rgba(16, 185, 129, 0.2)"
                          : "rgba(59, 130, 246, 0.2)",
                      color: employee.type === "WFH" ? "#10b981" : "#3b82f6",
                      padding: "0.25rem 0.5rem",
                      borderRadius: "0.25rem",
                      fontSize: "0.75rem",
                      fontWeight: "600",
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
        style={{
          background: "#2d2d2d",
          borderRadius: "0.75rem",
          padding: "1.5rem",
        }}
      >
        <h2
          style={{
            fontSize: "1.25rem",
            fontWeight: "600",
            color: "#ffffff",
            marginBottom: "1.5rem",
          }}
        >
          Recent Requests
        </h2>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid #404040",
                }}
              >
                <th
                  style={{
                    textAlign: "left",
                    padding: "1rem",
                    color: "#9ca3af",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                >
                  Request Type
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "1rem",
                    color: "#9ca3af",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                >
                  Date
                </th>
                <th
                  style={{
                    textAlign: "left",
                    padding: "1rem",
                    color: "#9ca3af",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                >
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.map((request) => (
                <tr
                  key={request.id}
                  style={{
                    borderBottom: "1px solid #404040",
                  }}
                >
                  <td
                    style={{
                      padding: "1rem",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                    }}
                  >
                    {request.type}
                  </td>
                  <td
                    style={{
                      padding: "1rem",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                    }}
                  >
                    {request.date}
                  </td>
                  <td style={{ padding: "1rem" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.375rem 0.75rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        background: `${getStatusColor(request.status)}20`,
                        color: getStatusColor(request.status),
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
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={handleCloseModal}
        >
          <div
            style={{
              background: "#2d2d2d",
              borderRadius: "0.75rem",
              width: "90%",
              maxWidth: "600px",
              padding: "2rem",
              position: "relative",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "2rem",
                paddingBottom: "1rem",
                borderBottom: "1px solid #404040",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                Create New Request
              </h2>
              <button
                onClick={handleCloseModal}
                style={{
                  background: "#3a3a3a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  width: "2.5rem",
                  height: "2.5rem",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#4a4a4a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#3a3a3a";
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRequest}>
              {/* Request Type */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: "600",
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
                    background: "#3a3a3a",
                    color: formData.requestType ? "#ffffff" : "#6b7280",
                    border: "1px solid #4a4a4a",
                    borderRadius: "0.5rem",
                    padding: "0.875rem 1rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    cursor: "pointer",
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
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Start Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.875rem 2.5rem 0.875rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        colorScheme: "dark",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#f97316";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(249, 115, 22, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#4a4a4a";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <i
                      className="fas fa-calendar-alt"
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                        pointerEvents: "none",
                        fontSize: "0.875rem",
                      }}
                    ></i>
                  </div>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    End Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.875rem 2.5rem 0.875rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        colorScheme: "dark",
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = "#f97316";
                        e.target.style.boxShadow =
                          "0 0 0 3px rgba(249, 115, 22, 0.1)";
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "#4a4a4a";
                        e.target.style.boxShadow = "none";
                      }}
                    />
                    <i
                      className="fas fa-calendar-alt"
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                        pointerEvents: "none",
                        fontSize: "0.875rem",
                      }}
                    ></i>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  style={{
                    background: "#3a3a3a",
                    color: "#ffffff",
                    padding: "0.875rem 1.5rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#4a4a4a";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#3a3a3a";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "#9ca3af" : "#f97316",
                    color: "#ffffff",
                    padding: "0.875rem 1.5rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = "#ea580c";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.background = "#f97316";
                  }}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Request Modal for Admin */}
      {showCustomModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={handleCloseCustomModal}
        >
          <div
            style={{
              background: "#2d2d2d",
              borderRadius: "0.75rem",
              maxWidth: "500px",
              width: "90%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #404040",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  color: "#ffffff",
                  margin: 0,
                }}
              >
                Create Custom Request
              </h2>
              <button
                onClick={handleCloseCustomModal}
                style={{
                  background: "#3a3a3a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "0.5rem",
                  width: "2.5rem",
                  height: "2.5rem",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#4a4a4a";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#3a3a3a";
                }}
              >
                ×
              </button>
            </div>

            {/* Modal Form */}
            <form
              onSubmit={handleSubmitCustomRequest}
              style={{ padding: "1.5rem" }}
            >
              {/* Employee Selection */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: "600",
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
                    background: "#3a3a3a",
                    color: "#ffffff",
                    border: "1px solid #4a4a4a",
                    borderRadius: "0.5rem",
                    padding: "0.875rem 1rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="" disabled>
                    Select employee
                  </option>
                  {employees.map((emp) => (
                    <option key={emp._id} value={emp._id}>
                      {emp.fullName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Request Type */}
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "block",
                    color: "#ffffff",
                    fontSize: "0.875rem",
                    fontWeight: "600",
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
                    background: "#3a3a3a",
                    color: "#ffffff",
                    border: "1px solid #4a4a4a",
                    borderRadius: "0.5rem",
                    padding: "0.875rem 1rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    cursor: "pointer",
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
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Start Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      name="startDate"
                      value={customFormData.startDate}
                      onChange={handleCustomFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.875rem 2.5rem 0.875rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    />
                    <i
                      className="fas fa-calendar-alt"
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                        pointerEvents: "none",
                      }}
                    ></i>
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      marginBottom: "0.5rem",
                    }}
                  >
                    End Date
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="date"
                      name="endDate"
                      value={customFormData.endDate}
                      onChange={handleCustomFormChange}
                      required
                      style={{
                        width: "100%",
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.875rem 2.5rem 0.875rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        colorScheme: "dark",
                      }}
                    />
                    <i
                      className="fas fa-calendar-alt"
                      style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#9ca3af",
                        pointerEvents: "none",
                      }}
                    ></i>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "1rem",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseCustomModal}
                  style={{
                    background: "#3a3a3a",
                    color: "#ffffff",
                    padding: "0.875rem 1.5rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = "#4a4a4a";
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "#3a3a3a";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "#9ca3af" : "#f97316",
                    color: "#ffffff",
                    padding: "0.875rem 1.5rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) e.target.style.background = "#ea580c";
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) e.target.style.background = "#f97316";
                  }}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
