import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import HelpGuides, { FloatingHelpButton } from './HelpGuides';

// Provider component to wrap the app
const FloatingHelpProvider = ({ children }) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [shouldShowHelp, setShouldShowHelp] = useState(true);
  const buttonRef = useRef(null);
  const location = useLocation();
  
  // Check if we're on the induction taking page
  useEffect(() => {
    // Disable the floating help button on induction taking pages
    const isInductionTakingPage = location.pathname.includes('/induction/take');
    setShouldShowHelp(!isInductionTakingPage);
  }, [location.pathname]);
  
  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);

  return (
    <>
      {children}
      
      {/* Only show the floating help button if not on the induction taking page */}
      {shouldShowHelp && (
        <div ref={buttonRef}>
          <FloatingHelpButton onClick={openHelp} />
        </div>
      )}
      
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