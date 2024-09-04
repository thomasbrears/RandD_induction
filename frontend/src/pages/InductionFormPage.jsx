import React, { useState } from 'react';
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
    <div>
      <h1>Complete Induction Form</h1>
      <p>Welcome, {user?.email}! Please complete the induction form below.</p>
    </div>
  );
};

export default InductionFormPage;