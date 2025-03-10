import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Footer = () => {
  const { user, signOut } = useAuth();
  const IS_AUTHENTICATED = !!user;
  const IS_ADMIN_OR_MODERATOR = user?.role === 'admin' || user?.role === 'manager';

  return (
    <footer className="bg-black text-white py-6">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <img src={`/images/AUTEventsInductionPortal.jpg`} alt="AUT Events Induction Portal" className="max-w-[150px]" />
        </div>

        {/* Footer Navigation Links */}
        <div className="flex flex-wrap justify-center md:justify-end gap-5 md:gap-5">
          <Link to="/" className="hover:text-blue-400">Home</Link>
          <Link to="/contact" className="hover:text-blue-400">Contact us</Link>
          <a href="https://www.autevents.co.nz/" target="_blank" rel="noopener noreferrer" className="hover:text-blue-400">
            AUT Events Website
          </a>

          {IS_AUTHENTICATED && (
            <>
              {IS_ADMIN_OR_MODERATOR ? (
                <div className="flex flex-wrap gap-6">
                  <Link to="/management/dashboard" className="hover:text-blue-400">Dashboard</Link>
                  <Link to="/management/inductions/view" className="hover:text-blue-400">Manage Inductions</Link>
                  <Link to="/management/inductions/results" className="hover:text-blue-400">View Induction Results</Link>
                  <Link to="/management/users/view" className="hover:text-blue-400">Manage Users</Link>
                  <Link to="/management/contact-submissions" className="hover:text-blue-400">Contact Submissions</Link>
                </div>
              ) : (
                <Link to="/inductions/my-inductions" className="hover:text-blue-400">My Inductions</Link>
              )}

              <button onClick={signOut} className="hover:text-blue-400">Sign out</button>
            </>
          )}

          {!IS_AUTHENTICATED && (
            <Link to="/auth/signin" className="hover:text-blue-400">Sign-in</Link>
          )}
        </div>
      </div>

      <hr className="my-4 border-gray-600" />

      <p className="text-center text-sm text-gray-400">
        &copy; {new Date().getFullYear()} AUT Events. All rights reserved. <br />
      </p>
    </footer>
  );
};

export default Footer;