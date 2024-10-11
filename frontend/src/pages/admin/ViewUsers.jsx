import React from 'react';
import UsersTable from '../../components/UsersTable';
import '../../style/Global.css'
import PageHeader from '../../components/PageHeader';

const ViewUsers = () => {
  return (
    <>
      <PageHeader 
        title="Manage Users" 
        subtext="View and manage all users" 
      />
      <div className="p-6">
        <UsersTable />
      </div>
    </>
  );
};

export default ViewUsers;