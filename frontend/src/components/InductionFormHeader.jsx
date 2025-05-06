import React from 'react';
import { FaSave } from 'react-icons/fa';

const InductionFormHeader = ({ induction, handleSubmit, isCreatingInduction }) => {
  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 mx-auto max-w-6xl bg-gray-50">
        {/* Display the Induction Name */}
        <div className="flex-1 min-w-0 w-full max-w-full">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 truncate">
              {induction.name ? induction.name : 'New Induction'}
            </h2>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center space-x-4 sm:ml-6">
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

export default InductionFormHeader;