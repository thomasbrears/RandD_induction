import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom'; 
import { Tabs } from 'antd';
import { notifyError } from '../../utils/notificationService';
import { AiOutlineSetting } from 'react-icons/ai';
import { FaBuilding, FaUserTie } from 'react-icons/fa';
import { IoLocation } from "react-icons/io5";
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import ManageDepartments from '../../components/management/ManageDepartments';
import ManageLocations from '../../components/management/ManageLocations';
import ManagePositions from '../../components/management/ManagePositions';

const Settings = () => {
  const { user } = useAuth(); // Get the user object from useAuth hook
  const [loading, setLoading] = useState(true); // State to handle loading
  const navigate = useNavigate(); // Use navigate for redirection

  useEffect(() => {
    if (user) {
      setLoading(false); // Stop loading if the user is authenticated
    } else if (!user && !loading) {
      // Redirect non-authenticated users after loading
      notifyError('Authentication required', 'You must be logged in to access this page');
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
      <div className="flex  md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-x-auto">

          <Tabs type="card">
            {/* Overview Tab */}
            <items
              tab={
                <span>
                  <AiOutlineSetting className="inline-block mr-2" />
                  Overview
                </span>
              }
              key="1"
            >
              <div className="text-center py-6">
                <h2 className="text-2xl font-semibold text-gray-800">Welcome to System Settings for the Induction Portal</h2>
                <p className="text-gray-600 mt-2">
                  Here administrators can manage key settings and option of the Induction Portal. <br /> <b>Use the tabs above to navigate through different sections.</b>
                </p>

                <div className="mt-6 bg-gray-100 p-4 rounded-lg shadow-md text-left max-w-lg mx-auto">
                  <h3 className="text-lg font-semibold text-gray-700">What You Can Do Here:</h3>
                  <ul className="list-disc list-inside mt-2 text-gray-600">
                    <li><FaBuilding className="inline-block mr-2" /> View, create, edit & delete available departments.</li>
                    <li><FaUserTie className="inline-block mr-2" /> View, create, edit & delete available positions.</li>
                    <li><IoLocation className="inline-block mr-2" /> View, create, edit & delete available locations.</li>
                    <li><AiOutlineSetting className="inline-block mr-2" /> More setting options coming soon</li>
                  </ul>
                </div>
              </div>
            </items>

            {/* Manage Departments Tab */}
            <items
              tab={
                <span>
                  <FaBuilding className="inline-block mr-2" />
                  Manage Departments
                </span>
              }
              key="2"
            >
              <ManageDepartments />
            </items>

            {/* Manage Positions Tab */}
            <items
              tab={
                <span>
                  <FaUserTie className="inline-block mr-2" />
                  Manage Positions
                </span>
              }
              key="3"
            >
              <ManagePositions />
            </items>

            {/* Manage Locations Tab */}
            <items
              tab={
                <span>
                  <IoLocation className="inline-block mr-2" />
                  Manage Locations
                </span>
              }
              key="4"
            >
              <ManageLocations />
            </items>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Settings;