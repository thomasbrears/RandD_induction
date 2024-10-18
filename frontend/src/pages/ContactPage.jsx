import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
//import { toast } from 'react-toastify'; // Toastify success/error/info messages
import PageHeader from '../components/PageHeader';

const ContactPage = () => {
  return (
    <>
      <Helmet><title>Contact Us | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Contact Us" 
        subtext="Reach out to us for any queries or feedback" 
      />
      <div className="p-6">
        <p>This is the contact page.</p>
      </div>
    </>
  );
};

export default ContactPage;
