import React from 'react';
import useAuth from '../hooks/useAuth'; 
import '../style/Footer.css'; 

const Footer = () => {
  const { user, signOut } = useAuth(); 
  const isAuthenticated = !!user; 
  const isAdmin = user?.role === 'admin';

  const handlesignOut = (event) => {
    event.preventDefault(); // Prevent the default anchor behavior
    signOut(); // Call the signOut function to sign out the user
    window.location.href = '/'; // Redirect to the homepage
  };

  return (
    <footer>
      <div className="footer-container">
        <div className="footer-logo">
          <img 
            src={`${process.env.PUBLIC_URL}/images/AUTEvents_ReverseLogo2019-01.jpg`}  
            alt="AUT Events Logo" 
          />
          <span style={{ lineHeight: '80px', fontSize: '2rem' }}>Inductions</span>
        </div>

        <div className="footer-nav">
          <a href="/">Home</a>
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          
          {isAuthenticated && (
            <>
              {/* Show Users Induction Results link if the user is an admin */}
              {isAdmin ? (
                <a href="http://localhost:3000/admin/induction-results">User Induction Results</a>
              ) : (
                <a href="/my-inductions">My Inductions</a>
              )}
              
              {/* Dynamic sign-out link */}
              <a href="#" onClick={handlesignOut}>Sign Out</a> {/* Updated to handlesignOut */}
            </>
          )}

          {!isAuthenticated && (
            <a href="/signin">Sign-in</a>
          )}
          
          <a href="https://www.autevents.co.nz/" target="_blank" rel="noopener noreferrer">AUT Events Website</a>
        </div>
        
        <p className="footer-text">
          <hr />
          <br />
          &copy; {new Date().getFullYear()} AUT Events. All rights reserved. <br /> Events is a division of AUT Commercial Services.
        </p>
        
        <div className="footer-spacer"></div>
      </div>
    </footer>
  );
};

export default Footer;
