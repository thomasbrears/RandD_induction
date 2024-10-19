import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import useAuth from '../hooks/useAuth';
import AssignedInductions from '../components/AssignedInductions';
import PageHeader from '../components/PageHeader';

const FormListPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet><title>My Inductions | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="My Inductions" 
        subtext={`Induction forms assigned to ${user?.displayName || user?.email}`} 
      />
      <div className="p-6">
        <AssignedInductions />
      </div>
    </>
  );
};

export default FormListPage;