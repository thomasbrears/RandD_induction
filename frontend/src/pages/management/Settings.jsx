import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for navigation
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
//import DepartmentManagement from '../../components/DepartmentManagement';
//import LocationManagement from '../../components/LocationManagement';
import useAuth from '../../hooks/useAuth'; // Import the useAuth hook
import { toast } from 'react-toastify';

const Settings = () => {
  const { user } = useAuth(); // Get the user object from useAuth hook
  const [loading, setLoading] = useState(true); // State to handle loading
  const navigate = useNavigate(); // Use navigate for redirection

  useEffect(() => {
    if (user) {
      setLoading(false); // Stop loading if the user is authenticated
    } else if (!user && !loading) {
      // Redirect non-authenticated users after loading
      toast.error('You must be logged in to access this page');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  // Loading state
  if (loading) {
    return <div className="text-center mt-20">Loading...</div>;
  }

  return (
    <>
      <Helmet>
        <title>System Settings | AUT Events Induction Portal</title>
      </Helmet>

      {/* Page Header */}
      <PageHeader
        title="System Settings"
        subtext="Manage the Induction Portal"
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">

          {/* Departments Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Manage Departments</h2>
            <p className="text-gray-600">
              Department management features will be implemented here soon.
            </p>
          </section>

          {/* Locations Section */}
          <section>
            <h2 className="text-xl font-semibold mb-4">Manage Locations</h2>
            <p className="text-gray-600">
              Location management features will be implemented here soon.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default Settings;
