import React from 'react';
import PropTypes from 'prop-types';
import QuestionTypes from '../../models/QuestionTypes';
import { getProgressSummary } from '../../utils/inductionHelpers';

/**
 * Component for displaying induction progress
 */
const ProgressBar = ({ questions, answeredQuestions, lastSaved }) => {
  if (!questions || questions.length === 0) return null;

  const { percentComplete } = getProgressSummary(questions, answeredQuestions);
  
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500">Progress</span>
        <span className="text-xs font-semibold text-gray-500">{percentComplete}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-gray-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${percentComplete}%` }}
        ></div>
      </div>
      
      {/* Last saved indicator */}
      {lastSaved && (
        <div className="mt-1 flex items-center">
          <span className="text-xs text-gray-500">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span>
            <div className="relative inline-block group">
              <span>Saved locally</span>
              <div className="absolute bottom-full left-0 mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                Progress is saved to this browser on this device only. It will be lost if you clear your browser data or switch devices.
              </div>
            </div>
            <span className="text-gray-400 ml-1">
              {new Date(lastSaved).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

ProgressBar.propTypes = {
  questions: PropTypes.array.isRequired,
  answeredQuestions: PropTypes.object.isRequired,
  lastSaved: PropTypes.instanceOf(Date)
};

export default ProgressBar;