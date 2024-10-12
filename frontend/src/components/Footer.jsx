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
          <a href="http://localhost:3000/">Home</a>
          <a href="/about">About</a>
          <a href="http://localhost:3000/contact">Contact</a>
          
          {isAuthenticated && (
            <a href="/my-inductions">My Inductions</a>
          )}

          <a href="http://localhost:3000/signin">Login/Logout</a>
          <a href="https://www.autevents.co.nz/" target="_blank" rel="noopener noreferrer">AUT Events Website</a>
        </div>
        
        <p className="footer-text">
          &copy; {new Date().getFullYear()} AUT Events. All rights reserved. AUT Events is a division of AUT Commercial Services
        </p>
        
        <div className="footer-spacer"></div>
      </div>
    </footer>
  );
};

export default Footer;