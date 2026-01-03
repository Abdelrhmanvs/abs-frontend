import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const Requests = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setLoading(true);
        // Admin sees all requests, regular users see only their own
        const endpoint = auth?.roles?.includes("admin")
          ? "/requests"
          : "/requests/my";
        const response = await axiosPrivate.get(endpoint);
        const formattedRequests = response.data.map((req) => ({
          id: req._id,
          type: req.type,
          startDate: new Date(req.startDate).toLocaleDateString(),
          endDate: new Date(req.endDate).toLocaleDateString(),
          numberOfDays: req.numberOfDays,
          status: req.status,
          notes: req.notes,
          employeeName:
            req.employeeName || req.employeeId?.fullName || "Unknown",
        }));
        setRequests(formattedRequests);
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [auth?.roles]);

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

      // Refresh requests list
      const endpoint = auth?.roles?.includes("admin")
        ? "/requests"
        : "/requests/my";
      const response = await axiosPrivate.get(endpoint);
      const formattedRequests = response.data.map((req) => ({
        id: req._id,
        type: req.type,
        startDate: new Date(req.startDate).toLocaleDateString(),
        endDate: new Date(req.endDate).toLocaleDateString(),
        numberOfDays: req.numberOfDays,
        status: req.status,
        notes: req.notes,
        employeeName: req.employeeName || req.employeeId?.fullName || "Unknown",
      }));
      setRequests(formattedRequests);
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

      // Refresh requests list
      const endpoint = auth?.roles?.includes("admin")
        ? "/requests"
        : "/requests/my";
      const response = await axiosPrivate.get(endpoint);
      const formattedRequests = response.data.map((req) => ({
        id: req._id,
        type: req.type,
        startDate: new Date(req.startDate).toLocaleDateString(),
        endDate: new Date(req.endDate).toLocaleDateString(),
        numberOfDays: req.numberOfDays,
        status: req.status,
        notes: req.notes,
        employeeName: req.employeeName || req.employeeId?.fullName || "Unknown",
      }));
      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error submitting request:", error);
      alert(error.response?.data?.message || "Failed to create request");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosPrivate.patch(`/requests/${id}`, { status: "Approved" });

      // Refresh requests list
      const endpoint = auth?.roles?.includes("admin")
        ? "/requests"
        : "/requests/my";
      const response = await axiosPrivate.get(endpoint);
      const formattedRequests = response.data.map((req) => ({
        id: req._id,
        type: req.type,
        startDate: new Date(req.startDate).toLocaleDateString(),
        endDate: new Date(req.endDate).toLocaleDateString(),
        numberOfDays: req.numberOfDays,
        status: req.status,
        notes: req.notes,
        employeeName: req.employeeName || req.employeeId?.fullName || "Unknown",
      }));
      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error approving request:", error);
      alert(error.response?.data?.message || "Failed to approve request");
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosPrivate.patch(`/requests/${id}`, { status: "Rejected" });

      // Refresh requests list
      const endpoint = auth?.roles?.includes("admin")
        ? "/requests"
        : "/requests/my";
      const response = await axiosPrivate.get(endpoint);
      const formattedRequests = response.data.map((req) => ({
        id: req._id,
        type: req.type,
        startDate: new Date(req.startDate).toLocaleDateString(),
        endDate: new Date(req.endDate).toLocaleDateString(),
        numberOfDays: req.numberOfDays,
        status: req.status,
        notes: req.notes,
        employeeName: req.employeeName || req.employeeId?.fullName || "Unknown",
      }));
      setRequests(formattedRequests);
    } catch (error) {
      console.error("Error rejecting request:", error);
      alert(error.response?.data?.message || "Failed to reject request");
    }
  };

  return (
    <div style={{ background: "#2D2D31", minHeight: "100vh", padding: "2rem" }}>
      {/* All Requests Section */}
      <div
        className="animate-fadeInUp hover-lift"
        style={{
          background: "#1E1E1E",
          borderRadius: "16px",
          padding: "1.5rem",
          border: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
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
          <h2
            style={{
              fontSize: "1.125rem",
              fontWeight: "600",
              color: "#FFFFFF",
              margin: 0,
            }}
          >
            All Requests
          </h2>
          <div style={{ display: "flex", gap: "1rem" }}>
            {!auth?.roles?.includes("admin") && (
              <button
                onClick={handleNewRequest}
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
                Custom Request
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
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
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "3rem",
              color: "rgba(255, 255, 255, 0.5)",
            }}
          >
            <i
              className="fas fa-inbox"
              style={{
                fontSize: "2rem",
                marginBottom: "0.75rem",
                display: "block",
                opacity: 0.5,
              }}
            ></i>
            No requests found
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255, 255, 255, 0.03)" }}>
                  {auth?.roles?.includes("admin") && (
                    <th
                      style={{
                        padding: "0.875rem 1rem",
                        textAlign: "left",
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Employee
                    </th>
                  )}
                  <th
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Request Type
                  </th>
                  <th
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Date Range
                  </th>
                  <th
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Days
                  </th>
                  <th
                    style={{
                      padding: "0.875rem 1rem",
                      textAlign: "left",
                      color: "rgba(255, 255, 255, 0.5)",
                      fontSize: "0.75rem",
                      fontWeight: "500",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Status
                  </th>
                  {auth?.roles?.includes("admin") && (
                    <th
                      style={{
                        padding: "0.875rem 1rem",
                        textAlign: "left",
                        color: "rgba(255, 255, 255, 0.5)",
                        fontSize: "0.75rem",
                        fontWeight: "500",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((request, index) => (
                  <tr
                    key={request.id}
                    style={{
                      borderBottom:
                        index < requests.length - 1
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
                    {auth?.roles?.includes("admin") && (
                      <td
                        style={{
                          padding: "1rem",
                          color: "#FFFFFF",
                          fontSize: "0.875rem",
                          fontWeight: "500",
                        }}
                      >
                        {request.employeeName}
                      </td>
                    )}
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {request.type}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {request.startDate} - {request.endDate}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "rgba(255, 255, 255, 0.8)",
                        fontSize: "0.875rem",
                      }}
                    >
                      {request.numberOfDays}
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
                    {auth?.roles?.includes("admin") && (
                      <td style={{ padding: "1rem" }}>
                        {request.status === "Pending" && (
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                              onClick={() => handleApprove(request.id)}
                              style={{
                                background: "#10b981",
                                color: "#ffffff",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                fontSize: "0.75rem",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "background 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#059669";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background = "#10b981";
                              }}
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              style={{
                                background: "#ef4444",
                                color: "#ffffff",
                                padding: "0.5rem 1rem",
                                borderRadius: "0.375rem",
                                border: "none",
                                fontSize: "0.75rem",
                                fontWeight: "600",
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
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={handleCloseModal}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              width: "90%",
              maxWidth: "500px",
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
                  borderRadius: "8px",
                  width: "2rem",
                  height: "2rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.color = "rgba(255, 255, 255, 0.5)";
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
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "rgba(255, 255, 255, 0.7)",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      fontSize: "0.875rem",
                      fontWeight: "500",
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
                      padding: "0.75rem 1.25rem",
                      borderRadius: "12px",
                      border: loading
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      fontSize: "0.875rem",
                      fontWeight: "500",
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
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={handleCloseCustomModal}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              maxWidth: "500px",
              width: "90%",
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
                  borderRadius: "8px",
                  width: "2rem",
                  height: "2rem",
                  fontSize: "1rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                  e.target.style.color = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.06)";
                  e.target.style.color = "rgba(255, 255, 255, 0.5)";
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
                        {emp.fullName} ({emp.employeeCode})
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
                    justifyContent: "flex-end",
                    gap: "0.75rem",
                  }}
                >
                  <button
                    type="button"
                    onClick={handleCloseCustomModal}
                    style={{
                      background: "rgba(255, 255, 255, 0.06)",
                      backdropFilter: "blur(10px)",
                      WebkitBackdropFilter: "blur(10px)",
                      color: "rgba(255, 255, 255, 0.7)",
                      padding: "0.75rem 1.25rem",
                      borderRadius: "12px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      fontSize: "0.875rem",
                      fontWeight: "500",
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
                      padding: "0.75rem 1.25rem",
                      borderRadius: "12px",
                      border: loading
                        ? "none"
                        : "1px solid rgba(255, 255, 255, 0.2)",
                      fontSize: "0.875rem",
                      fontWeight: "500",
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

export default Requests;
