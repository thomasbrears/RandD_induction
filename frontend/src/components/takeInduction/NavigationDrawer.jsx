import React from 'react';
import PropTypes from 'prop-types';

/**
 * Unified navigation drawer for both mobile and desktop
 * Displays list of questions with status indicators
 */
const NavigationDrawer = ({
  questions,
  currentIndex,
  onQuestionSelect,
  answeredQuestions,
  isDesktop,
  onClose
}) => {
  // Calculate progress stats
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answeredQuestions).length;
  const percentComplete = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
  
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">Questions</h2>
          {!isDesktop && (
            <button 
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-200"
              aria-label="Close navigation"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="text-sm text-gray-500 mt-1">
          {answeredCount} of {totalQuestions} completed ({percentComplete}%)
        </div>
      </div>
      
      {/* Scrollable questions list with fixed height */}
      <div className="overflow-y-auto flex-grow" style={{ maxHeight: isDesktop ? 'calc(100vh - 200px)' : 'calc(100vh - 150px)' }}>
        <div className="p-3 space-y-2">
          {questions.map((question, index) => {
            // Determine if the question is answered
            const isAnswered = !!answeredQuestions[question.id];
            
            // Determine button styles based on status
            const buttonClasses = 
              currentIndex === index 
                ? 'bg-blue-50 border-blue-300 shadow-sm'
                : isAnswered
                  ? 'bg-green-50 border-green-100'
                  : 'bg-white hover:bg-gray-50 border-gray-100';
                  
            return (
              <button
                key={question.id}
                onClick={() => onQuestionSelect(index)}
                className={`w-full text-left p-3 rounded-md flex items-start transition-colors border ${buttonClasses}`}
              >
                <span className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full mr-3 text-sm font-medium ${
                  currentIndex === index 
                    ? 'bg-blue-600 text-white'
                    : isAnswered
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-700'
                }`}>
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm line-clamp-2">
                    {question.question}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 flex items-center">
                    {question.type === 'INFORMATION' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        Info
                      </span>
                    ) : question.type === 'FILE_UPLOAD' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Upload
                      </span>
                    ) : question.type === 'SHORT_ANSWER' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        Text
                      </span>
                    ) : question.type === 'MULTICHOICE' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        Multiple Choice
                      </span>
                    ) : question.type === 'TRUE_FALSE' || question.type === 'YES_NO' ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {question.type === 'TRUE_FALSE' ? 'True/False' : 'Yes/No'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                    )}
                    
                    {/* Status indicator */}
                    {isAnswered && (
                      <svg className="w-4 h-4 text-green-600 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Footer with help text - desktop only */}
      {isDesktop && (
        <div className="p-4 border-t text-xs text-gray-500 bg-gray-50 mt-auto">
          <p>Click on any question to navigate directly to it. Completed questions are marked with a green checkmark.</p>
        </div>
      )}
    </div>
  );
};

// Helper function to get human-readable question type labels
function getQuestionTypeLabel(type) {
  const labels = {
    'TRUE_FALSE': 'True/False',
    'YES_NO': 'Yes/No',
    'MULTICHOICE': 'Multiple Choice',
    'DROPDOWN': 'Dropdown',
    'SHORT_ANSWER': 'Text Response',
    'INFORMATION': 'Information Block',
    'FILE_UPLOAD': 'File Upload'
  };
  
  return labels[type] || 'Question';
}

NavigationDrawer.propTypes = {
  questions: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onQuestionSelect: PropTypes.func.isRequired,
  answeredQuestions: PropTypes.object.isRequired,
  isDesktop: PropTypes.bool.isRequired,
  onClose: PropTypes.func
};

export default NavigationDrawer;