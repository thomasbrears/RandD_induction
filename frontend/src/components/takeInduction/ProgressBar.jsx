import React from 'react';
import PropTypes from 'prop-types';


const ProgressBar = ({ questions, answeredQuestions, lastSaved }) => {
  if (!questions || questions.length === 0) return null;

  // Calculate progress
  // Filter out 'INFORMATION' sections/questions for progress calculation
  const totalQuestions = questions.filter(q => q.type !== 'INFORMATION').length;
  const answeredCount = Object.keys(answeredQuestions || {}).filter(id => {
    const question = questions.find(q => q.id === id);
    return question && question.type !== 'INFORMATION';
  }).length;
  
  const percentComplete = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
  
  // Format last saved time
  const getLastSavedText = () => {
    if (!lastSaved) return null;
    
    // For recent saves (< 1 minute ago), show "Just now"
    const diffMs = new Date() - lastSaved;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else {
      return lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };
  
  const lastSavedText = getLastSavedText();
  
  return (
    <div className="px-4 py-2 bg-white">
      {/* Progress info and saved status */}
      <div className="flex flex-wrap items-center justify-between mb-1">
        <div className="flex items-center mr-4">
          <span className="text-sm font-medium text-gray-700">
            Progress: <span className="text-blue-600">{percentComplete}%</span>
          </span>
          <span className="mx-2 text-gray-300 hidden sm:inline">|</span>
          <span className="hidden sm:block text-sm text-gray-500">
            {answeredCount} of {totalQuestions} questions
          </span>
        </div>
        
        {lastSavedText && (
          <div className="flex items-center text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-green-500 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>Saved {lastSavedText}</span>
            
            {/* Info tooltip */}
            <div className="relative group ml-1">
              <svg className="w-3.5 h-3.5 text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div className="absolute bottom-full right-0 mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded p-2 w-48 z-10">
                Progress is saved automatically to this browser session. You can continue later from this device and browser only. (File uploads are not saved)
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-in-out" 
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
  lastSaved: PropTypes.instanceOf(Date)
};

export default ProgressBar;