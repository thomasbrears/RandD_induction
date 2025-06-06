import React from 'react';
import { Helmet } from 'react-helmet-async';
import QualificationList from '../components/qualifications/QualificationList';
import useAuth from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';

const QualificationsPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>My Qualifications & Certificates | AUT Events Induction Portal</title>
      </Helmet>

      <PageHeader 
        title="My Qualifications & Certificates" 
        subtext="Upload and manage your certificates, licenses, and qualifications. Keep track of expiry dates and ensure your credentials stay current."
      />

      <div className="min-h-screen bg-gray-50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <QualificationList 
            userId={user?.uid}
            title="My Qualifications & Certificates"
          />
        </div>
      </div>
    </>
  );
};

export default QualificationsPage;