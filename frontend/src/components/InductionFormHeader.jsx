import React from 'react';
import { FaSave, FaCloudUploadAlt } from 'react-icons/fa';
import { CheckCircleOutlined, InfoCircleOutlined, CloudOutlined } from '@ant-design/icons';
import { Badge, Tooltip, Button } from 'antd';

/**
 * Header component for induction forms with auto-save status indicator
 * 
 * @param {Object} induction - The induction data object
 * @param {Function} handleSubmit - Handler for the submit button
 * @param {Function} handleSaveDraft - Handler for saving as draft (optional)
 * @param {Boolean} isCreatingInduction - Whether this is a new or existing induction
 * @param {Date|null} lastSaved - Timestamp of last auto-save
 * @param {Boolean} showAutoSave - Whether to show the auto-save indicator
 */
const InductionFormHeader = ({ 
  induction, 
  handleSubmit, 
  handleSaveDraft,
  isCreatingInduction, 
  lastSaved,
  showAutoSave = false 
}) => {
  const isDraft = induction.isDraft;

  return (
    <div className="bg-white shadow-md sticky top-0 z-10">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 mx-auto max-w-6xl ">
        {/* Display the Induction Name with Draft Badge */}
        <div className="flex-1 min-w-0 w-full max-w-full">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-semibold text-gray-800 truncate">
                {induction.name ? induction.name : 'New Module'}
              </h2>
              
              {isDraft && (
                <Badge 
                  count="DRAFT" 
                  style={{ backgroundColor: '#faad14' }} 
                  className="ml-2"
                />
              )}
            </div>
            
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

        {/* Save Buttons */}
        <div className="flex items-center space-x-4 sm:ml-6 mt-3 sm:mt-0">
          {/* Show Save as Draft button if handleSaveDraft is provided */}
          {handleSaveDraft && (
            <Tooltip title="Save as draft to the database - This makes the module available for others to view and edit. However cannot be assigned to users until published.">
              <Button
                type="default"
                onClick={handleSaveDraft}
                className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100 hover:border-yellow-400 px-4 py-2 rounded-md"
                icon={<FaCloudUploadAlt />}
              > Save as Draft
              </Button>
            </Tooltip>
          )}
          
          {/* Main Submit/Create/Publish Button */}
          <Button
            type="primary"
            onClick={handleSubmit}
            className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md"
            title={isDraft ? "Publish Module" : isCreatingInduction ? "Create Module" : "Save Module"}
          >
            {isDraft ? (
              // Publish Induction button for draft inductions
              <>
                <FaSave className="inline mr-2" /> Publish Module 
              </>
            ) : (
              // Save Induction button for existing inductions
              // Create Induction button for new inductions
              <>
                <FaSave className="inline mr-2" /> {isCreatingInduction ? "Create" : "Save"} Module
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InductionFormHeader;