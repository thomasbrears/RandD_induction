import React from 'react';
import useAuth from '../hooks/useAuth';
import AssignedInductions from '../components/AssignedInductions';

const FormListPage = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Induction Forms for {user?.email}</h1>
      <AssignedInductions />
    </div>
  );
};

export default FormListPage;