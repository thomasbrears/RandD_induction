import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; 
import '../style/Footer.css'; 

const Footer = () => {
  const { user, signOut } = useAuth(); 
  const IS_AUTHENTICATED = !!user; 
  const IS_ADMIN_OR_MODERATOR = user?.role === 'admin' || user?.role === 'manager'; // Check for admin or manager

  return (
    <footer>
      <div className="footer-container">
        <div className="footer-logo">
          <img src={`/images/AUTEventsInductionPortal.jpg`} alt="AUT Events Induction Portal"/>
        </div>

        <div className="footer-nav">
          <Link to="/">Home</Link>
          <Link to="/contact">Contact us</Link>
          <a href="https://www.autevents.co.nz/" target="_blank">AUT Events Website</a>
          
          {IS_AUTHENTICATED && (
            <>
              {IS_ADMIN_OR_MODERATOR ? (
                // Admin or Moderator links
                <div>
                  <Link to="/management/dashboard">Dashboard</Link>
                  <Link to="/management/inductions/view">Manage Inductions</Link>
                  <Link to="/management/inductions/results">View Induction Results</Link>
                  <Link to="/management/users/view">Manager Users</Link>

                </div>
              ) : (
                // Standard user link
                <Link to="/inductions/my-inductions">My Inductions</Link>
              )}
              
              <button onClick={signOut}>Sign Out </button>
            </>
          )}

          {!IS_AUTHENTICATED && (
            <Link to="/auth/signin">Sign-in</Link>
          )}
          
        </div>
        
        <p className="footer-text">
          <hr />
          <br />
          &copy; {new Date().getFullYear()} AUT Events. All rights reserved. <br /> AUT Events is a division of Auckland University of Technology Commercial Services.
        </p>
        
        <div className="footer-spacer"></div>
      </div>
    </footer>
  );
};

export default Footer;
