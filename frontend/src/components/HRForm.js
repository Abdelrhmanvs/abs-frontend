import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";
import * as XLSX from "xlsx";

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

  // Fetch approved requests on mount
  useEffect(() => {
    fetchApprovedRequests();
  }, []);

  const fetchApprovedRequests = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/requests/approved");

      if (response?.data && Array.isArray(response.data)) {
        setHrData(response.data);
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

  const handleCellChange = (rowId, field, value) => {
    setHrData((prevData) =>
      prevData.map((row) => {
        if (row.id === rowId) {
          const updatedRow = { ...row, [field]: value };

          // Auto-recalculate days if dates are changed
          if (field === "startDate" || field === "endDate") {
            updatedRow.numberOfDays = calculateDays(
              updatedRow.startDate,
              updatedRow.endDate
            );
          }

          return updatedRow;
        }
        return row;
      })
    );
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  const handleKeyDown = (e, rowId, field) => {
    if (e.key === "Enter") {
      setEditingCell(null);
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

  const handleExportToExcel = () => {
    const filteredData = getFilteredData();

    // Create Excel-compatible data structure with exact columns from table
    const excelData = filteredData.map((row, index) => ({
      code: row.code || "",
      "Employee / Fingerprint": row.fingerprint || "",
      Employee: row.employeeName || "",
      "Employee / Job Position": row.jobPosition || "",
      "Employee / الفرع": row.branch || "",
      "Time Off Type": row.timeOffType || "",
      "الغرض من النموذج الإداري": row.purpose || "",
      "Start Date": row.startDate || "",
      "End Date": row.endDate || "",
      "عدد الأيام": row.numberOfDays || "",
    }));

    // Create a new workbook and worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HR Report");

    // Enhanced column widths for better readability
    const columnWidths = [
      { wch: 15 }, // code
      { wch: 22 }, // Employee / Fingerprint
      { wch: 32 }, // Employee
      { wch: 28 }, // Employee / Job Position
      { wch: 22 }, // Employee / الفرع
      { wch: 20 }, // Time Off Type
      { wch: 38 }, // الغرض من النموذج الإداري
      { wch: 15 }, // Start Date
      { wch: 15 }, // End Date
      { wch: 15 }, // عدد الأيام
    ];
    worksheet["!cols"] = columnWidths;

    const range = XLSX.utils.decode_range(worksheet["!ref"]);

    // Enhanced header row styling with professional design
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { 
          bold: true, 
          sz: 13, 
          color: { rgb: "FFFFFF" },
          name: "Calibri"
        },
        fill: { 
          patternType: "solid",
          fgColor: { rgb: "1F4E78" } // Professional dark blue
        },
        alignment: { 
          horizontal: "center", 
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "FFFFFF" } },
          bottom: { style: "medium", color: { rgb: "1F4E78" } },
          left: { style: "thin", color: { rgb: "FFFFFF" } },
          right: { style: "thin", color: { rgb: "FFFFFF" } }
        }
      };
    }

    // Style data rows with alternating colors and borders
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const isEvenRow = row % 2 === 0;
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
        if (!worksheet[cellAddress]) continue;
        
        worksheet[cellAddress].s = {
          font: { 
            sz: 11,
            name: "Calibri",
            color: { rgb: "000000" }
          },
          fill: { 
            patternType: "solid",
            fgColor: { rgb: isEvenRow ? "F2F2F2" : "FFFFFF" } // Alternating rows
          },
          alignment: { 
            horizontal: col === 0 ? "center" : "left", // Center code column
            vertical: "center",
            wrapText: true
          },
          border: {
            top: { style: "thin", color: { rgb: "D9D9D9" } },
            bottom: { style: "thin", color: { rgb: "D9D9D9" } },
            left: { style: "thin", color: { rgb: "D9D9D9" } },
            right: { style: "thin", color: { rgb: "D9D9D9" } }
          }
        };
      }
    }

    // Set row heights for better spacing
    const rowHeights = [];
    rowHeights[0] = { hpx: 35 }; // Header row height
    for (let i = 1; i <= range.e.r; i++) {
      rowHeights[i] = { hpx: 25 }; // Data row height
    }
    worksheet["!rows"] = rowHeights;

    // Add filters to header row
    worksheet["!autofilter"] = { ref: worksheet["!ref"] };

    // Freeze header row
    worksheet["!freeze"] = { xSplit: 0, ySplit: 1 };

    // Generate Excel file with company name and date
    const dateStr = new Date().toISOString().split("T")[0];
    const fileName = `HR_Report_${dateStr}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  const renderEditableCell = (row, field) => {
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.field === field;
    const value = row[field] || "";

    if (isEditing) {
      if (field === "startDate" || field === "endDate") {
        return (
          <div style={{ position: "relative" }}>
            <input
              type="date"
              value={value}
              onChange={(e) => handleCellChange(row.id, field, e.target.value)}
              onBlur={handleCellBlur}
              onKeyDown={(e) => handleKeyDown(e, row.id, field)}
              autoFocus
              style={{
                background: "#1a1a1a",
                color: "#ffffff",
                border: "1px solid #f97316",
                borderRadius: "0.25rem",
                padding: "0.25rem 2rem 0.25rem 0.5rem",
                fontSize: "0.875rem",
                outline: "none",
                width: "100%",
                cursor: "pointer",
                colorScheme: "dark",
              }}
            />
            <i
              className="fas fa-calendar-alt"
              style={{
                position: "absolute",
                right: "0.5rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
                pointerEvents: "none",
                fontSize: "0.75rem",
              }}
            ></i>
          </div>
        );
      }

      return (
        <input
          type="text"
          value={value}
          onChange={(e) => handleCellChange(row.id, field, e.target.value)}
          onBlur={handleCellBlur}
          onKeyDown={(e) => handleKeyDown(e, row.id, field)}
          autoFocus
          style={{
            background: "#1a1a1a",
            color: "#ffffff",
            border: "1px solid #f97316",
            borderRadius: "0.25rem",
            padding: "0.25rem 0.5rem",
            fontSize: "0.875rem",
            outline: "none",
            width: "100%",
          }}
        />
      );
    }

    return (
      <div
        onClick={() => handleCellClick(row.id, field)}
        style={{
          cursor: "pointer",
          padding: "0.25rem 0.5rem",
          minHeight: "1.5rem",
          borderRadius: "0.25rem",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "#3a3a3a";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
        }}
      >
        {value || "-"}
      </div>
    );
  };

  const filteredData = getFilteredData();

  return (
    <div
      style={{
        marginLeft: "235px",
        marginTop: "65px",
        minHeight: "calc(100vh - 65px)",
        background: "#1a1a1a",
        overflowX: "hidden",
        padding: "2rem",
      }}
    >
      {/* Main Content */}
      <div>
        {/* HR Export Form Section */}
        <div
          style={{
            background: "#2d2d2d",
            borderRadius: "0.75rem",
            padding: "1.5rem",
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
                fontSize: "1.25rem",
                fontWeight: "600",
                color: "#ffffff",
                margin: 0,
              }}
            >
              HR Export Form
            </h2>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              {/* Request Type Filter */}
              <select
                value={selectedRequestType}
                onChange={(e) => setSelectedRequestType(e.target.value)}
                style={{
                  background: "#3a3a3a",
                  color: "#ffffff",
                  border: "1px solid #4a4a4a",
                  borderRadius: "0.5rem",
                  padding: "0.75rem 1rem",
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="All Request Types">All Request Types</option>
                <option value="WFH">WFH</option>
                <option value="Mission">Mission</option>
              </select>

              {/* Date Filter */}
              <div style={{ position: "relative" }}>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    background: "#3a3a3a",
                    color: "#ffffff",
                    border: "1px solid #4a4a4a",
                    borderRadius: "0.5rem",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    fontSize: "0.875rem",
                    outline: "none",
                    width: "150px",
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

              {/* Export Button */}
              <button
                onClick={handleExportToExcel}
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
                <i className="fas fa-file-excel"></i>
                Export to Excel
              </button>

              {/* Delete All Button */}
              <button
                onClick={handleDeleteAll}
                disabled={hrData.length === 0}
                style={{
                  background: hrData.length === 0 ? "#6b7280" : "#ef4444",
                  color: "#ffffff",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "0.5rem",
                  border: "none",
                  fontSize: "0.875rem",
                  fontWeight: "600",
                  cursor: hrData.length === 0 ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "background 0.2s",
                  opacity: hrData.length === 0 ? 0.5 : 1,
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
                  padding: "2rem",
                  color: "#9ca3af",
                }}
              >
                Loading approved requests...
              </div>
            ) : filteredData.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2rem",
                  color: "#9ca3af",
                }}
              >
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
                  <tr style={{ borderBottom: "1px solid #404040" }}>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      code
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Employee / Fingerprint
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Employee
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Employee / Job Position
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Employee / الفرع
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Time Off Type
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      الغرض من النموذج الإداري
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Start Date
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      End Date
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      عدد الأيام
                    </th>
                    <th
                      style={{
                        textAlign: "center",
                        padding: "1rem",
                        color: "#9ca3af",
                        fontWeight: "500",
                        fontSize: "0.875rem",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((row) => (
                    <tr
                      key={row.id}
                      style={{ borderBottom: "1px solid #404040" }}
                    >
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "code")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "fingerprint")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "employeeName")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "jobPosition")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "branch")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "timeOffType")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                        }}
                      >
                        {renderEditableCell(row, "purpose")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {renderEditableCell(row, "startDate")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
                          fontSize: "0.875rem",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {renderEditableCell(row, "endDate")}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          color: "#ffffff",
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
                        <button
                          onClick={() => handleDelete(row.id)}
                          style={{
                            background: "#ef4444",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "0.375rem",
                            padding: "0.5rem 0.75rem",
                            fontSize: "0.875rem",
                            cursor: "pointer",
                            transition: "background 0.2s",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.background = "#dc2626";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.background = "#ef4444";
                          }}
                        >
                          <i className="fas fa-trash"></i>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
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
