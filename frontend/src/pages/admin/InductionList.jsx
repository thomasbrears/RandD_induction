import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';

const InductionList = () => {
  return (
    <>
      <Helmet><title>Manage Inductions | AUT Events Induction Portal</title></Helmet>
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
