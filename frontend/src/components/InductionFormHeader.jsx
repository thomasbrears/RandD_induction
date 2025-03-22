import React, { useState, useEffect } from 'react';
import { FaEdit, FaSave, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Input, Button } from 'antd';
import ConfirmationModal from './ConfirmationModal';
import { Trash } from "lucide-react";

const InductionForm = ({ induction, setInduction, handleSubmit, isCreatingInduction, saveAllFields, updateFieldsBeingEdited, onDeleteInduction }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localInductionName, setLocalInductionName] = useState(induction.name || '');
  const [validationErrors, setValidationErrors] = useState({});
  const [confirmAction, setConfirmAction] = useState(false);
  const [actionType, setActionType] = useState(null);

  const toggleEditName = () => setIsEditingName((prev) => !prev);

  useEffect(() => {
    if (saveAllFields && isEditingName) {
      handleUpdateName();
      setIsEditingName(false);
    }
    if (isEditingName) {
      updateFieldsBeingEdited("induction_header", "inductionName");
    } else {
      updateFieldsBeingEdited("induction_header", null);
    }
  }, [saveAllFields, isEditingName]);

  const handleCancel = () => {
    setLocalInductionName(induction.name);
    setIsEditingName(false);
  };

  const handleLocalChange = (e) => {
    setLocalInductionName(e.target.value);
  };

  const handleUpdateName = () => {
    setInduction({ ...induction, name: localInductionName.trim() });
    setIsEditingName(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!induction.name || induction.name.trim() === "") {
      errors.inductionName = "Induction must have a name";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    setValidationErrors({});
    validateForm();

  }, [induction]);

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

      <div className="flex flex-col sm:flex-row items-start justify-between p-4 mx-auto max-w-6xl bg-gray-50">
        <div className="flex-1 min-w-0 w-full mb-4 sm:mb-0 max-w-full">
          {/* Induction Name Section */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-gray-700 flex items-center">
              Induction Name:
              {!isEditingName ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleEditName}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                    title="Edit Induction Name"
                  >
                    <FaEdit />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => handleUpdateName()}
                    className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                    title="Save Changes"
                  >
                    <FaCheck className="inline mr-2" /> Update
                  </Button>
                  {/* Cancel Button */}
                  <Button
                    onClick={() => handleCancel()}
                    className="bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center h-8"
                    title="Discard Changes"
                  >
                    <FaTimes className="mr-1 w-4 h-4" /> Cancel
                  </Button>
                </div>
              )}
            </label>

            {validationErrors.inductionName && (
              <p className="text-red-500 text-sm">{validationErrors.inductionName}</p>
            )}
            {isEditingName ? (
              <Input.TextArea
                id="name"
                name="name"
                value={localInductionName}
                onChange={handleLocalChange}
                placeholder="Enter Induction Name"
                className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
                autoSize={{ minRows: 1, maxRows: 3 }}
                maxLength={100}
                showCount={true}
              />
            ) : (
              <div className="w-full text-xl font-semibold break-words overflow-hidden">
                {induction.name || "Untitled Induction"}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:ml-6 sm:mt-0 mt-4">
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
              <FaSave className="inline mr-2" /> Delete Induction
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default InductionForm;
