import React from 'react';
import { Helmet } from 'react-helmet-async';
import PageHeader from '../components/PageHeader';
import useAuth from '../hooks/useAuth';
import EmailManage from '../components/EmailManage';
import PasswordManage from '../components/PasswordManage';

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
        <div className="w-full max-w-8xl grid grid-cols-1 md:grid-cols-2 gap-6">
          <PasswordManage />
          <EmailManage />
        </div>
      </div>
    </>
  );
};

export default ManageAccountPage;