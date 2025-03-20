import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../components/PageHeader';
import ContactForm from '../components/ContactForm';

const ContactPage = () => {
  return (
    <>
      <Helmet><title>Contact Us | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Contact Us" 
        subtext="We would love to hear from you!" 
      />
      <div className="p-6">
        <ContactForm />
      </div>
    </>
  );
};

export default ContactPage;
