import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import UsersTable from '../../components/UsersTable';
import '../../style/Global.css';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';

const ViewUsers = () => {
  return (
    <>
      <Helmet><title>View & Manage Users | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="Manage Users" 
        subtext="View and manage all users" 
      />

      {/* Unified Layout - Always show side-by-side from 750px up */}
      <div className="flex flex-row px-4 md:px-0 bg-gray-50 relative">
        {/* Sidebar container - Always present but controlled by ManagementSidebar component */}
        <div className="relative z-10">
          <ManagementSidebar />
        </div>

        {/* Main content area - Always beside the sidebar from 750px up */}
        <div className="flex-grow p-4 lg:p-6 overflow-x-auto">
          <UsersTable />
        </div>
      </div>
    </>
  );
};

export default ViewUsers;