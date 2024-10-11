import React from 'react';
import PageHeader from '../../components/PageHeader';

const InductionResults = () => {
  return (
    <>
      <PageHeader 
        title="Induction Results" 
        subtext="View the results of completed inductions" 
      />
      <div className="p-6">
        <p>Only admins can access this page.</p>
      </div>
    </>
  );
};

export default InductionResults;
