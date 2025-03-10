import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';

const InductionResults = () => {
  return (
    <>
      <Helmet><title>Induction Results | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="Induction Results" 
        subtext="View the results of completed inductions" 
      />
     
      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <p>Results will be displayed here</p>
        </div>
      </div>
    </>
  );
};

export default InductionResults;
