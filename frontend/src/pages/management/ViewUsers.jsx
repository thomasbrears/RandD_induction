import React from 'react';
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

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <UsersTable />
        </div>
      </div>
    </>
  );
};

export default ViewUsers;
