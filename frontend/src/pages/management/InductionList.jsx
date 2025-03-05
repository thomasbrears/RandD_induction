import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import InductionsTable from '../../components/InductionsTable';

const InductionList = () => {
  return (
    <>
      <Helmet><title>Manage Inductions | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="Manage Inductions" 
        subtext="View and manage all induction forms" 
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6 max-w-full overflow-hidden">
          <InductionsTable />
        </div>
      </div>
    </>
  );
};

export default InductionList;
