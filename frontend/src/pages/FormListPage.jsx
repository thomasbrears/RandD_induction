import React from 'react';
import useAuth from '../hooks/useAuth';
import AssignedInductions from '../components/AssignedInductions';
import PageHeader from '../components/PageHeader';

const FormListPage = () => {
  const { user } = useAuth();

  return (
    <>
      <PageHeader 
        title="Your Induction Forms" 
        subtext={`Induction forms assigned to ${user?.email}`} 
      />
      <div className="p-6">
        <AssignedInductions />
      </div>
    </>
  );
};

export default FormListPage;