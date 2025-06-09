import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from '../components/PageHeader';
import useAuth from '../hooks/useAuth';
import EmailManage from '../components/EmailManage';
import PasswordManage from '../components/PasswordManage';
import ProfileManage from '../components/ProfileManage';
import QualificationsSummary from '../components/qualifications/QualificationsSummary';

const ManageAccountPage = () => {
  const { user } = useAuth();

  return (
    <>
      <Helmet>
        <title>Manage my Account | AUT Events Induction Portal</title>
      </Helmet>
      <PageHeader 
        title="Manage Account" 
        subtext="Manage your AUT Events Induction Portal account" 
      />
      <div className="p-6 flex flex-col items-center">
        {/* Profile information section first */}
        <div className="w-full max-w-8xl mb-6">
          <ProfileManage />
        </div>
        
        {/* Email and password sections below */}
        <div className="w-full max-w-8xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <PasswordManage />
          <EmailManage />
        </div>

        {/* Qualifications summary section at the bottom */}
        <div className="w-full max-w-8xl">
          <QualificationsSummary />
        </div>
      </div>
    </>
  );
};

export default ManageAccountPage;