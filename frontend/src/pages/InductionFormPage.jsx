import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams } from 'react-router-dom';
import { InductionProvider, useInduction } from '../components/takeInduction/InductionContext';
import InductionController from '../components/takeInduction/InductionController';

/**
 * Inner component that has access to the induction context
 * This allows us to access the induction name for the title
 */
const InductionContent = ({ inductionId }) => {
  const { state } = useInduction();
  const { induction } = state;
  const [pageTitle, setPageTitle] = useState('Take a module | AUT Events Induction Portal');
  
  // Update the page title when the induction data is loaded
  useEffect(() => {
    if (induction && induction.name) {
      setPageTitle(`${induction.name} | AUT Events Induction Portal`);
    }
  }, [induction]);
  
  return (
    <>
      <Helmet><title>{pageTitle}</title></Helmet>
      <InductionController inductionId={inductionId} />
    </>
  );
};

/**
 * Main entry point for the induction taking experience
 */
const InductionFormPage = () => {
  const [searchParams] = useSearchParams();
  
  // Support both assignmentID (preferred) and id (legacy) parameters
  const assignmentID = searchParams.get('assignmentID');
  const id = searchParams.get('id');
  const idParam = assignmentID || id; // Use whichever is available
  
  return (
    <InductionProvider>
      <InductionContent inductionId={idParam} />
    </InductionProvider>
  );
};

export default InductionFormPage;