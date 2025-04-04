import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import ResultsHub from '../../components/management/ResultsHub';

const ResultsPage = () => {
  return (
    <>
      <Helmet><title>Results Hub | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="Induction Results" 
        subtext="View and analyse induction completion results" 
      />
     
      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <ResultsHub />
        </div>
      </div>
    </>
  );
};

export default ResultsPage;