import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 

const Footer = () => {
  const { user, signOut } = useAuth(); 
  const IS_AUTHENTICATED = !!user; 
  const IS_ADMIN_OR_MODERATOR = user?.role === 'admin' || user?.role === 'manager'; // Check for admin or manager

  return (
    <footer className="bg-black text-white py-6">
      <div className="max-w-screen-xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
        {/* Footer Logo on top for small screens, left for larger screens */}
        <div className="flex-shrink-0 mb-4 md:mb-0">
          <img src={`/images/AUTEventsInductionPortal.jpg`} alt="AUT Events Induction Portal" className="max-w-[150px]" />
        </div>

        {/* Footer Navigation */}
        <div className="flex flex-wrap justify-center md:justify-end gap-5 md:gap-5">
          <Link to="/" className="hover:text-[#00bfff]">Home</Link>
          <Link to="/contact" className="hover:text-[#00bfff]">Contact us</Link>
          <a href="https://www.autevents.co.nz/" target="_blank" className="hover:text-[#00bfff]">AUT Events Website</a>
          
          {IS_AUTHENTICATED && (
            <>
              {IS_ADMIN_OR_MODERATOR ? (
                // Admin or Moderator links
                <div className="flex flex-wrap gap-6">
                  <Link to="/management/dashboard" className="hover:text-[#00bfff]">Dashboard</Link>
                  <Link to="/management/inductions/view" className="hover:text-[#00bfff]">Manage Inductions</Link>
                  <Link to="/management/inductions/results" className="hover:text-[#00bfff]">View Induction Results</Link>
                  <Link to="/management/users/view" className="hover:text-[#00bfff]">Manager Users</Link>
                </div>
              ) : (
                // Standard user link
                <Link to="/inductions/my-inductions" className="hover:text-[#00bfff]">My Inductions</Link>
              )}
              
              <button onClick={signOut} className="hover:text-[#00bfff]">Sign Out</button>
            </>
          )}

          {!IS_AUTHENTICATED && (
            <Link to="/auth/signin" className="hover:text-[#00bfff]">Sign-in</Link>
          )}
        </div>
      </div>

      {/* Footer Text */}
      <p className="text-center text-sm mt-6 text-gray-400">
        <hr className="my-2 border-gray-600" />
        &copy; {new Date().getFullYear()} AUT Events. All rights reserved. <br /> AUT Events is a division of Auckland University of Technology Commercial Services.
      </p>
    </footer>
  );
};

export default Footer;
