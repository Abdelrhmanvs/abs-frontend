import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useAxiosPrivate from "../hooks/useAxiosPrivate";

const Profile = () => {
  const navigate = useNavigate();
  const { auth } = useAuth();
  const axiosPrivate = useAxiosPrivate();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phonenumber: "",
    bio: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axiosPrivate.get("/users/profile");
      if (response?.data?.user) {
        setProfile(response.data.user);
        setFormData({
          firstName: response.data.user.firstName || "",
          lastName: response.data.user.lastName || "",
          email: response.data.user.email || "",
          phonenumber: response.data.user.phonenumber || "",
          bio: response.data.user.bio || "",
          city: response.data.user.city || "",
          country: response.data.user.country || "",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setMessage({ type: "error", text: "Failed to load profile" });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setPasswordError("");
  };

  const handleChangePassword = async () => {
    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      setPasswordError("All fields are required");
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    try {
      setChangingPassword(true);
      await axiosPrivate.patch("/users/change-password", {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      setShowPasswordModal(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setMessage({ type: "success", text: "Password changed successfully!" });
      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(
        error.response?.data?.message || "Failed to change password"
      );
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await axiosPrivate.patch("/users/profile", formData);
      if (response?.data?.profile) {
        setProfile({
          ...profile,
          ...response.data.profile,
        });
        setEditing(false);
        setMessage({ type: "success", text: "Profile updated successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setMessage({ type: "error", text: "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: profile?.firstName || "",
      lastName: profile?.lastName || "",
      email: profile?.email || "",
      phonenumber: profile?.phonenumber || "",
      bio: profile?.bio || "",
      city: profile?.city || "",
      country: profile?.country || "",
    });
    setEditing(false);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please select an image file" });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image size must be less than 5MB" });
      return;
    }

    try {
      setUploadingPhoto(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;

        try {
          const response = await axiosPrivate.patch("/users/profile-photo", {
            profilePhoto: base64String,
          });

          if (response?.data?.profilePhoto) {
            setProfile((prev) => ({
              ...prev,
              profilePhoto: response.data.profilePhoto,
            }));
            setMessage({ type: "success", text: "Profile photo updated!" });
            setTimeout(() => setMessage({ type: "", text: "" }), 3000);
          }
        } catch (error) {
          console.error("Error uploading photo:", error);
          setMessage({ type: "error", text: "Failed to upload photo" });
        } finally {
          setUploadingPhoto(false);
        }
      };

      reader.onerror = () => {
        setMessage({ type: "error", text: "Failed to read image file" });
        setUploadingPhoto(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing photo:", error);
      setMessage({ type: "error", text: "Failed to process image" });
      setUploadingPhoto(false);
    }

    // Reset file input
    e.target.value = "";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = () => {
    const first = profile?.firstName?.[0] || profile?.name?.[0] || "U";
    const last = profile?.lastName?.[0] || "";
    return (first + last).toUpperCase();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          background: "#2D2D31",
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: "50px",
            height: "50px",
            border: "4px solid rgba(234, 131, 3, 0.2)",
            borderTop: "4px solid #EA8303",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
      </div>
    );
  }

  return (
    <div
      className="animate-fadeIn"
      style={{
        padding: "2rem",
        background: "#2D2D31",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1
          style={{
            color: "#FFFFFF",
            fontSize: "1.75rem",
            fontWeight: "600",
            margin: 0,
          }}
        >
          My Profile
        </h1>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: "8px",
            color: "#FFFFFF",
            padding: "0.5rem 1rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "rgba(255, 255, 255, 0.1)";
          }}
        >
          <i className="fas fa-arrow-left"></i>
          Back
        </button>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className="animate-fadeIn"
          style={{
            padding: "1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            background:
              message.type === "success"
                ? "rgba(34, 197, 94, 0.15)"
                : "rgba(239, 68, 68, 0.15)",
            border: `1px solid ${
              message.type === "success"
                ? "rgba(34, 197, 94, 0.3)"
                : "rgba(239, 68, 68, 0.3)"
            }`,
            color: message.type === "success" ? "#22C55E" : "#EF4444",
          }}
        >
          <i
            className={`fas ${
              message.type === "success"
                ? "fa-check-circle"
                : "fa-exclamation-circle"
            }`}
            style={{ marginRight: "0.5rem" }}
          ></i>
          {message.text}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "350px 1fr",
          gap: "2rem",
        }}
      >
        {/* Profile Card */}
        <div
          className="animate-fadeInUp"
          style={{
            background: "#1E1E1E",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          {/* Avatar with Photo Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoChange}
            accept="image/*"
            style={{ display: "none" }}
          />
          <div
            // onClick={handlePhotoClick} // Photo upload disabled for now
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: profile?.profilePhoto
                ? `url(${profile.profilePhoto}) center/cover no-repeat`
                : "linear-gradient(135deg, #EA8303 0%, #D67803 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
              fontSize: "2.5rem",
              fontWeight: "600",
              color: "#FFFFFF",
              boxShadow: "0 8px 32px rgba(234, 131, 3, 0.3)",
              cursor: "pointer",
              position: "relative",
              overflow: "hidden",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.querySelector(".photo-overlay").style.opacity =
                "1";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.querySelector(".photo-overlay").style.opacity =
                "0";
            }}
          >
            {!profile?.profilePhoto && getInitials()}

            {/* Camera Overlay */}
            <div
              className="photo-overlay"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.6)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.3s ease",
                borderRadius: "50%",
              }}
            >
              {uploadingPhoto ? (
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    borderTop: "2px solid #FFFFFF",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                />
              ) : (
                <>
                  <i
                    className="fas fa-camera"
                    style={{
                      fontSize: "1.5rem",
                      marginBottom: "0.25rem",
                      color: "#FFFFFF",
                    }}
                  ></i>
                  <span
                    style={{
                      fontSize: "0.65rem",
                      color: "#FFFFFF",
                      fontWeight: "500",
                    }}
                  >
                    Change Photo
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Name */}
          <h2
            style={{
              color: "#FFFFFF",
              fontSize: "1.5rem",
              fontWeight: "600",
              marginBottom: "0.5rem",
            }}
          >
            {profile?.firstName || profile?.fullName || profile?.name || "User"}
          </h2>

          {/* Title/Role */}
          <p
            style={{
              color: "#EA8303",
              fontSize: "0.9rem",
              fontWeight: "500",
              marginBottom: "1rem",
            }}
          >
            {profile?.title || auth?.roles?.[0] || "User"}
          </p>

          {/* Email */}
          <p
            style={{
              color: "rgba(255, 255, 255, 0.6)",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}
          >
            <i
              className="fas fa-envelope"
              style={{ marginRight: "0.5rem" }}
            ></i>
            {profile?.email || "No email"}
          </p>

          {/* Stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1rem",
              padding: "1.5rem 0",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            }}
          >
            <div>
              <p
                style={{
                  color: "#EA8303",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                {profile?.platformUsageCount || 0}
              </p>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                }}
              >
                Platform Usage
              </p>
            </div>
            <div>
              <p
                style={{
                  color: "#EA8303",
                  fontSize: "1.5rem",
                  fontWeight: "600",
                  marginBottom: "0.25rem",
                }}
              >
                {formatDate(profile?.memberSince).split(" ")[0]}
              </p>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "0.75rem",
                }}
              >
                Member Since
              </p>
            </div>
          </div>

          {/* Location */}
          <div style={{ marginTop: "1.5rem" }}>
            <p
              style={{
                color: "rgba(255, 255, 255, 0.6)",
                fontSize: "0.875rem",
              }}
            >
              <i
                className="fas fa-map-marker-alt"
                style={{ marginRight: "0.5rem" }}
              ></i>
              {profile?.location ||
                `${profile?.city || ""}, ${profile?.country || ""}`}
            </p>
          </div>

          {/* Change Password Button */}
          <button
            onClick={() => setShowPasswordModal(true)}
            style={{
              marginTop: "1.5rem",
              width: "100%",
              padding: "0.75rem 1rem",
              background: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#FFFFFF",
              fontSize: "0.875rem",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.target.style.background = "rgba(234, 131, 3, 0.15)";
              e.target.style.borderColor = "#EA8303";
              e.target.style.color = "#EA8303";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.05)";
              e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
              e.target.style.color = "#FFFFFF";
            }}
          >
            <i className="fas fa-key"></i>
            Change Password
          </button>
        </div>

        {/* Details Card */}
        <div
          className="animate-fadeInUp"
          style={{
            background: "#1E1E1E",
            borderRadius: "16px",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            padding: "2rem",
            animationDelay: "0.1s",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "2rem",
            }}
          >
            <h3
              style={{
                color: "#FFFFFF",
                fontSize: "1.25rem",
                fontWeight: "600",
                margin: 0,
              }}
            >
              Personal Information
            </h3>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                style={{
                  background:
                    "linear-gradient(135deg, #EA8303 0%, #D67803 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  padding: "0.6rem 1.25rem",
                  cursor: "pointer",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 15px rgba(234, 131, 3, 0.3)",
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow =
                    "0 6px 20px rgba(234, 131, 3, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 15px rgba(234, 131, 3, 0.3)";
                }}
              >
                <i className="fas fa-edit"></i>
                Edit Profile
              </button>
            ) : (
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  onClick={handleCancel}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    padding: "0.6rem 1.25rem",
                    cursor: "pointer",
                    fontWeight: "500",
                    transition: "all 0.2s ease",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    background:
                      "linear-gradient(135deg, #22C55E 0%, #16A34A 100%)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    padding: "0.6rem 1.25rem",
                    cursor: saving ? "not-allowed" : "pointer",
                    fontWeight: "500",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    opacity: saving ? 0.7 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Form Fields */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1.5rem",
            }}
          >
            {/* First Name */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                First Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.firstName || "-"}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Last Name
              </label>
              {editing ? (
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.lastName || "-"}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Email Address
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.email || "-"}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Phone Number
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phonenumber"
                  value={formData.phonenumber}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.phonenumber || "-"}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                City
              </label>
              {editing ? (
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.city || "-"}
                </p>
              )}
            </div>

            {/* Country */}
            <div>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Country
              </label>
              {editing ? (
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p style={{ color: "#FFFFFF", fontSize: "1rem", margin: 0 }}>
                  {profile?.country || "-"}
                </p>
              )}
            </div>

            {/* Bio - Full Width */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Bio
              </label>
              {editing ? (
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  style={{
                    width: "100%",
                    padding: "0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    resize: "vertical",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#EA8303";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255, 255, 255, 0.1)";
                  }}
                />
              ) : (
                <p
                  style={{
                    color: profile?.bio
                      ? "#FFFFFF"
                      : "rgba(255, 255, 255, 0.4)",
                    fontSize: "1rem",
                    margin: 0,
                    fontStyle: profile?.bio ? "normal" : "italic",
                  }}
                >
                  {profile?.bio || "No bio added yet"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="modal-animate-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => {
            setShowPasswordModal(false);
            setPasswordData({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setPasswordError("");
          }}
        >
          <div
            className="modal-animate-content"
            style={{
              background: "#1E1E1E",
              borderRadius: "16px",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              padding: "2rem",
              width: "100%",
              maxWidth: "420px",
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                style={{
                  color: "#FFFFFF",
                  fontSize: "1.25rem",
                  fontWeight: "600",
                  margin: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                }}
              >
                <i className="fas fa-key" style={{ color: "#EA8303" }}></i>
                Change Password
              </h3>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordError("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "1.25rem",
                  cursor: "pointer",
                  padding: "0.25rem",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => (e.target.style.color = "#FFFFFF")}
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255, 255, 255, 0.5)")
                }
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Error Message */}
            {passwordError && (
              <div
                style={{
                  padding: "0.75rem 1rem",
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#EF4444",
                  fontSize: "0.875rem",
                }}
              >
                <i
                  className="fas fa-exclamation-circle"
                  style={{ marginRight: "0.5rem" }}
                ></i>
                {passwordError}
              </div>
            )}

            {/* Current Password */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Current Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Enter current password"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#EA8303")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                >
                  <i
                    className={`fas ${
                      showCurrentPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            {/* New Password */}
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Enter new password (min 6 characters)"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#EA8303")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                >
                  <i
                    className={`fas ${
                      showNewPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "block",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "0.875rem",
                  marginBottom: "0.5rem",
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: "relative" }}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  placeholder="Confirm new password"
                  style={{
                    width: "100%",
                    padding: "0.75rem 2.5rem 0.75rem 1rem",
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#FFFFFF",
                    fontSize: "0.9rem",
                    outline: "none",
                    transition: "all 0.2s ease",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "#EA8303")}
                  onBlur={(e) =>
                    (e.target.style.borderColor = "rgba(255, 255, 255, 0.1)")
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "transparent",
                    border: "none",
                    color: "rgba(255, 255, 255, 0.5)",
                    cursor: "pointer",
                    padding: "0.25rem",
                  }}
                >
                  <i
                    className={`fas ${
                      showConfirmPassword ? "fa-eye-slash" : "fa-eye"
                    }`}
                  ></i>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordData({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                  setPasswordError("");
                }}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.15)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "rgba(255, 255, 255, 0.1)";
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  background:
                    "linear-gradient(135deg, #EA8303 0%, #D67803 100%)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "0.9rem",
                  fontWeight: "500",
                  cursor: changingPassword ? "not-allowed" : "pointer",
                  opacity: changingPassword ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "all 0.2s ease",
                  boxShadow: "0 4px 15px rgba(234, 131, 3, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!changingPassword) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow =
                      "0 6px 20px rgba(234, 131, 3, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow =
                    "0 4px 15px rgba(234, 131, 3, 0.3)";
                }}
              >
                {changingPassword ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Changing...
                  </>
                ) : (
                  <>
                    <i className="fas fa-check"></i>
                    Change Password
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for spinner animation */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @media (max-width: 900px) {
            .profile-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}
      </style>
    </div>
  );
};

export default Profile;
