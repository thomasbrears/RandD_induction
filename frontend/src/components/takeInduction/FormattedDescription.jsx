import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * FormattedDescription - Component to properly display description content
 * Handles long content with proper line wrapping and expandable sections
 */
const FormattedDescription = ({ description, initiallyExpanded = false, maxCollapsedHeight = 120 }) => {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  
  // Check if content is long enough to need expansion
  const isLongContent = description && description.length > 300;
  
  if (!description) {
    return null;
  }
  
  return (
    <div className="mt-3">
      <div className="prose prose-sm max-w-none break-words">
        {isLongContent && !expanded ? (
          <>
            <div 
              className="relative overflow-hidden" 
              style={{ maxHeight: `${maxCollapsedHeight}px` }}
            >
              <div 
                className="break-words whitespace-normal overflow-wrap-anywhere" 
                dangerouslySetInnerHTML={{ __html: description }} 
              />
              <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
            </div>
            <button
              onClick={() => setExpanded(true)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
            >
              Show more
            </button>
          </>
        ) : (
          <>
            <div 
              className="break-words whitespace-normal overflow-wrap-anywhere"
              dangerouslySetInnerHTML={{ __html: description }} 
            />
            {isLongContent && expanded && (
              <button
                onClick={() => setExpanded(false)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1"
              >
                Show less
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

FormattedDescription.propTypes = {
  description: PropTypes.string,
  initiallyExpanded: PropTypes.bool,
  maxCollapsedHeight: PropTypes.number
};

export default FormattedDescription;