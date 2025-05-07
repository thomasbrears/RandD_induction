import React from 'react';
import { FaSave } from 'react-icons/fa';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Header component for induction forms with auto-save status indicator
 * 
 * @param {Object} induction - The induction data object
 * @param {Function} handleSubmit - Handler for the submit button
 * @param {Boolean} isCreatingInduction - Whether this is a new or existing induction
 * @param {Date|null} lastSaved - Timestamp of last auto-save
 * @param {Boolean} showAutoSave - Whether to show the auto-save indicator
 */
const InductionFormHeader = ({ 
  induction, 
  handleSubmit, 
  isCreatingInduction, 
  lastSaved,
  showAutoSave = false 
}) => {
  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 mx-auto max-w-6xl bg-gray-50">
        {/* Display the Induction Name */}
        <div className="flex-1 min-w-0 w-full max-w-full">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-gray-800 truncate">
              {induction.name ? induction.name : 'New Induction'}
            </h2>
            
            {/* Auto-save status */}
            {showAutoSave && lastSaved && (
              <div className="flex items-center">
                <span className="text-xs text-gray-500 flex items-center">
                  <CheckCircleOutlined className="text-green-500 mr-1" style={{ fontSize: '12px' }} />
                  <span>Auto-saved locally at {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
                
                {/* Info icon with tooltip */}
                <div className="relative inline-block group ml-1">
                  <InfoCircleOutlined className="text-gray-400 text-xs ml-1 cursor-help" />
                  <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                    Draft is saved to this browser on this device only. It will be lost if you clear your browser data or switch devices. Submit to permanently save changes.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center space-x-4 sm:ml-6 mt-3 sm:mt-0">
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