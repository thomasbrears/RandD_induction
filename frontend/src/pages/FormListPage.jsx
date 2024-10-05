import React from 'react';
import useAuth from '../hooks/useAuth';
import AssignedInductions from '../components/AssignedInductions';
import { toast } from 'react-toastify'; // Toastify success/error/info messages

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