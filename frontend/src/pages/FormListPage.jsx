import React from 'react';
import useAuth from '../hooks/useAuth';

const FormListPage = () => {
  const { user } = useAuth();

  return (
    <div>
        <h1>Induction Forms for {user?.email}</h1>
        <p>This is a private page. You can view your induction forms here.</p>
    </div>
  );
};

export default FormListPage;