import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { Link } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';

const Dashboard = () => {
  const sections = [
    {
      title: "Users",
      description: "Manage User access",
      links: [
        { text: "View & Edit Users", path: "/management/users/view" },
        { text: "Create New User", path: "/management/users/create" }
      ]
    },
    {
      title: "Inductions",
      description: "Manage Induction Questions",
      links: [
        { text: "View & Edit Inductions", path: "/management/inductions/view" },
        { text: "Create Induction", path: "/management/inductions/create" }
      ]
    },
    {
      title: "Results",
      description: "View induction results",
      links: [
        { text: "View all Results", path: "/management/inductions/results" }
      ]
    },
    {
      title: "Settings",
      description: "Manage system settings",
      links: [
        { text: "System Settings", path: "/admin/settings" }
      ]
    }
  ];

  return (
    <>
      <Helmet><title>Management Dashboard | AUT Events Induction Portal</title></Helmet>

      <PageHeader title="Management Dashboard" subtext="Manage users, settings, and results" /> {/* Add the header here */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {sections.map((section, index) => (
            <div key={index} className="p-4 border rounded-lg shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-2">{section.title}</h2>
              <p className="text-gray-500 mb-4">{section.description}</p>
              <div className="flex flex-col space-y-2">
                {section.links.map((link, linkIndex) => (
                  <Link 
                    key={linkIndex} 
                    to={link.path} 
                    className="text-white bg-gray-800 hover:bg-gray-900 px-3 py-2 rounded-md text-center"
                  >
                    {link.text}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;