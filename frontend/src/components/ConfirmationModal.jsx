import React from 'react';

const ConfirmationModal = ({ isOpen, message, subtext, onCancel, onConfirm, actionLabel, confirmLabel, cancelLabel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md z-60">
        <h2 className="text-xl">{message}</h2>
        {subtext && <p className="text-gray-600 mt-2">{subtext}</p>}
        <div className="mt-4 flex justify-between">
          <button
            className="text-white bg-gray-700 hover:bg-gray-900 px-3 py-2 rounded-md"
            onClick={onCancel}
          >
            {cancelLabel || "Cancel"}
          </button>
          <button
            className="text-white bg-red-600 hover:bg-red-900 px-3 py-2 rounded-md"
            onClick={onConfirm}
          >
            {confirmLabel || actionLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;