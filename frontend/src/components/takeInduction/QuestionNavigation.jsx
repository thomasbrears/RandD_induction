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
  onClose 
}) => {
  // State to track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if screen is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Run on mount and when window resizes
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Desktop sidebar navigation
  const DesktopNavigation = () => (
    <div className="hidden md:block md:w-1/4 bg-gray-50 p-4 border-r">
      <h2 className="text-lg font-medium mb-4">Questions</h2>
      <div className="space-y-2">
        {questions.map((question, index) => (
          <button
            key={question.id}
            onClick={() => onNavClick(index)}
            className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
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
              {question.question.length > 20 ? question.question.substring(0, 20) + '...' : question.question}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
  
  // Mobile navigation with side tab
  const MobileNavigation = () => {
    if (!isMobile) return null;
    
    // Ensure isOpen is a boolean
    const isMenuOpen = Boolean(isOpen);
    
    return (
      <>
        {/* Mobile Tab Toggle Button */}
        <div 
          className={`fixed left-0 top-1/3 z-50 transition-transform duration-300 ${isMenuOpen ? 'translate-x-64' : 'translate-x-0'}`}
        >
          <button 
            onClick={() => onClose(!isMenuOpen)}
            className="bg-black text-white flex flex-col items-center py-3 px-2 rounded-r-lg shadow-lg"
            aria-label={isMenuOpen ? "Close questions menu" : "Open questions menu"}
          >
            {/* Vertical text that says "Questions" */}
            <div className="text-xs font-medium" style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
              QUESTIONS
            </div>
            
            {/* Horizontal divider */}
            <div className="my-3 w-6 h-px bg-gray-400"></div>
            
            {/* Question count indicator - horizontal */}
            <div className="text-center">
              <span className="text-xs font-medium">{currentIndex + 1}/{questions.length}</span>
            </div>
          </button>
        </div>
        
        {/* Mobile Sidebar Panel */}
        <div 
          className={`fixed top-0 left-0 h-full bg-gray-100 z-40 transition-transform duration-300 ease-in-out shadow-xl ${
            isMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
          }`}
        >
          <div className="flex flex-col p-4 space-y-2 h-full overflow-y-auto">
            {/* Sidebar Title with Question Counter */}
            <div className="border-b border-gray-200 pb-2 mb-2">
              <h2 className="font-bold text-lg text-blue-600 flex items-center justify-between">
                <span>Questions</span>
                <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                  {Object.values(answeredQuestions).filter(Boolean).length} / {questions.length}
                </span>
              </h2>
            </div>
            
            {/* Question list */}
            {questions.map((question, index) => {
              const isActive = index === currentIndex;
              const isAnswered = answeredQuestions[question.id];
              
              return (
                <button
                  key={question.id}
                  onClick={() => {
                    onNavClick(index);
                    onClose(false);  // Close after selection
                  }}
                  className={`flex items-center py-2 px-2 rounded-md w-full text-left ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600 border-l-4 border-blue-600' 
                      : isAnswered
                        ? 'bg-green-50 text-green-700 border-l-4 border-green-300'
                        : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm ${
                    isActive 
                      ? 'bg-blue-500 text-white'
                      : isAnswered
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-700'
                  }`}>
                    {index + 1}
                  </span>
                  <span className="truncate text-sm">
                    {question.question.length > 30 ? question.question.substring(0, 30) + '...' : question.question}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Overlay to darken the rest of the screen when sidebar is open */}
        {isMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-60 z-30"
            onClick={() => onClose(false)}
          />
        )}
      </>
    );
  };
  
  return (
    <>
      <DesktopNavigation />
      <MobileNavigation />
    </>
  );
};

QuestionNavigation.propTypes = {
  questions: PropTypes.array.isRequired,
  currentIndex: PropTypes.number.isRequired,
  onNavClick: PropTypes.func.isRequired,
  answeredQuestions: PropTypes.object.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default QuestionNavigation;