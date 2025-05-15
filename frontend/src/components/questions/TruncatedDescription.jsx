import React, { useState, useRef, useEffect } from "react";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

/**
 * A component for displaying truncated HTML descriptions with a show more/less toggle
 * Optimized for mobile display
 * 
 * @param {Object} props
 * @param {string} props.description - HTML content to display
 * @param {number} props.maxLength - Character threshold for truncation (default: 300)
 * @param {number} props.maxHeight - Maximum height in pixels for collapsed state (default: 150)
 * @param {boolean} props.fullWidthButton - Whether the button should be full width (default: false)
 * @returns {JSX.Element}
 */
const TruncatedDescription = ({ 
  description, 
  maxLength = 300, 
  maxHeight = 150,
  fullWidthButton = false 
}) => {
  const [expanded, setExpanded] = useState(false);
  const [shouldTruncate, setShouldTruncate] = useState(false);
  const contentRef = useRef(null);
  const [plainTextLength, setPlainTextLength] = useState(0);

  // Calculate if truncation is needed
  useEffect(() => {
    if (description) {
      // Create temporary div to strip HTML tags and get plain text length
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = description;
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      setPlainTextLength(plainText.length);

      // Check if content exceeds height limitation when rendered
      if (contentRef.current) {
        const shouldTruncateByHeight = contentRef.current.scrollHeight > maxHeight;
        const shouldTruncateByLength = plainText.length > maxLength;
        setShouldTruncate(shouldTruncateByHeight || shouldTruncateByLength);
      }
    }
  }, [description, maxLength, maxHeight]);

  const toggleExpand = (e) => {
    // Stop the event from bubbling up to parent elements
    e.stopPropagation();
    
    // Prevent default behavior to ensure no form submission occurs
    e.preventDefault();
    
    // Set focus back to the button to prevent focus from moving to submit buttons
    e.currentTarget.focus();
    
    setExpanded(!expanded);
  };

  return (
    <div className="prose !max-w-none w-full break-words overflow-hidden">
      <div
        ref={contentRef}
        className={`prose !max-w-none w-full break-words transition-all duration-300 ${!expanded && shouldTruncate ? "line-clamp-4" : ""}`}
        style={{
          maxHeight: !expanded && shouldTruncate ? `${maxHeight}px` : "none",
          overflow: !expanded && shouldTruncate ? "hidden" : "visible",
        }}
        dangerouslySetInnerHTML={{ __html: description || "No description" }}
      />
      
      {/* Add gradient fade effect at the bottom when truncated */}
      {!expanded && shouldTruncate && (
        <div className="h-8 -mt-8 bg-gradient-to-t from-gray-100 to-transparent pointer-events-none"></div>
      )}

      {shouldTruncate && (
        <button
          type="button" // Explicitly set type to button to prevent form submission
          onClick={toggleExpand}
          onMouseDown={(e) => e.stopPropagation()} // Stop mousedown event too
          className={`mt-2 flex items-center ${fullWidthButton ? 'w-full justify-center' : 'justify-start'} 
            text-blue-600 hover:text-blue-800 text-sm font-medium bg-blue-50 hover:bg-blue-100 
            py-2 px-4 rounded transition-colors`}
        >
          {expanded ? (
            <>
              <span>Show less</span>
              <FaChevronUp className="ml-1" />
            </>
          ) : (
            <>
              <span>Show more</span>
              <FaChevronDown className="ml-1" />
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default TruncatedDescription;