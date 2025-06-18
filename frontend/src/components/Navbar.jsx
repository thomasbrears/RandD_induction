import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Dropdown, Space } from 'antd';
import useAuth from '../hooks/useAuth';
import { FaBars, FaCaretDown, FaTimes, FaUsers, FaClipboardList, FaChartBar, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { GrContact, GrCertificate } from "react-icons/gr";
import { MdOutlineManageAccounts } from "react-icons/md";

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const [showBar, setShowBar] = useState(true);
  const [isOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navRef = useRef(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when window resizes to desktop or route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target) && isOpen) {
        setMobileMenuOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLinkClick = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      handleLinkClick();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, [signOut, handleLinkClick]);

  // Check if current route is active
  const isActiveRoute = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Management dropdown menu items (combines admin and manager)
  const managementMenuItems = [
    {
      key: 'dashboard',
      label: (
        <Link 
          to="/management/dashboard" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/dashboard') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <FaChartBar className="mr-3 text-sm" /> Dashboard
        </Link>
      ),
    },
    {
      key: 'users',
      label: (
        <Link 
          to="/management/users/view" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/users') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <FaUsers className="mr-3 text-sm" /> Users
        </Link>
      ),
    },
    {
      key: 'results',
      label: (
        <Link 
          to="/management/results" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/results') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <FaChartBar className="mr-3 text-sm" /> Results
        </Link>
      ),
    },
    {
      key: 'inductions',
      label: (
        <Link 
          to="/management/inductions/view" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/inductions') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <FaClipboardList className="mr-3 text-sm" /> Inductions
        </Link>
      ),
    },
    {
      key: 'contact',
      label: (
        <Link 
          to="/management/contact-submissions" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/contact-submissions') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <GrContact className="mr-3 text-sm" /> Contact Submissions
        </Link>
      ),
    },
    {
      key: 'qualifications',
      label: (
        <Link 
          to="/management/qualifications" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/management/qualifications') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <GrCertificate className="mr-3 text-sm" /> Qualifications & Certificates
        </Link>
      ),
    },
    // Only show settings for admins
    ...(user?.role === 'admin' ? [
      {
        type: 'divider',
      },
      {
        key: 'settings',
        label: (
          <Link 
            to="/admin/settings" 
            onClick={handleLinkClick} 
            className={`flex items-center px-3 py-2 rounded-md transition-colors ${
              isActiveRoute('/admin/settings') 
                ? 'text-blue-600 bg-blue-50 font-medium' 
                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
            }`}
          >
            <FaCog className="mr-3 text-sm" /> System Settings
          </Link>
        ),
      },
    ] : []),
  ];

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'account',
      label: (
        <Link 
          to="/account/manage" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/account/manage') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <MdOutlineManageAccounts className="mr-3 text-sm" /> Manage my Account
        </Link>
      ),
    },
    {
      key: 'qualifications',
      label: (
        <Link 
          to="/account/qualifications" 
          onClick={handleLinkClick} 
          className={`flex items-center px-3 py-2 rounded-md transition-colors ${
            isActiveRoute('/account/qualifications') 
              ? 'text-blue-600 bg-blue-50 font-medium' 
              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
          }`}
        >
          <GrCertificate className="mr-3 text-sm" /> Manage my Qualifications & Certificates
        </Link>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'signout',
      label: (
        <div 
          onClick={handleSignOut} 
          className="flex items-center px-3 py-2 rounded-md text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer transition-colors"
        >
          <FaSignOutAlt className="mr-3 text-sm" /> Sign Out
        </div>
      ),
    },
  ];

  const navLinkClass = (path) => 
    `font-medium transition-all duration-200 px-3 py-2 rounded-md ${
      isActiveRoute(path)
        ? 'text-blue-400 bg-blue-900/30'
        : 'text-white hover:text-blue-400 hover:bg-white/10'
    }`;

  const mobileNavLinkClass = (path) =>
    `block py-3 px-4 font-medium transition-all duration-200 rounded-md mx-2 ${
      isActiveRoute(path)
        ? 'text-blue-400 bg-blue-900/30'
        : 'text-white hover:text-blue-400 hover:bg-white/10'
    }`;

  return (
    <>
      {/* Top notification bar */}
      {!loading && !user && showBar && (
        <div className="bg-blue-800 text-white p-3 text-center relative">
          <Link 
            to="/auth/signin" 
            className="hover:text-blue-200 transition-colors font-medium"
          >
            Welcome to the AUT Events Induction Portal! Please Sign in to complete your inductions. →
          </Link>
        </div>
      )}

      <nav 
        ref={navRef}
        className="bg-black text-white shadow-lg"
      >
        <div className="max-w-6xl mx-auto flex justify-between items-center px-4 py-3">
          {/* Logo */}
          <Link to="/" onClick={handleLinkClick} className="flex-shrink-0 group">
            <img
              src={`${process.env.PUBLIC_URL}/images/AUTEventsInductionPortal.jpg`}
              alt="AUT Events Induction Portal"
              className="h-12 md:h-14 w-auto transition-transform"
              loading="lazy"
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={navLinkClass('/')} onClick={handleLinkClick}>
              Home
            </Link>
            <Link to="/contact" className={navLinkClass('/contact')} onClick={handleLinkClick}>
              Contact
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/inductions/my-inductions" 
                  className={navLinkClass('/inductions/my-inductions')}
                  onClick={handleLinkClick}
                >
                  My Inductions
                </Link>

                {/* Management Dropdown (for both admin and manager) */}
                {(user.role === 'admin' || user.role === 'manager') && (
                  <Dropdown
                    menu={{ items: managementMenuItems }}
                    trigger={['hover', 'click']}
                    placement="bottomRight"
                    overlayClassName="navbar-dropdown"
                    mouseEnterDelay={0.1}
                    mouseLeaveDelay={0.15}
                  >
                    <Space className={`cursor-pointer px-3 py-2 rounded-md transition-all duration-200 ${
                      isActiveRoute('/management') || isActiveRoute('/admin')
                        ? 'text-blue-400 bg-blue-900/30'
                        : 'text-white hover:text-blue-400 hover:bg-white/10'
                    }`}>
                      Management
                      <FaCaretDown className="text-sm transition-transform" />
                    </Space>
                  </Dropdown>
                )}
                
                {/* User Dropdown */}
                <Dropdown
                  menu={{ items: userMenuItems }}
                  trigger={['hover', 'click']}
                  placement="bottomRight"
                  overlayClassName="navbar-dropdown"
                  mouseEnterDelay={0.1}
                  mouseLeaveDelay={0.15}
                >
                  <Space className={`cursor-pointer px-3 py-2 rounded-md transition-all duration-200 ${
                    isActiveRoute('/account')
                      ? 'text-blue-400 bg-blue-900/30'
                      : 'text-white hover:text-blue-400 hover:bg-white/10'
                  }`}>
                    <span className="max-w-32 truncate">
                      Kia ora{user.displayName ? `, ${user.displayName.split(" ")[0]}` : " User"}
                    </span>
                    <FaCaretDown className="text-sm transition-transform" />
                  </Space>
                </Dropdown>
              </>
            ) : (
              <Link 
                to="/auth/signin" 
                className={navLinkClass('/auth/signin')}
                onClick={handleLinkClick}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile Menu Button (Hamburger to "X") */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!isOpen)} className="relative w-8 h-8 flex flex-col items-center justify-center">
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 my-1 ${isOpen ? "opacity-0" : "opacity-100"}`} />
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="px-2 pb-4 space-y-1 bg-gray-900 border-t border-gray-700">
            <Link to="/" className={mobileNavLinkClass('/')} onClick={handleLinkClick}>
              Home
            </Link>
            <Link to="/contact" className={mobileNavLinkClass('/contact')} onClick={handleLinkClick}>
              Contact
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/inductions/my-inductions" 
                  className={mobileNavLinkClass('/inductions/my-inductions')} 
                  onClick={handleLinkClick}
                >
                  My Inductions
                </Link>
                
                {/* Management Links (expanded in mobile view) */}
                {(user.role === 'admin' || user.role === 'manager') && (
                  <div className="mt-4 pb-3 border-b border-gray-700">
                    <p className="text-blue-400 font-semibold mb-3 px-4">Management</p>
                    <div className="space-y-1">
                      <Link 
                        to="/management/dashboard" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/dashboard')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Dashboard
                      </Link>
                      <Link 
                        to="/management/users/view" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/users')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Manage Users
                      </Link>
                      <Link 
                        to="/management/results" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/results')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Results
                      </Link>
                      <Link 
                        to="/management/inductions/view" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/inductions')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Inductions
                      </Link>
                      <Link 
                        to="/management/contact-submissions" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/contact-submissions')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Contact Submissions
                      </Link>
                      <Link 
                        to="/management/qualifications" 
                        className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                          isActiveRoute('/management/qualifications')
                            ? 'text-blue-400 bg-blue-900/30'
                            : 'text-gray-300 hover:text-white hover:bg-white/10'
                        }`}
                        onClick={handleLinkClick}
                      >
                        Qualifications & Certificates
                      </Link>
                      {user.role === 'admin' && (
                        <Link 
                          to="/admin/settings" 
                          className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                            isActiveRoute('/admin/settings')
                              ? 'text-blue-400 bg-blue-900/30'
                              : 'text-gray-300 hover:text-white hover:bg-white/10'
                          }`}
                          onClick={handleLinkClick}
                        >
                          Settings
                        </Link>
                      )}
                    </div>
                  </div>
                )}

                {/* User Links */}
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <p className="text-blue-400 font-semibold mb-3 px-4">
                    <span className="truncate">
                      Kia ora, {user.displayName ? user.displayName.split(" ")[0] : "User"}
                    </span>
                  </p>
                  <div className="space-y-1">
                    <Link 
                      to="/account/manage" 
                      className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                        isActiveRoute('/account/manage')
                          ? 'text-blue-400 bg-blue-900/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={handleLinkClick}
                    >
                      Manage my Account
                    </Link>
                    <Link 
                      to="/account/qualifications" 
                      className={`block py-2 px-6 transition-colors rounded-md mx-2 ${
                        isActiveRoute('/account/qualifications')
                          ? 'text-blue-400 bg-blue-900/30'
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={handleLinkClick}
                    >
                      Manage Qualifications & Certificates
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block text-red-400 hover:text-red-300 hover:bg-red-900/20 py-2 px-6 text-left w-full transition-colors rounded-md mx-2"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link 
                to="/auth/signin" 
                className="block bg-blue-700 hover:bg-blue-600 text-white px-4 py-3 rounded-lg font-medium transition-colors mt-4 mx-2 text-center" 
                onClick={handleLinkClick}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>   
      </nav>

      {/* Custom CSS for dropdown styling */}
      <style jsx>{`
        :global(.navbar-dropdown .ant-dropdown-menu) {
          background: white;
          border-radius: 12px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid #e5e7eb;
          padding: 8px;
          min-width: 240px;
          backdrop-filter: blur(8px);
        }
        
        :global(.navbar-dropdown .ant-dropdown-menu-item) {
          padding: 0;
          border-radius: 8px;
          margin: 2px 0;
        }
        
        :global(.navbar-dropdown .ant-dropdown-menu-item:hover) {
          background-color: transparent;
        }
        
        :global(.navbar-dropdown .ant-dropdown-menu-item-divider) {
          margin: 8px 4px;
          background-color: #e5e7eb;
        }

        /* Smooth scrolling */
        :global(html) {
          scroll-behavior: smooth;
        }

        /* Focus styles for better accessibility */
        :global(.navbar-dropdown .ant-dropdown-menu-item:focus-within) {
          background-color: #eff6ff;
        }
      `}</style>
    </>
  );
};

export default Navbar;