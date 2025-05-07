import React from 'react';
import PropTypes from 'prop-types';
import { getProgressSummary } from '../../utils/inductionHelpers';
import { CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

/**
 * Component for displaying induction progress bar
 */
const ProgressBar = ({ 
  questions, 
  answeredQuestions, 
  lastSaved,
  className = "" 
}) => {
  if (!questions || questions.length === 0) return null;

  // Calculate progress using getProgressSummary which returns percentComplete
  const { percentComplete } = getProgressSummary(questions, answeredQuestions);
  
  return (
    <div className={`bg-white border-b border-gray-200 py-2 px-4 ${className}`}>
      {/* Progress section with count and stats */}
      <div className="flex flex-wrap items-center justify-between mb-1">
        <div className="flex items-center mr-4">
          {percentComplete > 0 && (
            <span className="text-sm font-medium text-blue-600">{percentComplete}% complete</span>
          )}
        </div>
        
        <div className="flex items-center">          
          {/* Auto-save status */}
          {lastSaved && (
            <div className="flex items-center">
              <span className="text-xs text-gray-500 flex items-center">
                <CheckCircleOutlined className="text-green-500 mr-1" style={{ fontSize: '12px' }} />
                <span>Saved locally at {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
              
              {/* Info icon with tooltip */}
              <div className="relative inline-block group ml-1">
                <InfoCircleOutlined className="text-gray-400 text-xs ml-1 cursor-help" />
                <div className="absolute bottom-full right-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                  Progress is saved to this browser on this device only. It will be lost if you clear your browser data or switch devices.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${percentComplete}%` }}
          role="progressbar"
          aria-valuenow={percentComplete}
          aria-valuemin="0"
          aria-valuemax="100"
          aria-label={`${percentComplete}% complete`}
        ></div>
      </div>
    </div>
  );
};

ProgressBar.propTypes = {
  questions: PropTypes.array.isRequired,
  answeredQuestions: PropTypes.object.isRequired,
  lastSaved: PropTypes.instanceOf(Date),
  className: PropTypes.string
};

export default ProgressBar;