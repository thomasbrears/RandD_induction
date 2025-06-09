import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import useAuth from '../hooks/useAuth';
import AssignedInductions from '../components/AssignedInductions';
import PageHeader from '../components/PageHeader';
import QualificationsSummary from '../components/qualifications/QualificationsSummary';

const FormListPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet><title>My Inductions | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="My Inductions" 
        subtext={`Inductions assigned to ${user?.displayName || user?.email}`} 
      />
      <div className="p-6">
        <AssignedInductions />

        <QualificationsSummary />
      </div>
    </>
  );
};

export default FormListPage;