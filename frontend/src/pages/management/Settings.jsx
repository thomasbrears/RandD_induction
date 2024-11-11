import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';

const settings = () => {
  return (
    <>
      <Helmet><title>System Settings | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="System Settings" 
        subtext="Manage the Induction Portal" 
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <p>System settings will be displayed here (Admin access only)</p>
        </div>
      </div>
    </>
  );
};

export default settings;
