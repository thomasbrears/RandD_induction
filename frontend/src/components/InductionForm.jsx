import React, { useState } from 'react';
import { FaEdit, FaSave, FaCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const InductionForm = ({ induction, setInduction, handleSubmit, isSubmitDisabled , isCreatingInduction}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDepartment, setIsEditingDepartment] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const toggleEditName = () => setIsEditingName((prev) => !prev);
  const toggleEditDepartment = () => setIsEditingDepartment((prev) => !prev);
  const toggleEditDescription = () => setIsEditingDescription((prev) => !prev);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInduction({
      ...induction,
      [name]: value,
    });
  };

  const handleDepartmentChange = (e) => {
    setInduction({
      ...induction,
      department: e.target.value,
    });
  };

  const handleDescriptionChange = (e) => {
    setInduction({
      ...induction,
      description: e.target.value,
    });
  };

  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row items-start justify-between p-4 mx-auto max-w-6xl">
        <div className="flex-1 mb-4 sm:mb-0yy">
          {/* Induction Name Section */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-bold text-gray-700 flex items-center">
              Induction Name:
              {!isEditingName ? (
                <button
                  type="button"
                  onClick={toggleEditName}
                  className="ml-2 text-gray-600 hover:text-gray-800"
                  title="Edit induction name"
                >
                  <FaEdit />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={toggleEditName}
                  className="bg-gray-800 font-normal text-white px-3 py-1 rounded-md text-sm ml-2 flex items-center"
                >
                  <FaCheck className="inline mr-2" /> Update
                </button>
              )}
            </label>
            {isEditingName ? (
              <input
                type="text"
                id="name"
                name="name"
                value={induction.name}
                onChange={handleChange}
                placeholder="Enter induction name"
                className="w-full border border-gray-300 rounded-lg p-2 text-base focus:ring-gray-800 focus:border-gray-800"
              />
            ) : (
              <h1 className="text-xl font-semibold">{induction.name || "Untitled Induction"}</h1>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4 sm:ml-6 sm:mt-0 mt-4">
          <button
            type="button"
            onClick={handleSubmit}
            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
            disabled={isSubmitDisabled}
          >
            <FaSave className="inline mr-2" /> {isCreatingInduction ? "Create": "Save"} Induction
          </button>
        </div>
      </div>
    </div>
  );
};

export default InductionForm;
