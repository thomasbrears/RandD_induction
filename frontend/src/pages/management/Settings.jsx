import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';

const settings = () => {
  return (
    <>
      <Helmet><title>System Settings | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="System Settings" 
        subtext="Manage the Induction Portal" 
      />
      <div className="p-6">
        <p>Only admins can access this page.</p>
      </div>
    </>
  );
};

export default settings;
