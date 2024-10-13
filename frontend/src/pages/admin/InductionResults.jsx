import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';

const InductionResults = () => {
  return (
    <>
      <Helmet><title>Induction Results | AUT Events Induction Portal</title></Helmet>
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
