import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Component for navigating between questions, with both desktop and mobile views
 */
const QuestionNavigation = ({ 
  questions, 
  currentIndex, 
  onNavClick, 
  answeredQuestions,
  isOpen,
  onClose,
  isReviewMode,  // new prop to manage review mode
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const DesktopNavigation = () => (
    <div className="hidden md:flex md:flex-col md:w-72 lg:w-80 bg-gray-50 border-r h-[calc(100vh-16rem)]">
      <div className="p-4 border-b bg-white flex-shrink-0">
        <h2 className="text-lg font-medium">Questions</h2>
        <div className="text-sm text-gray-500 mt-1">
          {Object.values(answeredQuestions).filter(Boolean).length} of {questions.length} completed
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => onNavClick(index)}
            disabled={isReviewMode}  // Disable navigation in review mode
            className={`w-full text-left px-3 py-2 rounded-md flex items-center transition-colors ${
              currentIndex === index 
                ? 'bg-blue-100 text-blue-800 border border-blue-300'
                : answeredQuestions[question.id]
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm ${
              currentIndex === index 
                ? 'bg-blue-500 text-white'
                : answeredQuestions[question.id]
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-700'
            }`}>
              {index + 1}
            </span>
            <span className="truncate">
              {question.question.length > 30 ? question.question.substring(0, 30) + '...' : question.question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return isMobile ? (
    <div className="md:hidden bg-white p-4 shadow-md fixed bottom-0 left-0 right-0">
      <div className="flex justify-between items-center">
        <button
          onClick={onClose}
          className="px-3 py-2 bg-gray-200 rounded-md"
        >
          Close
        </button>
      </div>
    </div>
  ) : (
    <DesktopNavigation />
  );
};

QuestionNavigation.propTypes = {
  questions: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onNavClick: PropTypes.func.isRequired,
  answeredQuestions: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  isReviewMode: PropTypes.bool.isRequired,  // Prop to check review mode
};

export default QuestionNavigation;
