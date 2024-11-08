import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
//import { toast } from 'react-toastify'; // Toastify success/error/info messages
import PageHeader from '../components/PageHeader';

const ManageAccountPage = () => {
  return (
    <>
      <Helmet><title>Manage my Account | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Manage Account" 
        subtext="Manage your AUT Events Induction Portal account" 
      />
      <div className="p-6">
        <p>This is the Manage account page.</p>
      </div>
    </>
  );
};

export default ManageAccountPage;
