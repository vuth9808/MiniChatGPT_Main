import toast from "react-hot-toast";

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showSuccess = (message, duration = 3000) => {
  toast.success(message, {
    duration,
    style: {
      background: "#10b981",
      color: "#fff",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
    },
  });
};

/**
 * Show error toast
 * @param {string} message - Error message
 * @param {number} duration - Duration in ms (default: 4000)
 */
export const showError = (message, duration = 4000) => {
  toast.error(message, {
    duration,
    style: {
      background: "#ef4444",
      color: "#fff",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
    },
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showInfo = (message, duration = 3000) => {
  toast(message, {
    duration,
    style: {
      background: "#3b82f6",
      color: "#fff",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
    },
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {number} duration - Duration in ms (default: 3000)
 */
export const showWarning = (message, duration = 3000) => {
  toast(message, {
    duration,
    style: {
      background: "#f59e0b",
      color: "#fff",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
    },
  });
};

/**
 * Show loading toast (returns toast id for later removal)
 * @param {string} message - Loading message
 */
export const showLoading = (message) => {
  return toast.loading(message, {
    style: {
      background: "#6366f1",
      color: "#fff",
      borderRadius: "8px",
      padding: "16px",
      fontSize: "14px",
    },
  });
};

/**
 * Remove a toast by id
 * @param {string} id - Toast id from showLoading
 */
export const dismissToast = (id) => {
  toast.dismiss(id);
};

/**
 * Replace a loading toast with success/error
 * @param {string} id - Toast id
 * @param {string} message - New message
 * @param {string} type - "success" or "error"
 */
export const updateToast = (id, message, type = "success") => {
  toast.dismiss(id);
  if (type === "success") {
    showSuccess(message);
  } else {
    showError(message);
  }
};
