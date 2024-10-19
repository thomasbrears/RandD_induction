import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FaBars } from 'react-icons/fa';

const Navbar = () => {
  const { user, signOut } = useAuth();
  const [showBar, setShowBar] = useState(true);
  const [isOpen, setIsOpen] = useState(false); // State for mobile menu toggle

  return (
    <>
      {!user && showBar && (
        <div className="bg-blue-800 text-white p-2 text-center relative">
          <Link to="/signin" className="font-bold">
            Welcome to the AUT Events Induction Portal! Please Sign in to complete your inductions. →
          </Link>
          <button
            onClick={() => setShowBar(false)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-black"
          >✕
          </button>
        </div>
      )}
      <nav className="bg-black text-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4 py-2">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/images/AUTEventsInductionPortal.jpg`}
              alt="AUT Events Indcution Portal"
              style={{ height: '60px' }}
            />
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-blue-400" >Home</Link>
            <Link to="/contact" className="text-white hover:text-blue-400">Contact</Link>
            {user ? (
              <>
                <Link to="/inductions" className="text-white  hover:text-blue-400">My Inductions</Link>
                {user.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-white  hover:text-blue-400">Admin</Link>
                )}
                <button
                  onClick={signOut}
                  className="bg-red-800 text-white hover:bg-red-900 px-2 py-1 rounded"
                >Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/signin"
                className="bg-blue-800 text-white hover:text-blue-400 px-2 py-1 rounded"
              >Sign In
              </Link>
            )}
          </div>
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white focus:outline-none"
            ><FaBars size={24} /> {/* Use the FaBars icon here */}
            </button>
          </div>
        </div>
        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden px-4 pb-3 space-y-1 bg-black">
            <Link to="/" className="block text-white hover:text-blue-400">Home</Link>
            <Link to="/contact" className="block text-white hover:text-blue-400">Contact</Link>
            {user ? (
              <>
                <Link to="/inductions" className="block text-white hover:text-blue-400">My Inductions</Link>
                {user.role === 'admin' && (
                  <Link to="/admin" className="block text-white hover:text-blue-400">
                    Admin
                  </Link>
                )}
                <button
                  onClick={signOut}
                  className="w-full text-left bg-red-800 text-white hover:bg-red-900 px-2 py-1 rounded"
                >Sign Out
                </button>
              </>
            ) : (
              <Link to="/signin" className="block bg-blue-800 text-white hover:bg-blue-900 px-2 py-1 rounded">Sign In</Link>
            )}
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;
