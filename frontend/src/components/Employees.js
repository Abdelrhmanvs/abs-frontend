import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const AddEmployee = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    fullNameArabic: "",
    email: "",
    phoneNumber: "",
    employeeCode: "",
    fingerprint: "",
    branch: "المركز الرئيسي",
    title: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const branches = ["Main Branch"];

  // Fetch employees list
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setEmployeesLoading(true);
      const response = await axiosPrivate.get("/users/employees");
      setEmployees(response.data);
    } catch (error) {
      console.error("Error fetching employees:", error);
      setEmployees([]);
    } finally {
      setEmployeesLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError("Full Name is required");
      return false;
    }
    if (!formData.fullNameArabic.trim()) {
      setError("Full Name (Arabic) is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Invalid email format");
      return false;
    }
    if (!formData.phoneNumber.trim()) {
      setError("Phone Number is required");
      return false;
    }
    if (!formData.employeeCode.trim()) {
      setError("Employee Code is required");
      return false;
    }
    if (!formData.fingerprint.trim()) {
      setError("Fingerprint Code is required");
      return false;
    }
    if (!formData.title.trim()) {
      setError("Title is required");
      return false;
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
      // Transform frontend data to match backend API contract
      const employeeData = {
        fullName: formData.fullName,
        fullNameArabic: formData.fullNameArabic,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        employeeCode: formData.employeeCode,
        fingerprintCode: formData.fingerprint, // Map fingerprint to fingerprintCode
        branch: formData.branch,
        title: formData.title,
      };

      let response;
      if (editingEmployeeId) {
        // Update existing employee
        response = await axiosPrivate.patch(
          `/users/${editingEmployeeId}`,
          employeeData
        );
        setSuccess(response.data.message || "Employee updated successfully!");
      } else {
        // Create new employee
        response = await axiosPrivate.post("/users/employee", employeeData);
        setSuccess(response.data.message || "Employee added successfully!");
      }

      // Refresh employees list and close modal
      await fetchEmployees();

      // Reset form after 2 seconds
      setTimeout(() => {
        setFormData({
          fullName: "",
          fullNameArabic: "",
          email: "",
          phoneNumber: "",
          employeeCode: "",
          fingerprint: "",
          branch: "المركز الرئيسي",
          title: "",
        });
        setSuccess("");
        setShowModal(false);
        setEditingEmployeeId(null);
      }, 2000);
    } catch (err) {
      console.error("Error adding employee:", err);
      setError(
        err.response?.data?.message ||
          "Failed to add employee. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployeeId(employee._id);
    setFormData({
      fullName: employee.fullName || employee.username || "",
      fullNameArabic: employee.fullNameArabic || "",
      email: employee.email || "",
      phoneNumber: employee.phonenumber || employee.phoneNumber || "",
      password: "", // Don't populate password
      employeeCode: employee.employeeCode || "",
      fingerprint: employee.fingerprintCode || "",
      branch: employee.branch || "Maadi",
      title: employee.title || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm("Are you sure you want to delete this employee?")) {
      return;
    }

    try {
      await axiosPrivate.delete(`/users/${employeeId}`);
      // Remove the deleted employee from state
      setEmployees((prev) => prev.filter((emp) => emp._id !== employeeId));
    } catch (error) {
      console.error("Error deleting employee:", error);
      alert(error.response?.data?.message || "Failed to delete employee");
    }
  };

  const handleCancel = () => {
    setShowModal(false);
    setEditingEmployeeId(null);
    setFormData({
      fullName: "",
      fullNameArabic: "",
      email: "",
      phoneNumber: "",
      employeeCode: "",
      fingerprint: "",
      branch: "المركز الرئيسي",
      title: "",
    });
    setError("");
    setSuccess("");
  };

  return (
    <div style={{ background: "#2D2D31", minHeight: "100vh", padding: "2rem" }}>
      {/* Employees List Section */}
      <div
        className="animate-fadeInUp hover-lift"
        style={{
          background: "#1E1E1E",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#FFFFFF",
                marginBottom: "0.25rem",
              }}
            >
              Employees
            </h1>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => setShowModal(true)}
              style={{
                background:
                  "linear-gradient(135deg, rgba(234, 131, 3, 0.9) 0%, rgba(234, 131, 3, 0.7) 100%)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                color: "#FFFFFF",
                padding: "0.625rem 1.25rem",
                borderRadius: "12px",
                border: "1px solid rgba(255, 255, 255, 0.2)",
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
              <i className="fas fa-plus" style={{ fontSize: "0.75rem" }}></i>
              Add New Employee
            </button>
          </div>
        </div>

        {/* Employees Table */}
        <div
          style={{
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "600px",
          }}
        >
          {employeesLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <i
                className="fas fa-spinner fa-spin"
                style={{
                  fontSize: "1.5rem",
                  marginBottom: "0.75rem",
                  display: "block",
                }}
              ></i>
              Loading employees...
            </div>
          ) : employees.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem",
                color: "rgba(255, 255, 255, 0.5)",
              }}
            >
              <i
                className="fas fa-users"
                style={{
                  fontSize: "2rem",
                  marginBottom: "0.75rem",
                  display: "block",
                  opacity: 0.5,
                }}
              ></i>
              No employees found
            </div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
              }}
            >
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Full Name
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Employee Code
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Fingerprint Code
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Email
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Phone Number
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Job Position
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Title
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Branch
                  </th>

                  <th
                    style={{
                      textAlign: "center",
                      padding: "0.875rem 1rem",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontWeight: "500",
                      fontSize: "0.75rem",
                      whiteSpace: "nowrap",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee, index) => (
                  <tr
                    key={employee._id}
                    style={{
                      borderBottom:
                        index < employees.length - 1
                          ? "1px solid rgba(255, 255, 255, 0.06)"
                          : "none",
                      transition: "background 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(255, 255, 255, 0.02)";
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
                      }}
                    >
                      {employee.fullName || employee.username || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.employeeCode || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.fingerprintCode || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.email || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.phonenumber || employee.phoneNumber || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.jobPosition || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.title || "-"}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {employee.branch || "-"}
                    </td>

                    <td
                      style={{
                        padding: "1rem",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          justifyContent: "center",
                        }}
                      >
                        <button
                          onClick={() => handleEdit(employee)}
                          style={{
                            background: "rgba(59, 130, 246, 0.15)",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "8px",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#3b82f6";
                            e.currentTarget.style.color = "#FFFFFF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(59, 130, 246, 0.15)";
                            e.currentTarget.style.color = "#3b82f6";
                          }}
                        >
                          <i
                            className="fas fa-edit"
                            style={{ fontSize: "0.75rem" }}
                          ></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(employee._id)}
                          style={{
                            background: "rgba(239, 68, 68, 0.15)",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "8px",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.8125rem",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.375rem",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.color = "#FFFFFF";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background =
                              "rgba(239, 68, 68, 0.15)";
                            e.currentTarget.style.color = "#ef4444";
                          }}
                        >
                          <i
                            className="fas fa-trash"
                            style={{ fontSize: "0.75rem" }}
                          ></i>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Employee Modal */}
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "2rem",
            backdropFilter: "blur(4px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancel();
            }
          }}
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
                    marginBottom: "0.25rem",
                  }}
                >
                  {editingEmployeeId ? "Edit Employee" : "Add New Employee"}
                </h2>
                <p
                  style={{
                    color: "rgba(255, 255, 255, 0.5)",
                    fontSize: "0.875rem",
                    margin: 0,
                  }}
                >
                  {editingEmployeeId
                    ? "Update employee information"
                    : "Add a new team member"}
                </p>
              </div>
              <button
                onClick={handleCancel}
                style={{
                  background: "rgba(255, 255, 255, 0.06)",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  padding: "0",
                  width: "2rem",
                  height: "2rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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

            {/* Modal Body */}
            <div style={{ maxHeight: "calc(90vh - 100px)", overflowY: "auto" }}>
              {/* Error Message */}
              {error && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#ef4444",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    margin: "1.5rem 2rem 0",
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

              {/* Success Message */}
              {success && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.3)",
                    color: "#10b981",
                    padding: "1rem 1.25rem",
                    borderRadius: "12px",
                    margin: "1.5rem 2rem 0",
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

              <form onSubmit={handleSubmit} style={{ padding: "2rem" }}>
                {/* Full Name */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="fullName"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter full name"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Full Name Arabic */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="fullNameArabic"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Full Name (Arabic) *
                  </label>
                  <input
                    type="text"
                    id="fullNameArabic"
                    name="fullNameArabic"
                    value={formData.fullNameArabic}
                    onChange={handleChange}
                    placeholder="أدخل الاسم بالعربية"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter email address"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Phone Number */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="phoneNumber"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="Enter phone number"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Employee Code */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="employeeCode"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Employee Code *
                  </label>
                  <input
                    type="text"
                    id="employeeCode"
                    name="employeeCode"
                    value={formData.employeeCode}
                    onChange={handleChange}
                    placeholder="Enter employee code"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Fingerprint */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="fingerprint"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Fingerprint *
                  </label>
                  <input
                    type="text"
                    id="fingerprint"
                    name="fingerprint"
                    value={formData.fingerprint}
                    onChange={handleChange}
                    placeholder="Enter fingerprint code"
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
                      e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                </div>

                {/* Branch */}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label
                    htmlFor="branch"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Branch *
                  </label>
                  <select
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
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
                    {branches.map((branch) => (
                      <option
                        key={branch}
                        value={branch}
                        style={{ background: "#1E1E1E" }}
                      >
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div style={{ marginBottom: "2rem" }}>
                  <label
                    htmlFor="title"
                    style={{
                      display: "block",
                      color: "rgba(255, 255, 255, 0.7)",
                      fontSize: "0.8125rem",
                      fontWeight: "500",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Title *
                  </label>
                  <select
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    style={{
                      width: "100%",
                      background: "rgba(255, 255, 255, 0.04)",
                      color: formData.title
                        ? "#FFFFFF"
                        : "rgba(255, 255, 255, 0.5)",
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
                    <option value="" disabled style={{ background: "#1E1E1E" }}>
                      Select title
                    </option>
                    <option
                      value="Frontend Lead"
                      style={{ background: "#1E1E1E" }}
                    >
                      Frontend Lead
                    </option>
                    <option
                      value="Backend Lead"
                      style={{ background: "#1E1E1E" }}
                    >
                      Backend Lead
                    </option>
                    <option
                      value="Frontend Developer"
                      style={{ background: "#1E1E1E" }}
                    >
                      Frontend Developer
                    </option>
                    <option
                      value="Backend Developer"
                      style={{ background: "#1E1E1E" }}
                    >
                      Backend Developer
                    </option>
                    <option value="UI/UX" style={{ background: "#1E1E1E" }}>
                      UI/UX
                    </option>
                    <option value="RA" style={{ background: "#1E1E1E" }}>
                      RA
                    </option>
                    <option
                      value="Mobile App Developer"
                      style={{ background: "#1E1E1E" }}
                    >
                      Mobile App Developer
                    </option>
                  </select>
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
                    {loading
                      ? editingEmployeeId
                        ? "Updating..."
                        : "Adding..."
                      : editingEmployeeId
                      ? "Update Employee"
                      : "Add Employee"}
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

export default AddEmployee;
