import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { 
  FaHome, 
  FaEnvelope, 
  FaExternalLinkAlt, 
  FaClipboardList, 
  FaCertificate, 
  FaUser,
  FaChartBar,
  FaUsers,
  FaSignOutAlt,
  FaCog,
  FaArrowUp,
  FaClipboardCheck
} from 'react-icons/fa';
import { GrContact, GrCertificate } from "react-icons/gr";

const Footer = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const IS_AUTHENTICATED = !!user;
  const IS_ADMIN_OR_MODERATOR = user?.role === 'admin' || user?.role === 'manager';
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Handle back-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Navigation handler that scrolls to top
  const handleNavigation = (path) => {
    navigate(path);
    // Small delay to ensure navigation completes before scrolling
    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }, 100);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  };

  const footerLinkClass = "flex items-center text-gray-300 hover:text-blue-400 transition-colors duration-200 cursor-pointer";
  const footerSectionTitleClass = "text-blue-400 font-semibold mb-2 text-sm uppercase tracking-wider";

  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* Logo and Description */}
          <div className="col-span-2 md:col-span-1">
            <div className="mb-4">
              <img 
                src="/images/AUTEventsInductionPortal.jpg" 
                alt="AUT Events Induction Portal" 
                className="h-12 w-auto mb-3"
                loading="lazy"
              />
              <p className="text-gray-400 text-sm leading-relaxed">
                The AUT Events Induction Portal is designed to streamline the onboarding process, management, and reporting for AUT Events + Venues.
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className={footerSectionTitleClass}>Quick Links</h3>
            <nav className="space-y-1">
              <div onClick={() => handleNavigation('/')} className={footerLinkClass}>
                <FaHome className="mr-2 text-xs" />
                Home
              </div>
              <div onClick={() => handleNavigation('/contact')} className={footerLinkClass}>
                <FaEnvelope className="mr-2 text-xs" />
                Contact Us
              </div>
              <a 
                href="https://www.autevents.co.nz/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className={footerLinkClass}
              >
                <FaExternalLinkAlt className="mr-2 text-xs" />
                AUT Events Website
              </a>
            </nav>
          </div>

          {/* User Links */}
          {IS_AUTHENTICATED ? (
            <div>
              <h3 className={footerSectionTitleClass}>My Account</h3>
              <nav className="space-y-1">
                <div onClick={() => handleNavigation('/inductions/my-inductions')} className={footerLinkClass}>
                  <FaClipboardList className="mr-2 text-xs" />
                  My Inductions
                </div>
                <div onClick={() => handleNavigation('/account/qualifications')} className={footerLinkClass}>
                  <GrCertificate className="mr-2 text-xs" />
                  My Qualifications
                </div>
                <div onClick={() => handleNavigation('/account/manage')} className={footerLinkClass}>
                  <FaUser className="mr-2 text-xs" />
                  Account Settings
                </div>
                <button onClick={handleSignOut} className={`${footerLinkClass} text-red-400 hover:text-red-300`}>
                  <FaSignOutAlt className="mr-2 text-xs" />
                  Sign Out
                </button>
              </nav>
            </div>
          ) : (
            <div>
              <h3 className={footerSectionTitleClass}>Get Started</h3>
              <nav className="space-y-1">
                <div onClick={() => handleNavigation('/auth/signin')} className={footerLinkClass}>
                  <FaUser className="mr-2 text-xs" />
                  Sign In
                </div>
              </nav>
            </div>
          )}

          {/* Management Links (Admin/Manager only) */}
          {IS_ADMIN_OR_MODERATOR && (
            <div className="col-span-2 md:col-span-1">
              <h3 className={footerSectionTitleClass}>Management</h3>
              <nav className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-1">
                <div onClick={() => handleNavigation('/management/dashboard')} className={footerLinkClass}>
                  <FaChartBar className="mr-2 text-xs" />
                  Dashboard
                </div>
                <div onClick={() => handleNavigation('/management/users/view')} className={footerLinkClass}>
                  <FaUsers className="mr-2 text-xs" />
                  Manage Users
                </div>
                <div onClick={() => handleNavigation('/management/inductions/view')} className={footerLinkClass}>
                  <FaClipboardCheck className="mr-2 text-xs" />
                  Manage Inductions
                </div>
                <div onClick={() => handleNavigation('/management/results')} className={footerLinkClass}>
                  <FaChartBar className="mr-2 text-xs" />
                  View Results
                </div>
                <div onClick={() => handleNavigation('/management/contact-submissions')} className={footerLinkClass}>
                  <GrContact className="mr-2 text-xs" />
                  Contact Submissions
                </div>
                <div onClick={() => handleNavigation('/management/qualifications')} className={footerLinkClass}>
                  <GrCertificate className="mr-2 text-xs" />
                  Manage Qualifications
                </div>
                {/* System Settings Link (Admin only) */}
                {user?.role === 'admin' && (
                  <div onClick={() => handleNavigation('/admin/settings')} className={footerLinkClass}>
                    <FaCog className="mr-2 text-xs" />
                    System Settings
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>

        {/* Bottom Copyright Section */}
        <div className="border-t border-gray-800 mt-6 pt-4">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} AUT Events + Venues, a division of Auckland University of Technology Commercial Services. All rights reserved.
            </p>
          </div>
        </div>
      </div>

      {/* Back to Top Button */}
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-1 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg transition-all duration-300 transform z-50 flex items-center justify-center ${
          showBackToTop 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ width: 45, height: 45 }}
        aria-label="Back to top"
      >
        <FaArrowUp className="text-xl" />
      </button>
    </footer>
  );
};

export default Footer;