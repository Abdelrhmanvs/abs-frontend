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
    <div
      style={{
        marginLeft: "235px",
        marginTop: "65px",
        minHeight: "calc(100vh - 65px)",
        background: "#1a1a1a",
        padding: "2rem",
      }}
    >
      {/* All Requests Section */}
      <div
        style={{
          background: "#2d2d2d",
          borderRadius: "0.75rem",
          padding: "1.5rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.5rem",
          }}
        >
          <h2
            style={{
              fontSize: "1.25rem",
              fontWeight: "600",
              color: "#ffffff",
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

        {/* Table */}
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#9ca3af",
            }}
          >
            Loading requests...
          </div>
        ) : requests.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "2rem",
              color: "#9ca3af",
            }}
          >
            No requests found
          </div>
        ) : (
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
                  {auth?.roles?.includes("admin") && (
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                      }}
                    >
                      Employee
                    </th>
                  )}
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
                    Date Range
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
                    Days
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
                  {auth?.roles?.includes("admin") && (
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                      }}
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr
                    key={request.id}
                    style={{
                      borderBottom: "1px solid #404040",
                    }}
                  >
                    {auth?.roles?.includes("admin") && (
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
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
                      {request.startDate} - {request.endDate}
                    </td>
                    <td
                      style={{
                        padding: "1rem",
                        color: "#ffffff",
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

export default Requests;
