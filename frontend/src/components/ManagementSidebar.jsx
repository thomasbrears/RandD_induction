import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCog, FaUsers, FaClipboardList, FaChartBar, FaHome, FaPlus, FaFileAlt } from 'react-icons/fa';

const ManagementSidebar = () => {
  const location = useLocation();

  // Updated list of sidebar links with icons
  const links = [
    { path: '/management/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/management/users/view', label: 'View Users', icon: <FaUsers /> },
    { path: '/management/users/create', label: 'Create User', icon: <FaPlus /> },
    { path: '/management/inductions/view', label: 'View Inductions', icon: <FaClipboardList /> },
    { path: '/management/inductions/create', label: 'Create Induction', icon: <FaFileAlt /> },
    { path: '/management/inductions/results', label: 'View Results', icon: <FaChartBar /> },
    { path: '/admin/settings', label: 'Settings', icon: <FaCog />, adminOnly: true }
  ];

  return (
    <div className="bg-gray-100 text-gray-800 h-full w-20 md:w-24 lg:w-28 flex flex-col items-center py-8 space-y-6 shadow-md">
      {links.map((link, index) => {
        const isActive = location.pathname === link.path;

        // Only render admin-only links for admin pages
        if (link.adminOnly && !location.pathname.includes('/admin')) {
          return null;
        }

        return (
          <Link 
            to={link.path} 
            key={index} 
            className={`flex flex-col items-center text-xs md:text-sm transition-colors duration-200 ${isActive ? 'text-blue-600' : 'text-gray-600 hover:text-blue-500'}`}
          >
            <div className={`text-lg md:text-2xl ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
              {link.icon}
            </div>
            <span className="mt-1">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );
};

export default ManagementSidebar;
