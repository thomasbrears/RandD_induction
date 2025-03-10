import React, { useState } from 'react';
import { FaEdit, FaSave, FaCheck, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { Input, Button } from 'antd';

const InductionForm = ({ induction, setInduction, handleSubmit, isCreatingInduction }) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [localInductionName, setLocalInductionName] = useState(induction.name || '');

  const toggleEditName = () => setIsEditingName((prev) => !prev);

  const handleCancel = () => {
    setLocalInductionName(induction.name);
    setIsEditingName(false);
  };

  const handleLocalChange = (e) => {
    setLocalInductionName(e.target.value);
  };

  const handleUpdateName = () => {
    setInduction({ ...induction, name: localInductionName });
    setIsEditingName(false);
  };

  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row items-start justify-between p-4 mx-auto max-w-6xl bg-gray-50">
        <div className="flex-1 w-full mb-4 sm:mb-0yy max-w-full">
          {/* Induction Name Section */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-gray-700 flex items-center">
              Induction Name:
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={toggleEditName}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                  title="Edit Induction Name"
                >
                  <FaEdit />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={()=> handleUpdateName()}
                    className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                    title="Save Changes"
                  >
                    <FaCheck className="inline mr-2" /> Update
                  </button>
                  {/* Cancel Button */}
                  <button
                    onClick={() => handleCancel()}
                    className="bg-red-500 text-white px-2 py-1 rounded-md text-sm flex items-center h-8"
                    title="Discard Changes"
                  >
                    <FaTimes className="mr-1 w-4 h-4" /> Cancel
                  </button>
                </div>
              )}
            </label>
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
        </div>
      </div>
    </div>
  );
};

export default InductionForm;
