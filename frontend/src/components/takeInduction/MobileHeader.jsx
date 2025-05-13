import React from 'react';
import PropTypes from 'prop-types';

/**
 * Mobile-specific header showing current question number and navigation controls
 */
const MobileHeader = ({ currentIndex, totalQuestions, onOpenDrawer }) => {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b md:hidden">
      <div className="flex items-center">
        <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white font-medium mr-2">
          {currentIndex + 1}
        </span>
        <span className="text-sm font-medium text-gray-600">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>
      
      <button
        onClick={onOpenDrawer}
        className="rounded-full p-2 bg-white shadow-sm border text-blue-600"
        aria-label="View all questions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      </button>
    </div>
  );
};

MobileHeader.propTypes = {
  currentIndex: PropTypes.number.isRequired,
  totalQuestions: PropTypes.number.isRequired,
  onOpenDrawer: PropTypes.func.isRequired,
};

export default MobileHeader;