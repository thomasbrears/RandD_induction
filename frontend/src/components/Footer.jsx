import React from 'react';
import useAuth from '../hooks/useAuth'; 
import '../style/Footer.css'; 

const Footer = () => {
  const { user } = useAuth(); 
  const isAuthenticated = !!user; 

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
            <a href="/my-inductions">My Inductions</a>
            // TOADD: Dynamic admin link for admins and managers
          )}

          {/*TOADD: Dynamic sign out link to users that are signed*/}

          <a href="/signin">Sign-in</a>
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