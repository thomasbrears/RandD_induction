import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import UsersTable from '../../components/UsersTable';
import '../../style/Global.css'
import PageHeader from '../../components/PageHeader';

const ViewUsers = () => {
  return (
    <>
      <Helmet><title>View & Manage Users | AUT Events Induction Portal</title></Helmet>
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