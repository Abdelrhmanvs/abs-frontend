import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

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

  // Fetch WFH requests for current week
  useEffect(() => {
    const fetchWFHRequests = async () => {
      try {
        setWfhLoading(true);
        const response = await axiosPrivate.get("/requests/weekly-wfh");

        setWeekRange(response.data.weekRange);
        setWeekDays(response.data.weekDays);
        setWfhRequests(response.data.employees);
      } catch (error) {
        console.error("Error fetching WFH requests:", error);
        setWfhRequests([]);
      } finally {
        setWfhLoading(false);
      }
    };

    fetchWFHRequests();
  }, [axiosPrivate]);

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
      setWeekDays(wfhResponse.data.weekDays);
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
      setWeekDays(wfhResponse.data.weekDays);
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
        marginLeft: "235px",
        marginTop: "65px",
        minHeight: "calc(100vh - 65px)",
        background: "#1a1a1a",
        padding: "2rem",
      }}
    >
      {/* Header Section */}
      <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.875rem",
                fontWeight: "bold",
                color: "#ffffff",
                marginBottom: "0.5rem",
              }}
            >
              Employees Working From Home
            </h1>
            <p style={{ color: "#9ca3af", fontSize: "0.875rem" }}>
              Current week work from home employees
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              background: "#f97316",
              color: "#ffffff",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              fontSize: "0.875rem",
              fontWeight: "600",
              cursor: "pointer",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.background = "#ea580c")}
            onMouseLeave={(e) => (e.target.style.background = "#f97316")}
          >
            + Add WFH
          </button>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div
          style={{
            background: "rgba(34, 197, 94, 0.1)",
            border: "1px solid #22c55e",
            color: "#22c55e",
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            marginBottom: "1.5rem",
            fontSize: "0.875rem",
          }}
        >
          {success}
        </div>
      )}

      {/* WFH Requests Table */}
      <div
        style={{
          background: "#2d2d2d",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}
      >
        {wfhLoading ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}
          >
            Loading employees...
          </div>
        ) : wfhRequests.length === 0 ? (
          <div
            style={{ padding: "3rem", textAlign: "center", color: "#9ca3af" }}
          >
            No employees working from home this week
          </div>
        ) : (
          <>
            {/* Week Range Display */}
            <div
              style={{
                padding: "1rem",
                background: "#3a3a3a",
                borderBottom: "1px solid #4a4a4a",
              }}
            >
              <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: 0 }}>
                Week:{" "}
                {weekRange.start &&
                  new Date(weekRange.start).toLocaleDateString()}{" "}
                -{" "}
                {weekRange.end && new Date(weekRange.end).toLocaleDateString()}
              </p>
            </div>

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
                  <tr style={{ background: "#3a3a3a" }}>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        color: "#ffffff",
                        fontWeight: "600",
                        fontSize: "0.875rem",
                        position: "sticky",
                        left: 0,
                        background: "#3a3a3a",
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
                            color: isFriday ? "#ef4444" : "#ffffff",
                            fontWeight: "600",
                            fontSize: "0.875rem",
                            minWidth: "100px",
                            background: isFriday
                              ? "rgba(239, 68, 68, 0.1)"
                              : "transparent",
                          }}
                        >
                          <div>{day.dayShort}</div>
                          <div
                            style={{
                              fontSize: "0.75rem",
                              color: isFriday ? "#ef4444" : "#9ca3af",
                              fontWeight: "400",
                            }}
                          >
                            {new Date(day.date).getDate()}
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
                        borderTop: "1px solid #3a3a3a",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#3a3a3a")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                          position: "sticky",
                          left: 0,
                          background: "#2d2d2d",
                          fontWeight: "500",
                        }}
                        onMouseEnter={(e) => {
                          if (e.currentTarget.parentElement.matches(":hover")) {
                            e.currentTarget.style.background = "#3a3a3a";
                          }
                        }}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#2d2d2d")
                        }
                      >
                        <div>{employee.employeeName}</div>
                        {employee.employeeCode && (
                          <div
                            style={{ fontSize: "0.75rem", color: "#9ca3af" }}
                          >
                            {employee.employeeCode}
                          </div>
                        )}
                      </td>
                      {employee.weekSchedule.map((daySchedule) => {
                        const isFriday =
                          new Date(daySchedule.date).getDay() === 5;
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
                                  background: "#10b981",
                                  color: "#ffffff",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
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
                                  color: "#4a4a4a",
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
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.75)",
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
            style={{
              background: "#2d2d2d",
              borderRadius: "0.75rem",
              padding: "2rem",
              maxWidth: "800px",
              width: "100%",
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#ffffff",
                marginBottom: "0.5rem",
              }}
            >
              Add Work From Home
            </h2>
            <p
              style={{
                color: "#9ca3af",
                fontSize: "0.875rem",
                marginBottom: "1.5rem",
              }}
            >
              Submit a new work from home request
            </p>

            {/* Tabs */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "1.5rem",
                borderBottom: "1px solid #4a4a4a",
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
                  color: activeTab === "manual" ? "#f97316" : "#9ca3af",
                  border: "none",
                  borderBottom:
                    activeTab === "manual"
                      ? "2px solid #f97316"
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
                  color: activeTab === "random" ? "#f97316" : "#9ca3af",
                  border: "none",
                  borderBottom:
                    activeTab === "random"
                      ? "2px solid #f97316"
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
                  border: "1px solid #ef4444",
                  color: "#ef4444",
                  padding: "0.75rem 1rem",
                  borderRadius: "0.5rem",
                  marginBottom: "1.5rem",
                  fontSize: "0.875rem",
                }}
              >
                {error}
              </div>
            )}

            {/* Manual Tab Content */}
            {activeTab === "manual" && (
              <form onSubmit={handleSubmit}>
                {/* Employee Name */}
                <div style={{ marginBottom: "1.5rem" }} ref={dropdownRef}>
                  <label
                    htmlFor="employeeName"
                    style={{
                      display: "block",
                      color: "#ffffff",
                      fontSize: "0.875rem",
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
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.75rem 2.5rem 0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocus={(e) => {
                        setShowDropdown(true);
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
                      className="fas fa-search"
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
                            background: "#2d2d2d",
                            border: "1px solid #4a4a4a",
                            borderRadius: "0.5rem",
                            marginTop: "0.25rem",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000,
                            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
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
                                borderBottom: "1px solid #3a3a3a",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#3a3a3a";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "transparent";
                              }}
                            >
                              <div
                                style={{
                                  color: "#ffffff",
                                  fontSize: "0.875rem",
                                  fontWeight: "500",
                                }}
                              >
                                {emp.fullName}
                              </div>
                              <div
                                style={{
                                  color: "#9ca3af",
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
                          background: "#2d2d2d",
                          border: "1px solid #4a4a4a",
                          borderRadius: "0.5rem",
                          marginTop: "0.25rem",
                          padding: "1rem",
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: "0.875rem",
                          zIndex: 1000,
                        }}
                      >
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
                            background: "#2d2d2d",
                            border: "1px solid #4a4a4a",
                            borderRadius: "0.5rem",
                            marginTop: "0.25rem",
                            padding: "1rem",
                            textAlign: "center",
                            color: "#9ca3af",
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
                <div style={{ marginBottom: "1.5rem" }}>
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
                        color: "#ffffff",
                        fontSize: "0.875rem",
                        fontWeight: "500",
                      }}
                    >
                      Date Ranges * (Current Week Only)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddDateRange}
                      style={{
                        background: "#f97316",
                        color: "#ffffff",
                        padding: "0.5rem 1rem",
                        borderRadius: "0.375rem",
                        border: "none",
                        fontSize: "0.75rem",
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
                            background: "#3a3a3a",
                            color: "#ffffff",
                            border: "1px solid #4a4a4a",
                            borderRadius: "0.5rem",
                            padding: "0.75rem 2.5rem 0.75rem 1rem",
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
                            background: "#3a3a3a",
                            color: "#ffffff",
                            border: "1px solid #4a4a4a",
                            borderRadius: "0.5rem",
                            padding: "0.75rem 2.5rem 0.75rem 1rem",
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

                      {/* Remove Button */}
                      {dateRanges.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDateRange(index)}
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            padding: "0.75rem 1rem",
                            borderRadius: "0.5rem",
                            border: "none",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "background 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#ef4444";
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
                      background: "rgba(249, 115, 22, 0.1)",
                      border: "1px solid #f97316",
                      color: "#f97316",
                      padding: "0.75rem 1rem",
                      borderRadius: "0.5rem",
                      marginBottom: "1.5rem",
                      fontSize: "0.875rem",
                      textAlign: "center",
                    }}
                  >
                    Total Days: <strong>{calculateTotalDays()}</strong> day
                    {calculateTotalDays() !== 1 ? "s" : ""}
                  </div>
                )}

                {/* Reason (Optional) */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    htmlFor="reason"
                    style={{
                      display: "block",
                      color: "#ffffff",
                      fontSize: "0.875rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Purpose / الغرض من النموذج الإداري
                  </label>
                  <div style={{ position: "relative" }}>
                    <select
                      id="reason"
                      value={reason}
                      onChange={(e) => {
                        setReason(e.target.value);
                        if (e.target.value !== "Other") {
                          setCustomReason("");
                        }
                      }}
                      style={{
                        width: "100%",
                        background: "#3a3a3a",
                        color: "#ffffff",
                        border: "1px solid #4a4a4a",
                        borderRadius: "0.5rem",
                        padding: "0.75rem 2.5rem 0.75rem 1rem",
                        fontSize: "0.875rem",
                        outline: "none",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        appearance: "none",
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
                    >
                      <option value="">Select purpose...</option>
                      <option value="اجتماع">اجتماع (Meeting)</option>
                      <option value="تدريب">تدريب (Training)</option>
                      <option value="مهمة عمل">مهمة عمل (Work Task)</option>
                      <option value="ظروف شخصية">
                        ظروف شخصية (Personal Circumstances)
                      </option>
                      <option value="زيارة ميدانية">
                        زيارة ميدانية (Field Visit)
                      </option>
                      <option value="Other">Other (Custom)</option>
                    </select>
                    <i
                      className="fas fa-chevron-down"
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

                  {/* Custom Reason Input - Show when 'Other' is selected */}
                  {reason === "Other" && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <input
                        type="text"
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        placeholder="Enter custom purpose..."
                        style={{
                          width: "100%",
                          background: "#3a3a3a",
                          color: "#ffffff",
                          border: "1px solid #4a4a4a",
                          borderRadius: "0.5rem",
                          padding: "0.75rem 1rem",
                          fontSize: "0.875rem",
                          outline: "none",
                          transition: "all 0.2s",
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
                    </div>
                  )}
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
                    disabled={loading}
                    style={{
                      background: "#3a3a3a",
                      color: "#ffffff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #4a4a4a",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: loading ? "not-allowed" : "pointer",
                      opacity: loading ? 0.5 : 1,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.target.style.background = "#4a4a4a";
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.target.style.background = "#3a3a3a";
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
                      padding: "0.75rem 1.5rem",
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
            )}

            {/* Random Tab Content */}
            {activeTab === "random" && (
              <div>
                {/* Number of Days Input */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label
                    htmlFor="daysPerEmployee"
                    style={{
                      display: "block",
                      color: "#ffffff",
                      fontSize: "0.875rem",
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
                      background: "#3a3a3a",
                      color: "#ffffff",
                      border: "1px solid #4a4a4a",
                      borderRadius: "0.5rem",
                      padding: "0.75rem 1rem",
                      fontSize: "0.875rem",
                      outline: "none",
                    }}
                  />
                  <p
                    style={{
                      color: "#9ca3af",
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
                        color: "#ffffff",
                        fontSize: "0.875rem",
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
                        color: "#f97316",
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
                      background: "#3a3a3a",
                      border: "1px solid #4a4a4a",
                      borderRadius: "0.5rem",
                      padding: "0.5rem",
                    }}
                  >
                    {employeesLoading ? (
                      <div
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: "#9ca3af",
                        }}
                      >
                        Loading employees...
                      </div>
                    ) : employees.length === 0 ? (
                      <div
                        style={{
                          padding: "1rem",
                          textAlign: "center",
                          color: "#9ca3af",
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
                            borderRadius: "0.375rem",
                            transition: "background 0.2s",
                            background: selectedEmployees.includes(emp.id)
                              ? "#4a4a4a"
                              : "transparent",
                          }}
                          onMouseEnter={(e) => {
                            if (!selectedEmployees.includes(emp.id)) {
                              e.currentTarget.style.background = "#404040";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!selectedEmployees.includes(emp.id)) {
                              e.currentTarget.style.background = "transparent";
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
                              accentColor: "#f97316",
                            }}
                          />
                          <div>
                            <div
                              style={{
                                color: "#ffffff",
                                fontSize: "0.875rem",
                                fontWeight: "500",
                              }}
                            >
                              {emp.fullName}
                            </div>
                            <div
                              style={{ color: "#9ca3af", fontSize: "0.75rem" }}
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
                      color: "#9ca3af",
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
                      background: "#3a3a3a",
                      color: "#ffffff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "0.5rem",
                      border: "1px solid #4a4a4a",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor: randomLoading ? "not-allowed" : "pointer",
                      opacity: randomLoading ? 0.5 : 1,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!randomLoading) e.target.style.background = "#4a4a4a";
                    }}
                    onMouseLeave={(e) => {
                      if (!randomLoading) e.target.style.background = "#3a3a3a";
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
                          ? "#9ca3af"
                          : "#f97316",
                      color: "#ffffff",
                      padding: "0.75rem 1.5rem",
                      borderRadius: "0.5rem",
                      border: "none",
                      fontSize: "0.875rem",
                      fontWeight: "600",
                      cursor:
                        randomLoading || selectedEmployees.length === 0
                          ? "not-allowed"
                          : "pointer",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!randomLoading && selectedEmployees.length > 0)
                        e.target.style.background = "#ea580c";
                    }}
                    onMouseLeave={(e) => {
                      if (!randomLoading && selectedEmployees.length > 0)
                        e.target.style.background = "#f97316";
                    }}
                  >
                    {randomLoading ? "Generating..." : "Generate Random WFH"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddFromHome;
