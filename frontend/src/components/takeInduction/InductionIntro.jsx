import React from 'react';
import PropTypes from 'prop-types';
import { calculateEstimatedTime, formatTimeRange } from '../../utils/inductionHelpers';
import TruncatedDescription from '../questions/TruncatedDescription';

/**
 * Component for displaying the induction introduction screen
 */
const InductionIntro = ({ induction, onStart }) => {
  const estimatedTimeRange = formatTimeRange(calculateEstimatedTime(induction?.questions));
  
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 break-words">{induction.name}</h1>
      
      <div className="mb-6 space-y-4">
        <div className="p-4 bg-gray-50 rounded-md">
          <TruncatedDescription 
            description={induction.description} 
            maxLength={500}
            maxHeight={500}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-md">
            <span className="block text-sm font-medium text-gray-600">Question Count</span>
            <span className="text-lg font-semibold">{induction.questions?.length || 0} questions</span>
          </div>
          
          <div className="bg-green-50 p-4 rounded-md">
            <span className="block text-sm font-medium text-gray-600">Estimated Time</span>
            <span className="text-lg font-semibold">{estimatedTimeRange}</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={onStart}
        className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
      >
        Start Induction
      </button>
    </div>
  );
};

InductionIntro.propTypes = {
  induction: PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    questions: PropTypes.array
  }).isRequired,
  onStart: PropTypes.func.isRequired
};

export default InductionIntro;