import React from 'react';
import UsersTable from '../components/TestUsersTable';

const HomePage = () => {
  return (
    <div>
      <h1>Welcome to the Induction App</h1>
      <p>This is a public page. Please sign in to view your induction forms.</p>
        <UsersTable/>
    </div>
  );
};

export default HomePage;