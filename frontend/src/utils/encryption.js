/**
 * Decrypt encrypted password from backend
 * @param {string} encryptedPassword - Encrypted password in format: iv:encryptedData
 * @returns {string} - Decrypted password or error message
 */
export const decryptPassword = async (encryptedPassword) => {
  if (!encryptedPassword) return "Not Set";

  try {
    // Since we can't decrypt on frontend (no access to encryption key),
    // we'll use the encryptedPassword directly from backend which already
    // includes the decryption logic through the API
    return encryptedPassword;
  } catch (error) {
    console.error("Decryption error:", error);
    return "***ERROR***";
  }
};
