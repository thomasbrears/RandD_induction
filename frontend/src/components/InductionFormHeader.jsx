import React, { useState, useEffect } from 'react';
import { FaSave } from 'react-icons/fa';
import { Input } from 'antd';
import ConfirmationModal from './ConfirmationModal';
import { Trash } from "lucide-react";

const InductionForm = ({ induction, setInduction, handleSubmit, isCreatingInduction, onDeleteInduction }) => {
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(false);
  const [actionType, setActionType] = useState(null);

  const handleInductionNameChange = (e) => {
    setInduction({ ...induction, name: e.target.value });
  };

  const validateForm = () => {
    const errors = {};

    if (typeof induction.name !== "string" || induction.name.trim() === "") {
      errors.inductionName = "Induction must have a name";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    setValidationErrors({});
    validateForm();

  }, [induction.name]);

  //Button
  const handleConfirmDelete = () => {
    setActionType('delete');
    setConfirmAction(true);
  };

  const cancelActionHandler = () => {
    setConfirmAction(false);
  };

  const confirmActionHandler = () => {
    if (actionType === 'delete') {
      onDeleteInduction();
    }
    setConfirmAction(false);
  };

  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <ConfirmationModal
        isOpen={confirmAction}
        message="Are you sure you want to delete this Induction?"
        subtext="This action cannot be undone."
        onCancel={cancelActionHandler}
        onConfirm={confirmActionHandler}
        actionLabel="Yes, Delete Induction"
        cancelLabel="Cancel"
      />

      <div className="flex flex-col sm:flex-row items-center justify-between p-4 mx-auto max-w-6xl bg-gray-50">
        {/* Induction Name Section */}
        <div className="flex-1 min-w-0 w-full max-w-full">
          <div className="space-y-2 mb-4">
            <label htmlFor="name" className="text-base font-semibold flex items-center">
              Induction Name:
            </label>
            {validationErrors.inductionName && (
              <p className="text-red-500 text-sm">{validationErrors.inductionName}</p>
            )}
            <Input.TextArea
              id="name"
              name="name"
              value={induction.name}
              onChange={handleInductionNameChange}
              placeholder="Enter Induction Name"
              className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
              autoSize={{ minRows: 1, maxRows: 3 }}
              maxLength={100}
              showCount={true}
            />
          </div>
        </div>

        {/* Button Group*/}
        <div className="flex items-center space-x-4 sm:ml-6">
          <button
            type="button"
            onClick={handleSubmit}
            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
            title="Save Induction"
          >
            <FaSave className="inline mr-2" /> {isCreatingInduction ? "Create" : "Save"} Induction
          </button>
          {!isCreatingInduction && (
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="text-white bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md"
              title="Delete Induction"
            >
              <Trash className="inline mr-2" /> Delete Induction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InductionForm;
