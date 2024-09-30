import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showBar, setShowBar] = useState(true);

  return (
    <>
      {!user && showBar && (
        <div className="bg-blue-500 text-white p-2 text-center relative">
          <Link to="/signin" className="font-bold">Sign in to access all features</Link>
          <button 
            onClick={() => setShowBar(false)} 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}
      <nav className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/images/AUTEventsAndVenuesBlackLogo.jpg`}
              alt="AUT Events"
              style={{ height: '50px' }}
            />
          </Link>
          <div>
            <Link to="/" className="mr-4 text-white">Home</Link>
            <Link to="/contact" className="mr-4 text-white">Contact</Link>
            {user ? (
              <>
                <Link to="/formlist" className="mr-4 text-white">My Forms</Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="mr-4 text-white">Admin</Link>
                )}
                <button onClick={signOut} className="bg-red-500 text-white px-2 py-1 rounded">Sign Out</button>
              </>
            ) : (
              <Link to="/signin" className="bg-blue-500 text-white px-2 py-1 rounded">Sign In</Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
