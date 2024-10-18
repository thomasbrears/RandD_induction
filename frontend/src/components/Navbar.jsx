import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showBar, setShowBar] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle

  return (
    <>
      {!user && showBar && (
        <div className="bg-blue-500 text-white p-2 text-center relative">
          <Link to="/signin" className="font-bold">
            Sign in to access all features
          </Link>
          <button
            onClick={() => setShowBar(false)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>
      )}
      <nav className="bg-black text-white">
        <div className="container mx-auto flex justify-between items-center px-4 py-2">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/images/AUTEventsAndVenuesBlackLogo.jpg`}
              alt="AUT Events"
              style={{ height: '50px' }}
            />
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white">
              Home
            </Link>
            <Link to="/contact" className="text-white">
              Contact
            </Link>
            {user ? (
              <>
                <Link to="/inductions" className="text-white">
                  My Inductions
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-white">
                    Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="bg-blue-500 text-white px-2 py-1 rounded"
              >
                Sign In
              </Link>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none"
            >
              {/* Replace with a hamburger icon if preferred */}
              ☰
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden px-4 pb-3 space-y-1 bg-black">
            <Link to="/" className="block text-white">
              Home
            </Link>
            <Link to="/contact" className="block text-white">
              Contact
            </Link>
            {user ? (
              <>
                <Link to="/inductions" className="block text-white">
                  My Inductions
                </Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="block text-white">
                    Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="w-full text-left bg-red-500 text-white px-2 py-1 rounded"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="block bg-blue-500 text-white px-2 py-1 rounded"
              >
                Sign In
              </Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
