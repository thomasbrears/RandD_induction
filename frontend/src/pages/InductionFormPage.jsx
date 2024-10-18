import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import useAuth from '../hooks/useAuth';

const InductionFormPage = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit the form data
    console.log('Form submitted', formData);
  };

  return (
    <>
      <Helmet><title>Induction | AUT Events Induction Portal</title></Helmet>
      <div className="p-6">
        <h1>Main Induction Form Page</h1>
        <p>Welcome, {user?.email}! Please complete the induction form below.</p>
      </div>
    </>
  );
};

export default InductionFormPage;