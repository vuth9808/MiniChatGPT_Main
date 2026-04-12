import React from "react";

export default function ConfirmModal({ isOpen, title, message, onConfirm, onCancel, confirmText = "Delete", cancelText = "Cancel", isDanger = true }) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="modalBackdrop" onClick={onCancel} />

      {/* Modal */}
      <div className="confirmModal">
        <div className="modalContent">
          <h3 className="modalTitle">{title}</h3>
          <p className="modalMessage">{message}</p>

          <div className="modalActions">
            <button className="btn btnGhost" onClick={onCancel}>
              {cancelText}
            </button>
            <button 
              className={isDanger ? "btn btnDanger" : "btn btnPrimary"} 
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
