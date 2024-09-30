import React from 'react';
import UsersTable from '../../components/UsersTable';

const ViewUsers = () => {
  return (
    <div>
        <h1>Manage Users</h1>
        <p>Only admins can access this page.</p>
        <UsersTable/>
    </div>
  );
};

export default ViewUsers;