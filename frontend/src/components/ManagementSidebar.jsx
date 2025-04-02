import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCog, FaUsers, FaUserPlus, FaClipboardList, FaChartBar, FaHome, FaBars, FaTimes } from 'react-icons/fa';
import { IoCreate } from "react-icons/io5";
import { GrContact } from "react-icons/gr";
import useAuth from "../hooks/useAuth";

const ManagementSidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Function to check if screen is mobile size
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Run on mount and when window resizes
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Ensure user is available
  if (!user) return null;

  // List of sidebar links with icons
  const links = [
    { path: '/management/dashboard', label: 'Dashboard', icon: <FaHome /> },
    { path: '/management/users/view', label: 'View Users', icon: <FaUsers /> },
    { path: '/management/users/create', label: 'Create User', icon: <FaUserPlus /> },
    { path: '/management/inductions/view', label: 'View Inductions', icon: <FaClipboardList /> },
    { path: '/management/inductions/create', label: 'Create Induction', icon: <IoCreate /> },
    { path: '/management/results', label: 'View Results', icon: <FaChartBar /> },
    { path: '/management/contact-submissions', label: 'Submissions', icon: <GrContact /> },
    { path: '/admin/settings', label: 'Settings', icon: <FaCog />, adminOnly: true }
  ];

  return (
    <div className="relative">
      {/* Desktop Sidebar (unchanged) */}
      {!isMobile && (
        <div className="bg-gray-100 text-gray-800 h-full w-20 md:w-24 lg:w-28 flex flex-col items-center py-8 space-y-6 shadow-md">
          {links.map((link, index) => {
            const isActive = location.pathname === link.path;
            
            // Only render admin-only links for admin users
            if (link.adminOnly && user.role !== 'admin') {
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
      )}

      {/* Mobile Tab Toggle Button */}
      {isMobile && (
        <div 
          className={`fixed left-0 top-1/3 z-50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-64' : 'translate-x-0'}`}
        >
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-blue-600 text-white px-2 py-3 rounded-r-lg shadow-lg"
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
          >
            <div className="relative w-6 h-6 flex flex-col items-center justify-center">
              <div className={`bg-white w-6 h-0.5 rounded transition-all duration-300 ${sidebarOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <div className={`bg-white w-6 h-0.5 rounded transition-all duration-300 my-1 ${sidebarOpen ? "opacity-0" : "opacity-100"}`} />
              <div className={`bg-white w-6 h-0.5 rounded transition-all duration-300 ${sidebarOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div 
          className={`fixed top-0 left-0 h-full bg-gray-100 z-40 transition-transform duration-300 ease-in-out shadow-xl ${
            sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'
          }`}
        >
                      <div className="flex flex-col p-4 space-y-4 h-full overflow-y-auto">
            {/* Sidebar Title */}
            <div className="border-b border-gray-200 pb-2 mb-2">
              <h2 className="font-bold text-lg text-blue-600">Menu</h2>
            </div>
            
            {/* Links */}
            {links.map((link, index) => {
              const isActive = location.pathname === link.path;
              
              // Only render admin-only links for admin users
              if (link.adminOnly && user.role !== 'admin') {
                return null;
              }

              return (
                <Link 
                  to={link.path} 
                  key={index}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center py-2 px-2 rounded-md ${
                    isActive 
                      ? 'bg-blue-100 text-blue-600 border-l-4 border-blue-600' 
                      : 'text-gray-700 hover:bg-gray-200 hover:text-blue-600'
                  }`}
                >
                  <div className={`text-xl mr-3 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                    {link.icon}
                  </div>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Overlay to darken the rest of the screen when sidebar is open */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default ManagementSidebar;