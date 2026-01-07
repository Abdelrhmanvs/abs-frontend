import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

// Egypt week helper: sort days from Saturday → Friday (LOCAL date, no timezone shift)
const sortEgyptWeekDays = (weekDays) => {
  return [...weekDays].sort((a, b) => {
    const getDayIndex = (d) => {
      // Parse YYYY-MM-DD as LOCAL date
      const [y, m, dayNum] = d.date.split("-").map(Number);
      const localDate = new Date(y, m - 1, dayNum);

      // JS: 0 = Sunday ... 6 = Saturday
      const jsDay = localDate.getDay();

      // Egypt week mapping
      return jsDay === 6 ? 0 : jsDay + 1;
    };
    return getDayIndex(a) - getDayIndex(b);
  });
};

const AddFromHome = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [employeeName, setEmployeeName] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [dateRanges, setDateRanges] = useState([
    { startDate: "", endDate: "" },
  ]);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [wfhRequests, setWfhRequests] = useState([]);
  const [wfhLoading, setWfhLoading] = useState(true);
  const [weekRange, setWeekRange] = useState({ start: "", end: "" });
  const [weekDays, setWeekDays] = useState([]);
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, 1 = next week
  const dropdownRef = useRef(null);

  // Random tab state
  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "random"
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [daysPerEmployee, setDaysPerEmployee] = useState(1);
  const [randomPreview, setRandomPreview] = useState([]);
  const [randomLoading, setRandomLoading] = useState(false);

  // Fetch employees list
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true);
        const response = await axiosPrivate.get("/users/employees");
        // Map the response to ensure correct structure
        const employeeList = response.data.map((user) => ({
          id: user._id,
          fullName: user.fullName || user.username,
          employeeCode: user.employeeCode || "N/A",
        }));
        setEmployees(employeeList);
      } catch (error) {
        console.error("Error fetching employees:", error);
        // Don't set form error, just keep employees empty
        setEmployees([]);
      } finally {
        setEmployeesLoading(false);
      }
    };

    fetchEmployees();
  }, [axiosPrivate]);

  // Fetch WFH requests for current week or offset
  useEffect(() => {
    const fetchWFHRequests = async () => {
      try {
        setWfhLoading(true);
        const response = await axiosPrivate.get(
          `/requests/weekly-wfh?offset=${weekOffset}`
        );

        console.log("BACKEND weekDays:", response.data.weekDays);
        console.log("BACKEND weekRange:", response.data.weekRange);

        setWeekRange(response.data.weekRange);
        setWeekDays(sortEgyptWeekDays(response.data.weekDays));
        setWfhRequests(response.data.employees);
      } catch (error) {
        console.error("Error fetching WFH requests:", error);
        setWfhRequests([]);
      } finally {
        setWfhLoading(false);
      }
    };

    fetchWFHRequests();
  }, [axiosPrivate, weekOffset]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter employees based on search query
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDateRangeChange = (index, field, value) => {
    const newDateRanges = [...dateRanges];
    newDateRanges[index][field] = value;

    // Auto-set end date to match start date when start date is selected
    if (field === "startDate" && value) {
      newDateRanges[index].endDate = value;
    }

    setDateRanges(newDateRanges);
    setError("");
  };

  const handleAddDateRange = () => {
    setDateRanges([...dateRanges, { startDate: "", endDate: "" }]);
  };

  const handleRemoveDateRange = (index) => {
    if (dateRanges.length > 1) {
      const newDateRanges = dateRanges.filter((_, i) => i !== index);
      setDateRanges(newDateRanges);
    }
  };

  const calculateTotalDays = () => {
    let totalDays = 0;
    dateRanges.forEach((range) => {
      if (range.startDate && range.endDate) {
        const start = new Date(range.startDate);
        const end = new Date(range.endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        totalDays += diffDays;
      }
    });
    return totalDays;
  };

  const validateForm = () => {
    if (!employeeName || !employeeName.trim()) {
      setError("Employee name is required");
      return false;
    }

    const validRanges = dateRanges.filter(
      (range) => range.startDate && range.endDate
    );

    if (validRanges.length === 0) {
      setError("At least one complete date range is required");
      return false;
    }

    // Check if any end date is before start date
    for (const range of validRanges) {
      if (new Date(range.endDate) < new Date(range.startDate)) {
        setError("End date must be after or equal to start date");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const validRanges = dateRanges.filter(
        (range) => range.startDate && range.endDate
      );

      // Get overall start and end dates
      const allStartDates = validRanges.map((r) => new Date(r.startDate));
      const allEndDates = validRanges.map((r) => new Date(r.endDate));
      const overallStartDate = new Date(Math.min(...allStartDates))
        .toISOString()
        .split("T")[0];
      const overallEndDate = new Date(Math.max(...allEndDates))
        .toISOString()
        .split("T")[0];

      const finalReason = reason === "Other" ? customReason : reason;

      const requestData = {
        employeeId: selectedEmployeeId,
        employeeName: employeeName,
        type: "WFH",
        startDate: overallStartDate,
        endDate: overallEndDate,
        numberOfDays: calculateTotalDays(),
        notes: finalReason || "Work From Home",
        source: "ADMIN_DIRECT", // Mark as admin-added, not employee request
      };

      const response = await axiosPrivate.post("/requests", requestData);

      setSuccess("Work From Home request submitted successfully!");
      setShowModal(false);

      // Refresh WFH weekly schedule
      const wfhResponse = await axiosPrivate.get("/requests/weekly-wfh");
      setWeekRange(wfhResponse.data.weekRange);
      setWeekDays(sortEgyptWeekDays(wfhResponse.data.weekDays));
      setWfhRequests(wfhResponse.data.employees);

      // Reset form
      setEmployeeName("");
      setSelectedEmployeeId("");
      setSearchQuery("");
      setDateRanges([{ startDate: "", endDate: "" }]);
      setReason("");
      setCustomReason("");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error submitting request:", err);
      setError(
        err.response?.data?.message ||
          "Failed to submit request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEmployeeName("");
    setSelectedEmployeeId("");
    setSearchQuery("");
    setDateRanges([{ startDate: "", endDate: "" }]);
    setReason("");
    setCustomReason("");
    setError("");
    setActiveTab("manual");
    setSelectedEmployees([]);
    setDaysPerEmployee(1);
    setRandomPreview([]);
  };

  // Random tab handlers
  const handleSelectEmployee = (employeeId) => {
    setSelectedEmployees((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSelectAllEmployees = () => {
    if (selectedEmployees.length === employees.length) {
      setSelectedEmployees([]);
    } else {
      setSelectedEmployees(employees.map((emp) => emp.id));
    }
  };

  const handleGenerateRandomWFH = async () => {
    if (selectedEmployees.length === 0) {
      setError("Please select at least one employee");
      return;
    }

    if (daysPerEmployee < 1 || daysPerEmployee > 7) {
      setError("Days per employee must be between 1 and 7");
      return;
    }

    setRandomLoading(true);
    setError("");

    try {
      const response = await axiosPrivate.post("/requests/random-wfh", {
        selectedEmployeeIds: selectedEmployees,
        numberOfDaysPerEmployee: daysPerEmployee,
      });

      setSuccess(
        `Successfully assigned ${response.data.totalCreated} WFH days for ${selectedEmployees.length} employees`
      );
      setShowModal(false);

      // Refresh WFH weekly schedule
      const wfhResponse = await axiosPrivate.get("/requests/weekly-wfh");
      setWeekRange(wfhResponse.data.weekRange);
      setWeekDays(sortEgyptWeekDays(wfhResponse.data.weekDays));
      setWfhRequests(wfhResponse.data.employees);

      // Reset random tab
      setSelectedEmployees([]);
      setDaysPerEmployee(1);
      setRandomPreview([]);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error generating random WFH:", err);
      setError(
        err.response?.data?.message ||
          "Failed to generate random WFH. Please try again."
      );
    } finally {
      setRandomLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#2D2D31",
        padding: "2rem",
      }}
    >
      {/* Success Message */}
      {success && (
        <div
          className="animate-slideDown"
          style={{
            background: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            color: "#10b981",
            padding: "1rem 1.25rem",
            borderRadius: "12px",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}
        >
          <i className="fas fa-check-circle"></i>
          {success}
        </div>
      )}

      {/* WFH Requests Table */}
      <div
        className="animate-fadeInUp hover-lift"
        style={{
          background: "#1E1E1E",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Table Header with Title and Add Button */}
        <div
          style={{
            padding: "1.5rem",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "#FFFFFF",
                marginBottom: "0.25rem",
                letterSpacing: "-0.025em",
              }}
            >
              Employees Working From Home
            </h1>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "0.8125rem",
                margin: 0,
              }}
            >
              Current week work from home employees
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background:
                "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
              backdropFilter: "blur(10px)",
              WebkitBackdropFilter: "blur(10px)",
              color: "#FFFFFF",
              padding: "0.75rem 1.5rem",
              borderRadius: "12px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
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
            <i className="fas fa-plus"></i>
            Add WFH
          </button>
        </div>

        {/* Week Range Display with Previous/Next Week buttons */}
        <div
          style={{
            padding: "1rem 1.5rem",
            background: "rgba(255, 255, 255, 0.02)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.8125rem",
              margin: 0,
            }}
          >
            {wfhRequests.length} employee
            {wfhRequests.length !== 1 ? "s" : ""} with WFH
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "0.8125rem",
            }}
          >
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* Previous Week */}
              <button
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset((prev) => Math.max(prev - 1, 0))}
                style={{
                  background:
                    weekOffset === 0
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: weekOffset === 0 ? "rgba(255,255,255,0.3)" : "#fff",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "8px",
                  cursor: weekOffset === 0 ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
              >
                ← Previous
              </button>

              {/* Current Week */}
              <button
                disabled={weekOffset === 0}
                onClick={() => setWeekOffset(0)}
                style={{
                  background:
                    weekOffset === 0
                      ? "rgba(234,131,3,0.25)"
                      : "rgba(234,131,3,0.15)",
                  border: "1px solid rgba(234,131,3,0.45)",
                  color: weekOffset === 0 ? "#EA8303" : "#EA8303",
                  padding: "0.35rem 0.9rem",
                  borderRadius: "8px",
                  cursor: weekOffset === 0 ? "default" : "pointer",
                  fontWeight: "700",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (weekOffset !== 0) {
                    e.currentTarget.style.background = "rgba(234,131,3,0.3)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (weekOffset !== 0) {
                    e.currentTarget.style.background = "rgba(234,131,3,0.15)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }
                }}
              >
                Current Week
              </button>

              {/* Next Week */}
              <button
                onClick={() => setWeekOffset((prev) => prev + 1)}
                style={{
                  background: "rgba(234,131,3,0.15)",
                  border: "1px solid rgba(234,131,3,0.4)",
                  color: "#EA8303",
                  padding: "0.35rem 0.8rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(234,131,3,0.3)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(234,131,3,0.15)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                Next →
              </button>
            </div>
            <span style={{ marginLeft: "0.5rem" }}>
              {weekRange.start &&
                new Date(weekRange.start).toLocaleDateString()}{" "}
              - {weekRange.end && new Date(weekRange.end).toLocaleDateString()}
            </span>
          </div>
        </div>

        {wfhLoading ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <i
              className="fas fa-spinner fa-spin"
              style={{ marginRight: "0.5rem" }}
            ></i>
            Loading employees...
          </div>
        ) : wfhRequests.length === 0 ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <i
              className="fas fa-home"
              style={{
                fontSize: "2rem",
                marginBottom: "1rem",
                display: "block",
                opacity: 0.3,
              }}
            ></i>
            No employees working from home this week
          </div>
        ) : (
          <>
            {/* Weekly Schedule Grid */}
            <div style={{ overflowX: "auto" }}>
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: "800px",
                }}
              >
                <thead>
                  <tr style={{ background: "rgba(255, 255, 255, 0.02)" }}>
                    <th
                      style={{
                        padding: "1rem 1.5rem",
                        textAlign: "left",
                        color: "rgba(255, 255, 255, 0.5)",
                        fontWeight: "600",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        position: "sticky",
                        left: 0,
                        background: "#1E1E1E",
                        minWidth: "200px",
                        zIndex: 1,
                      }}
                    >
                      Employee
                    </th>
                    {weekDays.map((day) => {
                      const isFriday = day.dayShort === "Fri";
                      return (
                        <th
                          key={day.date}
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            color: isFriday
                              ? "#ef4444"
                              : "rgba(255, 255, 255, 0.5)",
                            fontWeight: "600",
                            fontSize: "0.75rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.05em",
                            minWidth: "100px",
                            background: isFriday
                              ? "rgba(239, 68, 68, 0.1)"
                              : "transparent",
                          }}
                        >
                          <div>{day.dayShort}</div>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              color: isFriday
                                ? "#ef4444"
                                : "rgba(255, 255, 255, 0.7)",
                              fontWeight: "500",
                              marginTop: "0.25rem",
                            }}
                          >
                            {(() => {
                              const [y, m, d] = day.date.split("-").map(Number);
                              return new Date(y, m - 1, d).getDate();
                            })()}
                          </div>
                          {isFriday && (
                            <div
                              style={{
                                fontSize: "0.625rem",
                                color: "#ef4444",
                                fontWeight: "600",
                                marginTop: "0.25rem",
                              }}
                            >
                              Holiday
                            </div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {wfhRequests.map((employee, index) => (
                    <tr
                      key={index}
                      style={{
                        borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "rgba(255, 255, 255, 0.02)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "1rem 1.5rem",
                          color: "#FFFFFF",
                          fontSize: "0.875rem",
                          position: "sticky",
                          left: 0,
                          background: "#1E1E1E",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => {
                          if (e.currentTarget.parentElement.matches(":hover")) {
                            e.currentTarget.style.background = "#252528";
                          }
                        }}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#1E1E1E")
                        }
                      >
                        <div>{employee.employeeName}</div>
                        {employee.fingerprint && (
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: "rgba(255, 255, 255, 0.5)",
                            }}
                          >
                            {employee.fingerprint}
                          </div>
                        )}
                      </td>
                      {employee.weekSchedule.map((daySchedule) => {
                        const [y, m, d] = daySchedule.date
                          .split("-")
                          .map(Number);
                        const isFriday = new Date(y, m - 1, d).getDay() === 5;
                        return (
                          <td
                            key={daySchedule.date}
                            style={{
                              padding: "1rem",
                              textAlign: "center",
                              fontSize: "0.875rem",
                              background: isFriday
                                ? "rgba(239, 68, 68, 0.05)"
                                : "transparent",
                            }}
                          >
                            {isFriday ? (
                              <div
                                style={{
                                  color: "#ef4444",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                }}
                              >
                                Holiday
                              </div>
                            ) : daySchedule.isWFH ? (
                              <div
                                style={{
                                  background: "rgba(16, 185, 129, 0.15)",
                                  color: "#10b981",
                                  padding: "0.375rem 0.75rem",
                                  borderRadius: "6px",
                                  fontSize: "0.75rem",
                                  fontWeight: "600",
                                  display: "inline-block",
                                }}
                                title={daySchedule.purpose || "Work From Home"}
                              >
                                {daySchedule.type === "WFH"
                                  ? "العمل من المنزل"
                                  : "إجازة"}
                              </div>
                            ) : (
                              <div
                                style={{
                                  color: "rgba(255, 255, 255, 0.2)",
                                  fontSize: "1.25rem",
                                }}
                              >
                                -
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal for Add WFH Form */}
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
            padding: "2rem",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowModal(false);
          }}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              padding: "0",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.06)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.5rem 2rem",
                borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                background:
                  "linear-gradient(to right, rgba(234, 131, 3, 0.1), transparent)",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  color: "#FFFFFF",
                  marginBottom: "0.25rem",
                }}
              >
                Add Work From Home
              </h2>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.875rem",
                  margin: 0,
                }}
              >
                Submit a new work from home request
              </p>
            </div>

            {/* Modal Body */}
            <div
              style={{
                padding: "2rem",
                maxHeight: "calc(90vh - 100px)",
                overflowY: "auto",
              }}
            >
              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  marginBottom: "1.5rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("manual");
                    setError("");
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color:
                      activeTab === "manual"
                        ? "#EA8303"
                        : "rgba(255, 255, 255, 0.5)",
                    border: "none",
                    borderBottom:
                      activeTab === "manual"
                        ? "2px solid #EA8303"
                        : "2px solid transparent",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("random");
                    setError("");
                  }}
                  style={{
                    padding: "0.75rem 1.5rem",
                    background: "transparent",
                    color:
                      activeTab === "random"
                        ? "#EA8303"
                        : "rgba(255, 255, 255, 0.5)",
                    border: "none",
                    borderBottom:
                      activeTab === "random"
                        ? "2px solid #EA8303"
                        : "2px solid transparent",
                    fontSize: "0.875rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  Random
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    marginBottom: "1.5rem",
                    fontSize: "0.875rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <i className="fas fa-exclamation-circle"></i>
                  {error}
                </div>
              )}

              {/* Manual Tab Content */}
              {activeTab === "manual" && (
                <form onSubmit={handleSubmit}>
                  {/* Employee Name */}
                  <div style={{ marginBottom: "1.25rem" }} ref={dropdownRef}>
                    <label
                      htmlFor="employeeName"
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Employee Name *
                    </label>
                    <div style={{ position: "relative" }}>
                      <input
                        type="text"
                        id="employeeName"
                        value={searchQuery || employeeName}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setEmployeeName("");
                          setShowDropdown(true);
                          setError("");
                        }}
                        placeholder="Search employee name or code..."
                        style={{
                          width: "100%",
                          background: "rgba(255, 255, 255, 0.04)",
                          color: "#FFFFFF",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          borderRadius: "10px",
                          padding: "0.75rem 2.5rem 0.75rem 1rem",
                          fontSize: "0.875rem",
                          outline: "none",
                          transition: "all 0.2s",
                        }}
                        onFocus={(e) => {
                          setShowDropdown(true);
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
                      <i
                        className="fas fa-search"
                        style={{
                          position: "absolute",
                          right: "1rem",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "rgba(255, 255, 255, 0.4)",
                          pointerEvents: "none",
                          fontSize: "0.875rem",
                        }}
                      ></i>

                      {/* Dropdown */}
                      {showDropdown &&
                        !employeesLoading &&
                        filteredEmployees.length > 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: "#1E1E1E",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "10px",
                              marginTop: "0.25rem",
                              maxHeight: "200px",
                              overflowY: "auto",
                              zIndex: 1000,
                              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
                            }}
                          >
                            {filteredEmployees.map((emp) => (
                              <div
                                key={emp.id}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  setEmployeeName(emp.fullName);
                                  setSelectedEmployeeId(emp.id);
                                  setSearchQuery("");
                                  setShowDropdown(false);
                                  setError("");
                                }}
                                style={{
                                  padding: "0.75rem 1rem",
                                  cursor: "pointer",
                                  borderBottom:
                                    "1px solid rgba(255, 255, 255, 0.06)",
                                  transition: "background 0.2s",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background =
                                    "rgba(255, 255, 255, 0.04)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background =
                                    "transparent";
                                }}
                              >
                                <div
                                  style={{
                                    color: "#FFFFFF",
                                    fontSize: "0.875rem",
                                    fontWeight: "500",
                                  }}
                                >
                                  {emp.fullName}
                                </div>
                                <div
                                  style={{
                                    color: "rgba(255, 255, 255, 0.5)",
                                    fontSize: "0.75rem",
                                    marginTop: "0.125rem",
                                  }}
                                >
                                  {emp.employeeCode}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                      {/* Loading state */}
                      {showDropdown && employeesLoading && (
                        <div
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            background: "#1E1E1E",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "10px",
                            marginTop: "0.25rem",
                            padding: "1rem",
                            textAlign: "center",
                            color: "rgba(255, 255, 255, 0.5)",
                            fontSize: "0.875rem",
                            zIndex: 1000,
                          }}
                        >
                          <i
                            className="fas fa-spinner fa-spin"
                            style={{ marginRight: "0.5rem" }}
                          ></i>
                          Loading employees...
                        </div>
                      )}

                      {/* No results message */}
                      {showDropdown &&
                        !employeesLoading &&
                        searchQuery &&
                        filteredEmployees.length === 0 && (
                          <div
                            style={{
                              position: "absolute",
                              top: "100%",
                              left: 0,
                              right: 0,
                              background: "#1E1E1E",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "10px",
                              marginTop: "0.25rem",
                              padding: "1rem",
                              textAlign: "center",
                              color: "rgba(255, 255, 255, 0.5)",
                              fontSize: "0.875rem",
                              zIndex: 1000,
                            }}
                          >
                            {employees.length === 0
                              ? "No employees available"
                              : "No employees found"}
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Date Ranges Section */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.5rem",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: "0.8125rem",
                          fontWeight: "500",
                        }}
                      >
                        Date Ranges * (Current Week Only)
                      </label>
                      <button
                        type="button"
                        onClick={handleAddDateRange}
                        style={{
                          background: "rgba(234, 131, 3, 0.15)",
                          color: "#EA8303",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = "rgba(234, 131, 3, 0.25)";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = "rgba(234, 131, 3, 0.15)";
                        }}
                      >
                        <i className="fas fa-plus"></i>
                        Add another day
                      </button>
                    </div>

                    {/* Date Range Inputs */}
                    {dateRanges.map((range, index) => (
                      <div
                        key={index}
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          marginBottom: "0.75rem",
                          alignItems: "center",
                        }}
                      >
                        {/* Start Date */}
                        <div style={{ position: "relative", flex: 1 }}>
                          <input
                            type="date"
                            value={range.startDate}
                            onChange={(e) =>
                              handleDateRangeChange(
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            min={weekRange.start}
                            max={weekRange.end}
                            placeholder="Start Date"
                            style={{
                              width: "100%",
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "#FFFFFF",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "10px",
                              padding: "0.75rem 2.5rem 0.75rem 1rem",
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
                          <i
                            className="fas fa-calendar-alt"
                            style={{
                              position: "absolute",
                              right: "1rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "rgba(255, 255, 255, 0.4)",
                              pointerEvents: "none",
                              fontSize: "0.875rem",
                            }}
                          ></i>
                        </div>

                        {/* End Date */}
                        <div style={{ position: "relative", flex: 1 }}>
                          <input
                            type="date"
                            value={range.endDate}
                            onChange={(e) =>
                              handleDateRangeChange(
                                index,
                                "endDate",
                                e.target.value
                              )
                            }
                            min={range.startDate || weekRange.start}
                            max={weekRange.end}
                            placeholder="End Date"
                            style={{
                              width: "100%",
                              background: "rgba(255, 255, 255, 0.04)",
                              color: "#FFFFFF",
                              border: "1px solid rgba(255, 255, 255, 0.08)",
                              borderRadius: "10px",
                              padding: "0.75rem 2.5rem 0.75rem 1rem",
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
                          <i
                            className="fas fa-calendar-alt"
                            style={{
                              position: "absolute",
                              right: "1rem",
                              top: "50%",
                              transform: "translateY(-50%)",
                              color: "rgba(255, 255, 255, 0.4)",
                              pointerEvents: "none",
                              fontSize: "0.875rem",
                            }}
                          ></i>
                        </div>

                        {/* Remove Button */}
                        {dateRanges.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDateRange(index)}
                            style={{
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#ef4444",
                              padding: "0.75rem 1rem",
                              borderRadius: "10px",
                              border: "none",
                              fontSize: "0.875rem",
                              cursor: "pointer",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.background =
                                "rgba(239, 68, 68, 0.25)";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.background =
                                "rgba(239, 68, 68, 0.15)";
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Number of Days Display */}
                  {calculateTotalDays() > 0 && (
                    <div
                      style={{
                        background: "rgba(234, 131, 3, 0.1)",
                        border: "1px solid rgba(234, 131, 3, 0.3)",
                        color: "#EA8303",
                        padding: "1rem 1.25rem",
                        borderRadius: "12px",
                        marginBottom: "1.5rem",
                        fontSize: "0.875rem",
                        textAlign: "center",
                      }}
                    >
                      <i
                        className="fas fa-calendar-check"
                        style={{ marginRight: "0.5rem" }}
                      ></i>
                      Total Days: <strong>{calculateTotalDays()}</strong> day
                      {calculateTotalDays() !== 1 ? "s" : ""}
                    </div>
                  )}

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
                      onClick={handleCancel}
                      disabled={loading}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#FFFFFF",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: loading ? "not-allowed" : "pointer",
                        opacity: loading ? 0.5 : 1,
                        transition: "all 0.3s ease",
                        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.12)";
                          e.currentTarget.style.borderColor =
                            "rgba(255, 255, 255, 0.25)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.06)";
                          e.currentTarget.style.borderColor =
                            "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
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
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        border: loading
                          ? "none"
                          : "1px solid rgba(255, 255, 255, 0.2)",
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
              )}

              {/* Random Tab Content */}
              {activeTab === "random" && (
                <div>
                  {/* Number of Days Input */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <label
                      htmlFor="daysPerEmployee"
                      style={{
                        display: "block",
                        color: "rgba(255, 255, 255, 0.7)",
                        fontSize: "0.8125rem",
                        fontWeight: "500",
                        marginBottom: "0.5rem",
                      }}
                    >
                      Number of WFH days per employee (1-7)
                    </label>
                    <input
                      type="number"
                      id="daysPerEmployee"
                      min="1"
                      max="7"
                      value={daysPerEmployee}
                      onChange={(e) =>
                        setDaysPerEmployee(parseInt(e.target.value))
                      }
                      style={{
                        width: "100%",
                        background: "rgba(255, 255, 255, 0.04)",
                        color: "#FFFFFF",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
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
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.75rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      This number will be applied to all selected employees
                    </p>
                  </div>

                  {/* Employee Selection */}
                  <div style={{ marginBottom: "1.5rem" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "0.75rem",
                      }}
                    >
                      <label
                        style={{
                          display: "block",
                          color: "rgba(255, 255, 255, 0.7)",
                          fontSize: "0.8125rem",
                          fontWeight: "500",
                        }}
                      >
                        Select Employees
                      </label>
                      <button
                        type="button"
                        onClick={handleSelectAllEmployees}
                        style={{
                          background: "transparent",
                          color: "#EA8303",
                          border: "none",
                          fontSize: "0.75rem",
                          fontWeight: "600",
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        {selectedEmployees.length === employees.length
                          ? "Deselect All"
                          : "Select All"}
                      </button>
                    </div>

                    <div
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        background: "rgba(255, 255, 255, 0.02)",
                        border: "1px solid rgba(255, 255, 255, 0.08)",
                        borderRadius: "10px",
                        padding: "0.5rem",
                      }}
                    >
                      {employeesLoading ? (
                        <div
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            color: "rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          <i
                            className="fas fa-spinner fa-spin"
                            style={{ marginRight: "0.5rem" }}
                          ></i>
                          Loading employees...
                        </div>
                      ) : employees.length === 0 ? (
                        <div
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            color: "rgba(255, 255, 255, 0.5)",
                          }}
                        >
                          No employees available
                        </div>
                      ) : (
                        employees.map((emp) => (
                          <div
                            key={emp.id}
                            onClick={() => handleSelectEmployee(emp.id)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "0.75rem",
                              cursor: "pointer",
                              borderRadius: "8px",
                              transition: "background 0.2s",
                              background: selectedEmployees.includes(emp.id)
                                ? "rgba(234, 131, 3, 0.15)"
                                : "transparent",
                            }}
                            onMouseEnter={(e) => {
                              if (!selectedEmployees.includes(emp.id)) {
                                e.currentTarget.style.background =
                                  "rgba(255, 255, 255, 0.04)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!selectedEmployees.includes(emp.id)) {
                                e.currentTarget.style.background =
                                  "transparent";
                              }
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedEmployees.includes(emp.id)}
                              onChange={() => {}}
                              style={{
                                marginRight: "0.75rem",
                                cursor: "pointer",
                                accentColor: "#EA8303",
                              }}
                            />
                            <div>
                              <div
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: "0.875rem",
                                  fontWeight: "500",
                                }}
                              >
                                {emp.fullName}
                              </div>
                              <div
                                style={{
                                  color: "rgba(255, 255, 255, 0.5)",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {emp.employeeCode}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <p
                      style={{
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.75rem",
                        marginTop: "0.5rem",
                      }}
                    >
                      {selectedEmployees.length} employee
                      {selectedEmployees.length !== 1 ? "s" : ""} selected
                    </p>
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
                      onClick={handleCancel}
                      disabled={randomLoading}
                      style={{
                        background: "rgba(255, 255, 255, 0.06)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#FFFFFF",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor: randomLoading ? "not-allowed" : "pointer",
                        opacity: randomLoading ? 0.5 : 1,
                        transition: "all 0.3s ease",
                        boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!randomLoading) {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.12)";
                          e.currentTarget.style.borderColor =
                            "rgba(255, 255, 255, 0.25)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!randomLoading) {
                          e.currentTarget.style.background =
                            "rgba(255, 255, 255, 0.06)";
                          e.currentTarget.style.borderColor =
                            "rgba(255, 255, 255, 0.15)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerateRandomWFH}
                      disabled={randomLoading || selectedEmployees.length === 0}
                      style={{
                        background:
                          randomLoading || selectedEmployees.length === 0
                            ? "rgba(255, 255, 255, 0.1)"
                            : "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                        backdropFilter: "blur(10px)",
                        WebkitBackdropFilter: "blur(10px)",
                        color: "#FFFFFF",
                        padding: "0.75rem 1.5rem",
                        borderRadius: "12px",
                        border:
                          randomLoading || selectedEmployees.length === 0
                            ? "none"
                            : "1px solid rgba(255, 255, 255, 0.2)",
                        fontSize: "0.875rem",
                        fontWeight: "600",
                        cursor:
                          randomLoading || selectedEmployees.length === 0
                            ? "not-allowed"
                            : "pointer",
                        transition: "all 0.3s ease",
                        boxShadow:
                          randomLoading || selectedEmployees.length === 0
                            ? "none"
                            : "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)",
                      }}
                      onMouseEnter={(e) => {
                        if (!randomLoading && selectedEmployees.length > 0) {
                          e.currentTarget.style.background =
                            "linear-gradient(135deg, rgba(234, 131, 3, 1) 0%, rgba(234, 131, 3, 0.85) 100%)";
                          e.currentTarget.style.boxShadow =
                            "0 6px 20px rgba(234, 131, 3, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!randomLoading && selectedEmployees.length > 0) {
                          e.currentTarget.style.background =
                            "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 15px rgba(234, 131, 3, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)";
                          e.currentTarget.style.transform = "translateY(0)";
                        }
                      }}
                    >
                      {randomLoading ? "Generating..." : "Generate Random WFH"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFromHome;
