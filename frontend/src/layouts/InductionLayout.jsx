import React, { useState } from 'react';
import PropTypes from 'prop-types';
import MobileHeader from '../components/takeInduction/MobileHeader';
import NavigationDrawer from '../components/takeInduction/NavigationDrawer';
import ProgressBar from '../components/takeInduction/ProgressBar';

/**
 * Mobile-first responsive layout for induction
 * Handles layout switching between mobile and desktop views
 */
const InductionLayout = ({
  induction,
  children,
  currentQuestionIndex,
  answeredQuestions,
  lastSaved,
  isMobile,
  onNavigate,
  isSubmissionScreen
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const toggleDrawer = () => {
    setDrawerOpen(prev => !prev);
  };
  
  // Close drawer when a question is selected on mobile
  const handleQuestionSelect = (index) => {
    onNavigate(index);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Title and progress bar - visible on all screens */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold truncate">{induction?.name}</h1>
          </div>
        
        {/* Progress bar */}
        <ProgressBar 
          questions={induction?.questions || []}
          answeredQuestions={answeredQuestions}
          lastSaved={lastSaved}
        />
        
        {/* Mobile only - current question indicator */}
        {isMobile && induction?.questions && !isSubmissionScreen && (
          <MobileHeader 
            currentIndex={currentQuestionIndex}
            totalQuestions={induction.questions.length}
            onOpenDrawer={toggleDrawer}
          />
        )}
      </div>
      
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar (hidden on mobile) */}
        {!isMobile && induction?.questions && (
          <div className="hidden md:block w-72 lg:w-80 flex-shrink-0 bg-gray-50 border-r border-gray-200">
            <NavigationDrawer
              questions={induction.questions}
              currentIndex={currentQuestionIndex}
              onQuestionSelect={handleQuestionSelect}
              answeredQuestions={answeredQuestions}
              isDesktop={true}
            />
          </div>
        )}
        
        {/* Mobile drawer*/}
        {isMobile && drawerOpen && (
          <div className="fixed inset-0 z-40 bg-black bg-opacity-50" onClick={toggleDrawer}>
            <div 
              className="absolute top-0 left-0 h-full w-3/4 max-w-xs bg-white shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <NavigationDrawer
                questions={induction?.questions || []}
                currentIndex={currentQuestionIndex}
                onQuestionSelect={handleQuestionSelect}
                answeredQuestions={answeredQuestions}
                isDesktop={false}
                onClose={toggleDrawer}
              />
            </div>
          </div>
        )}
        
        {/* Main content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-6 pb-24 md:pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

InductionLayout.propTypes = {
  induction: PropTypes.object,
  children: PropTypes.node.isRequired,
  currentQuestionIndex: PropTypes.number,
  answeredQuestions: PropTypes.object,
  lastSaved: PropTypes.instanceOf(Date),
  isMobile: PropTypes.bool.isRequired,
  onNavigate: PropTypes.func.isRequired,
  isSubmissionScreen: PropTypes.bool
};

export default InductionLayout;