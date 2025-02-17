import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamically set page head for titles, seo etc
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import { FaUsers, FaClipboardList, FaChartBar, FaCog } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdmin = user && user.role === 'admin'; // Check if user is an admin

  const sections = [
    {
      icon: <FaUsers className="inline mr-2" />,
      title: "Users",
      description: "Manage User access",
      links: [
        { text: "View & Edit Users", path: "/management/users/view" },
        { text: "Create New User", path: "/management/users/create" }
      ]
    },
    {
      icon: <FaClipboardList className="inline mr-2" />,
      title: "Inductions",
      description: "Manage Induction Questions",
      links: [
        { text: "View & Edit Inductions", path: "/management/inductions/view" },
        { text: "Create Induction", path: "/management/inductions/create" }
      ]
    },
    {
      icon: <FaChartBar className="inline mr-2" />,
      title: "Results",
      description: "View induction results",
      links: [
        { text: "View all Results", path: "/management/inductions/results" }
      ]
    },
    {
      icon: <FaCog className="inline mr-2" />,
      title: "Settings",
      description: "Manage system settings",
      links: isAdmin 
        ? [{ text: "System Settings", path: "/admin/settings" }]
        : [], // Remove link for non-admins
      disabled: !isAdmin // Disable card for managers
    }
  ];

  return (
    <>
      <Helmet><title>Management Dashboard | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader title="Management Dashboard" subtext="Manage users, settings, and results" />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`p-4 border border-gray-200 rounded-lg shadow bg-white ${section.disabled ? '' : ''}`}
              >
                <h2 className="text-xl font-semibold mb-2">{section.icon} {section.title}</h2>
                <p className="text-gray-500 mb-4">{section.description}</p>
                <div className="flex flex-col space-y-2">
                  {section.links.length === 0 && !isAdmin && (
                    <button 
                      className="text-white bg-gray-800 opacity-50 px-3 py-2 rounded-md text-center w-full cursor-not-allowed"
                      disabled
                    >
                      Sorry, only admins can access this page
                    </button>
                  )}
                  {section.links.map((link, linkIndex) => (
                    <Link 
                      key={linkIndex} 
                      to={link.path} 
                      className={`text-white bg-gray-800 hover:bg-gray-900 px-3 py-2 rounded-md text-center ${section.disabled ? 'pointer-events-none' : ''}`}
                    >
                      {link.text}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;
