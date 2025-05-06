import React, { useState, useRef } from 'react';
import HelpGuides, { FloatingHelpButton } from './HelpGuides';

// Provider component to wrap the app
const FloatingHelpProvider = ({ children }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const buttonRef = useRef(null);
  
  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);

  return (
    <>
      {children}
      
      {/* Floating help button */}
      <div ref={buttonRef}>
        <FloatingHelpButton onClick={openHelp} />
      </div>
      
      {/* Help guides drawer */}
      <HelpGuides 
        isOpen={isHelpOpen} 
        onClose={closeHelp} 
        anchorEl={buttonRef.current}
      />
    </>
  );
};

export default FloatingHelpProvider;