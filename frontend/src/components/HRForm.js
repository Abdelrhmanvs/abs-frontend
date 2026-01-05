import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const HRForm = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();

  const [selectedRequestType, setSelectedRequestType] =
    useState("All Request Types");
  const [selectedDate, setSelectedDate] = useState("");
  const [hrData, setHrData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState(null);
  const [dirtyRows, setDirtyRows] = useState({});
  // Sort state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "asc",
  });

  // Fetch approved requests on mount
  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/requests/approved");
      console.log("[HRForm] Fetched /requests/approved:", response.data);
      if (response?.data && Array.isArray(response.data)) {
        setHrData((prev) => {
          console.log("[HRForm] setHrData called with:", response.data);
          return response.data;
        });
      } else {
        setHrData([]);
      }
    } catch (error) {
      console.error("Error fetching approved requests:", error);
      setHrData([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return "";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return String(diffDays);
  };

  // Handle inline cell editing
  const handleCellClick = (rowId, field) => {
    setEditingCell({ rowId, field });
  };

  const saveCellChange = async (rowId, updatedRow) => {
    // Save cell change to backend
    // Map HR form row to backend f:", row);
    try {
      const payload = {
        startDate: updatedRow.startDate,
        endDate: updatedRow.endDate,
        numberOfDays: updatedRow.numberOfDays,
        notes: updatedRow.notes,
        purpose: updatedRow.purpose,
        type: updatedRow.timeOffType == "ماموريه" ? "WFH" : "",
      };
      console.log(
        "Saving changes for row ID:",
        rowId,
        "with payload:",
        payload
      );
      await axiosPrivate.patch(`/requests/${rowId}`, payload);
    } catch (error) {
      console.error("Error saving changes:", error);
      if (error?.response) {
        console.error("Backend error response:", error.response.data);
        alert(
          "Failed to save changes: " +
            (error.response.data?.message || "Unknown error")
        );
      } else {
        alert("Failed to save changes");
      }
    }
  };

  // Only update local state on change, and mark row as dirty
  const handleCellChange = (rowId, field, value) => {
    setHrData((prevData) =>
      prevData.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
              ...(field === "startDate" || field === "endDate"
                ? {
                    numberOfDays: calculateDays(
                      field === "startDate" ? value : row.startDate,
                      field === "endDate" ? value : row.endDate
                    ),
                  }
                : {}),
            }
          : row
      )
    );
    setDirtyRows((prev) => ({ ...prev, [rowId]: true }));
  };

  // Disable auto-save on blur; just exit editing mode
  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e, rowId, field) => {
    if (e.key === "Enter") {
      handleCellBlur(rowId);
    }
  };

  const handleDelete = async (requestId) => {
    if (!window.confirm("Are you sure you want to delete this request?")) {
      return;
    }

    try {
      await axiosPrivate.delete(`/requests/${requestId}`);
      // Remove the deleted item from state
      setHrData((prevData) => prevData.filter((row) => row.id !== requestId));
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(error.response?.data?.message || "Failed to delete request");
    }
  };

  const handleDeleteAll = async () => {
    if (
      !window.confirm(
        "⚠️ WARNING: This will permanently delete ALL approved requests in the HR Form!\n\nAre you absolutely sure you want to continue?"
      )
    ) {
      return;
    }

    // Double confirmation
    if (
      !window.confirm(
        "This action CANNOT be undone. Type confirmations are not available in this dialog.\n\nClick OK to proceed with deletion."
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const response = await axiosPrivate.delete("/requests/all");

      // Clear all data from state
      setHrData([]);

      alert(
        `Successfully deleted ${response.data.deletedCount} approved requests.`
      );
    } catch (error) {
      console.error("Error deleting all requests:", error);
      alert(error.response?.data?.message || "Failed to delete all requests");
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected filters
  const getFilteredData = () => {
    let filtered = [...hrData];

    if (selectedRequestType !== "All Request Types") {
      filtered = filtered.filter(
        (row) => row.timeOffType === selectedRequestType
      );
    }

    if (selectedDate) {
      filtered = filtered.filter((row) => {
        return row.startDate === selectedDate || row.endDate === selectedDate;
      });
    }

    return filtered;
  };

  // Sorting function (date sort for startDate, endDate only)
  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    // Only sort for startDate and endDate as dates
    if (sortConfig.key === "startDate" || sortConfig.key === "endDate") {
      return [...data].sort((a, b) => {
        const aValue = new Date(a[sortConfig.key]);
        const bValue = new Date(b[sortConfig.key]);
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      });
    }
    // Otherwise, do not sort at all (should not happen since sort only allowed on those)
    return data;
  };

  const handleExportToExcel = async () => {
    const filteredData = getFilteredData();

    // Format date as DD/MM/YYYY
    const formatDateDDMMYYYY = (dateStr) => {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("HR Report");

    // Define columns with headers
    worksheet.columns = [
      { header: "code", key: "code", width: 10 },
      { header: "Employee/Fingerprint", key: "fingerprint", width: 22 },
      { header: "Employee", key: "employee", width: 20 },
      { header: "Employee/Job Position", key: "jobPosition", width: 22 },
      { header: "Employee/الفرع", key: "branch", width: 18 },
      { header: "Time Off Type", key: "timeOffType", width: 16 },
      { header: "الغرض من النموذج الادارى", key: "purpose", width: 28 },
      { header: "Start Date", key: "startDate", width: 14 },
      { header: "End Date", key: "endDate", width: 14 },
      { header: "عدد الايام", key: "numberOfDays", width: 12 },
    ];

    // Add data rows - use actual values from table, not defaults
    filteredData.forEach((row) => {
      worksheet.addRow({
        code: row.code || "",
        fingerprint: row.fingerprint || "",
        employee: row.employeeName || "",
        jobPosition: row.jobPosition || "",
        branch: row.branch || "",
        timeOffType: row.timeOffType || "",
        purpose: row.purpose || "",
        startDate: formatDateDDMMYYYY(row.startDate),
        endDate: formatDateDDMMYYYY(row.endDate),
        numberOfDays: row.numberOfDays || "",
      });
    });

    // Style header row - dark background with white text
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF2D2D31" }, // Dark gray
      };
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" }, // White text
        size: 11,
        name: "Calibri",
      };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF4A4A4A" } },
        bottom: { style: "thin", color: { argb: "FF4A4A4A" } },
        left: { style: "thin", color: { argb: "FF4A4A4A" } },
        right: { style: "thin", color: { argb: "FF4A4A4A" } },
      };
    });

    // Style data rows - white background with green borders
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      row.height = 22;
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" }, // White background
        };
        cell.font = {
          size: 11,
          name: "Calibri",
          color: { argb: "FF000000" },
        };
        cell.alignment = {
          horizontal: "center",
          vertical: "middle",
        };
        cell.border = {
          top: { style: "thin", color: { argb: "FF538135" } }, // Green border
          bottom: { style: "thin", color: { argb: "FF538135" } },
          left: { style: "thin", color: { argb: "FF538135" } },
          right: { style: "thin", color: { argb: "FF538135" } },
        };
      });
    }

    // Add autofilter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: 10 },
    };

    // Freeze header row
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    // Generate and download file
    const dateStr = new Date().toISOString().split("T")[0];
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, `HR_Report_${dateStr}.xlsx`);
  };

  // Non-editable fields in table
  const NON_EDITABLE_FIELDS = [
    "code",
    "fingerprint",
    "jobPosition",
    "branch",
    "employeeName",
  ];

  const renderEditableCell = (row, field) => {
    const value = row[field] || "";
    const rowKey = row.id;

    if (NON_EDITABLE_FIELDS.includes(field)) {
      return value || "-";
    }

    const isEditing =
      editingCell?.rowId === rowKey && editingCell?.field === field;

    if (isEditing) {
      if (field === "startDate" || field === "endDate") {
        return (
          <div style={{ position: "relative" }}>
            <input
              type="date"
              value={value}
              onChange={(e) => handleCellChange(rowKey, field, e.target.value)}
              onBlur={() => handleCellBlur(rowKey)}
              onKeyDown={(e) => handleKeyDown(e, rowKey, field)}
              autoFocus
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                color: "#FFFFFF",
                border: "1px solid #EA8303",
                borderRadius: "6px",
                padding: "0.25rem 0.5rem",
                fontSize: "0.875rem",
                outline: "none",
                width: "100%",
                cursor: "pointer",
                colorScheme: "dark",
                boxShadow: "0 0 0 3px rgba(234, 131, 3, 0.1)",
              }}
            />
          </div>
        );
      }

      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleCellChange(rowKey, field, e.target.value)}
          onBlur={() => handleCellBlur(rowKey)}
          onKeyDown={(e) => handleKeyDown(e, rowKey, field)}
          autoFocus
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            color: "#FFFFFF",
            border: "1px solid #EA8303",
            borderRadius: "6px",
            padding: "0.25rem 0.5rem",
            fontSize: "0.875rem",
            outline: "none",
            width: "100%",
            boxShadow: "0 0 0 3px rgba(234, 131, 3, 0.1)",
          }}
        />
      );
    }

    return (
      <div
        onClick={() => handleCellClick(rowKey, field)}
        style={{
          cursor: "pointer",
          padding: "0.25rem 0.5rem",
          minHeight: "1.5rem",
          borderRadius: "6px",
          transition: "background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {value || "-"}
      </div>
    );
  };

  const filteredData = getSortedData(getFilteredData());

  // Only allow sort on startDate and endDate
  const handleSort = (key) => {
    if (key !== "startDate" && key !== "endDate") return;

    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === "asc" ? "desc" : "asc",
        };
      }
      return { key, direction: "asc" };
    });
  };

  return (
    <div style={{ background: "#2D2D31", minHeight: "100vh", padding: "2rem" }}>
      {/* Main Content */}
      <div>
        {/* HR Export Form Section */}
        <div
          className="animate-fadeInUp hover-lift"
          style={{
            background: "#1E1E1E",
            borderRadius: "16px",
            padding: "1.5rem",
            border: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          {/* Header with filters and export button */}
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
              HR Export Form
            </h2>

            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {/* Request Type Filter */}
              <select
                value={selectedRequestType}
                onChange={(e) => setSelectedRequestType(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.625rem 1rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#EA8303";
                  e.target.style.boxShadow = "0 0 0 3px rgba(234, 131, 3, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              >
                <option value="All Request Types">All Request Types</option>
                <option value="WFH">WFH</option>
                <option value="Mission">Mission</option>
              </select>

              {/* Date Filter */}
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: "10px",
                  padding: "0.625rem 1rem",
                  fontSize: "0.875rem",
                  outline: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  colorScheme: "dark",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "#EA8303";
                  e.target.style.boxShadow = "0 0 0 3px rgba(234, 131, 3, 0.1)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(255, 255, 255, 0.08)";
                  e.target.style.boxShadow = "none";
                }}
              />

              {/* Export Button */}
              <button
                onClick={handleExportToExcel}
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
                <i className="fas fa-file-excel"></i>
                Export to Excel
              </button>

              {/* Delete All Button */}
              <button
                onClick={handleDeleteAll}
                disabled={hrData.length === 0}
                style={{
                  background:
                    hrData.length === 0
                      ? "rgba(255, 255, 255, 0.1)"
                      : "#ef4444",
                  color:
                    hrData.length === 0
                      ? "rgba(255, 255, 255, 0.4)"
                      : "#FFFFFF",
                  padding: "0.625rem 1.25rem",
                  borderRadius: "10px",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: "500",
                  cursor: hrData.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (hrData.length > 0) {
                    e.target.style.background = "#dc2626";
                  }
                }}
                onMouseLeave={(e) => {
                  if (hrData.length > 0) {
                    e.target.style.background = "#ef4444";
                  }
                }}
              >
                <i className="fas fa-trash-alt"></i>
                Delete All
              </button>
            </div>
          </div>

          {/* Editable Table */}
          <div
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxWidth: "100%",
              maxHeight: "600px",
            }}
          >
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
                Loading approved requests...
              </div>
            ) : filteredData.length === 0 ? (
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
                No approved requests found
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
                      code
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
                      Employee / Fingerprint
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
                      Employee
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
                      Employee / Job Position
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
                      Employee / الفرع
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
                      Time Off Type
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
                      الغرض من النموذج الإداري
                    </th>
                    <th
                      onClick={() => handleSort("startDate")}
                      style={{
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "0.875rem 1rem",
                        color:
                          sortConfig.key === "startDate"
                            ? "#EA8303"
                            : "rgba(255, 255, 255, 0.5)",
                        fontWeight:
                          sortConfig.key === "startDate" ? "600" : "500",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Start Date
                      {sortConfig.key === "startDate" &&
                        (sortConfig.direction === "asc" ? " ▲" : " ▼")}
                    </th>
                    <th
                      onClick={() => handleSort("endDate")}
                      style={{
                        cursor: "pointer",
                        textAlign: "left",
                        padding: "0.875rem 1rem",
                        color:
                          sortConfig.key === "endDate"
                            ? "#EA8303"
                            : "rgba(255, 255, 255, 0.5)",
                        fontWeight:
                          sortConfig.key === "endDate" ? "600" : "500",
                        fontSize: "0.75rem",
                        whiteSpace: "nowrap",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      End Date
                      {sortConfig.key === "endDate" &&
                        (sortConfig.direction === "asc" ? " ▲" : " ▼")}
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
                      عدد الأيام
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
                  {filteredData.map((row, index) => {
                    const rowKey = row.id;
                    return (
                      <tr
                        key={rowKey}
                        style={{
                          borderBottom:
                            index < filteredData.length - 1
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
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "code")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "fingerprint")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "#FFFFFF",
                            fontSize: "0.875rem",
                            fontWeight: "500",
                          }}
                        >
                          {renderEditableCell(row, "employeeName")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "jobPosition")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "branch")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "timeOffType")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                          }}
                        >
                          {renderEditableCell(row, "purpose")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {renderEditableCell(row, "startDate")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {renderEditableCell(row, "endDate")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            color: "rgba(255, 255, 255, 0.8)",
                            fontSize: "0.875rem",
                            textAlign: "center",
                          }}
                        >
                          {renderEditableCell(row, "numberOfDays")}
                        </td>
                        <td
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                          }}
                        >
                          {dirtyRows[rowKey] && (
                            <button
                              onClick={async () => {
                                try {
                                  await saveCellChange(rowKey, row);
                                  setDirtyRows((prev) => {
                                    const copy = { ...prev };
                                    delete copy[rowKey];
                                    return copy;
                                  });
                                  alert("Changes saved successfully");
                                } catch {}
                              }}
                              style={{
                                background: "rgba(34, 197, 94, 0.15)",
                                color: "#22c55e",
                                border: "none",
                                borderRadius: "8px",
                                padding: "0.5rem 0.75rem",
                                fontSize: "0.8125rem",
                                cursor: "pointer",
                                marginRight: "0.5rem",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.375rem",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = "#22c55e";
                                e.currentTarget.style.color = "#FFFFFF";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(34, 197, 94, 0.15)";
                                e.currentTarget.style.color = "#22c55e";
                              }}
                            >
                              <i
                                className="fas fa-save"
                                style={{ fontSize: "0.75rem" }}
                              ></i>
                              Save
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(rowKey)}
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRForm;
