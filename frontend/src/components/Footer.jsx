import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Footer = () => {
  const { user, signOut } = useAuth();
  const IS_AUTHENTICATED = !!user;
  const IS_ADMIN_OR_MODERATOR = user?.role === 'admin' || user?.role === 'manager';
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Handle back-to-top button visibility
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
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

  return (
    <footer className="bg-black text-white py-6">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex flex-col items-center sm:flex-row sm:justify-between">
          {/* Logo */}
          <div className="flex-shrink-0 mb-6 mr-6 sm:mb-0">
            <img src={`/images/AUTEventsInductionPortal.jpg`} alt="AUT Events Induction Portal" className="max-w-[150px]" />
          </div>
          
          {/* Footer Navigation Links */}
          <nav className="w-full sm:w-auto">
            <ul className="grid grid-cols-2 gap-4 sm:flex sm:flex-row sm:flex-wrap sm:justify-center md:justify-end sm:gap-6">
              <li><Link to="/" className="hover:text-blue-400">Home</Link></li>
              <li><Link to="/contact" className="hover:text-blue-400">Contact us</Link></li>
              <li>
                <a href="https://www.autevents.co.nz/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
                  AUT Events Website
                </a>
              </li>
              
              {IS_AUTHENTICATED && (
                <>
                  <li><Link to="/inductions/my-inductions" className="hover:text-blue-400">My Inductions</Link></li>
                  <li><Link to="/account/qualifications" className="hover:text-blue-400">My Qualifications & Certificates</Link></li>
                  <li><Link to="/account/manage" className="hover:text-blue-400">My Account</Link></li>

                  {IS_ADMIN_OR_MODERATOR && (
                    <>
                      <li><Link to="/management/dashboard" className="hover:text-blue-400">Dashboard</Link></li>
                      <li><Link to="/management/inductions/view" className="hover:text-blue-400">Manage Inductions</Link></li>
                      <li><Link to="/management/results" className="hover:text-blue-400">View Induction Results</Link></li>
                      <li><Link to="/management/users/view" className="hover:text-blue-400">Manage Users</Link></li>
                      <li><Link to="/management/contact-submissions" className="hover:text-blue-400">Contact Submissions</Link></li>
                      <li><Link to="/management/qualifications" className="hover:text-blue-400">Manage Qualifications</Link></li>
                    </>
                  )}
                  
                  <li><button onClick={signOut} className="hover:text-blue-400">Sign out</button></li>
                </>
              )}
              
              {!IS_AUTHENTICATED && (
                <li><Link to="/auth/signin" className="hover:text-blue-400">Sign in</Link></li>
              )}
            </ul>
          </nav>
        </div>
      </div>

      <hr className="my-4 border-gray-600" />

      <p className="text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} AUT Events. All rights reserved.
      </p>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button 
          onClick={scrollToTop}
          className="fixed bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-all duration-300 transform"
          aria-label="Back to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}
    </footer>
  );
};

export default Footer;
