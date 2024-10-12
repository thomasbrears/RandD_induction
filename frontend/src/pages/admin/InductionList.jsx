import React from 'react';
import PageHeader from '../../components/PageHeader';

const InductionList = () => {
  return (
    <>
      <PageHeader 
        title="Manage Inductions" 
        subtext="View and manage all induction forms" 
      />
      <div className="p-6">
        <p>Only admins can access this page.</p>
      </div>
    </>
  );
};

export default InductionList;
