import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { FaCaretDown } from 'react-icons/fa';

const Navbar = () => {
  const { user, signOut, loading } = useAuth(); // Get the user object and signOut function from the useAuth hook
  const [showBar, setShowBar] = useState(true); // State for showing the top signin prompt bar
  const [isOpen, setMobileMenuOpen] = useState(false); // State for mobile menu toggle
  const [userDropdownOpen, setUserDropdownOpen] = useState(false); // User dropdown toggle
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false); // Admin dropdown toggle
  const [managerDropdownOpen, setManagerDropdownOpen] = useState(false); // Admin dropdown toggle

  // Function to handle closing the user and admin dropdown
  const handleLinkClick = () => {
    setUserDropdownOpen(false);
    setAdminDropdownOpen(false);
    setManagerDropdownOpen(false);
    setMobileMenuOpen(false);
  };


  return (
    <>
      {!loading && !user && showBar && (
        <div className="bg-blue-800 text-white p-2 text-center relative">
          <Link to="/auth/signin" className="font-bold">
            Welcome to the AUT Events Induction Portal! Please Sign in to complete your inductions. →
          </Link>
          <button
            onClick={() => setShowBar(false)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white hover:text-black"
          >
            ✕
          </button>
        </div>
      )}
      <nav className="bg-black text-white">
        <div className="max-w-5xl mx-auto flex justify-between items-center px-4 py-2">
          <Link to="/">
            <img
              src={`${process.env.PUBLIC_URL}/images/AUTEventsInductionPortal.jpg`}
              alt="AUT Events Induction Portal"
              style={{ height: '60px' }}
              onClick={handleLinkClick}
            />
          </Link>
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-white hover:text-blue-400" onClick={handleLinkClick}>Home</Link>
            <Link to="/contact" className="text-white hover:text-blue-400" onClick={handleLinkClick}>Contact</Link>
            {user ? (
              <>
                <Link to="/inductions/my-inductions" className="text-white  hover:text-blue-400" onClick={handleLinkClick}>My Inductions</Link>
                {/* Admin Dropdown Links */}
                {user.role === 'admin' && (
                  <div className="relative">
                  <button
                    onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                    className="flex items-center text-white hover:text-blue-400 focus:outline-none"
                  >Administrator <FaCaretDown className="ml-1" />
                  </button>
                  
                  {adminDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-2">
                      <Link to="/management/dashboard" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Dashboard</Link>
                      <Link to="/management/users/view" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Manage Users</Link>
                      <Link to="/management/inductions/results" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Results</Link>
                      <Link to="/management/inductions/view" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Inductions</Link>
                      <Link to="/admin/settings" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Settings</Link>
                    </div>
                  )}
                </div>
                )}

                {/* Manager Dropdown Links */}
                {user.role === 'manager' && (
                  <div className="relative">
                  <button
                    onClick={() => setManagerDropdownOpen(!managerDropdownOpen)}
                    className="flex items-center text-white hover:text-blue-400 focus:outline-none"
                  >Manager <FaCaretDown className="ml-1" />
                  </button>
                  
                  {managerDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 py-2">
                      <Link to="/management/dashboard" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Dashboard</Link>
                      <Link to="/management/users/view" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Manage Users</Link>
                      <Link to="/management/inductions/results" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Results</Link>
                      <Link to="/management/inductions/view" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}>Inductions</Link>
                      </div>
                  )}
                </div>
              )}
                
              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center text-white hover:text-blue-400 focus:outline-none"
                > Kia ora, {user.displayName ? user.displayName.split(" ")[0] : ""} <FaCaretDown className="ml-1" />
                </button>
                
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10">
                    <Link to="/account/manage" className="block px-4 py-2 text-black hover:bg-gray-200" onClick={handleLinkClick}> Manage my Account
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        handleLinkClick();
                      }}
                      className="w-full text-left px-4 py-2 text-black hover:bg-gray-200"
                    >Sign Out
                    </button>
                  </div>
                )}
              </div>
              </>
            ) : (
              <Link to="/auth/signin" className="bg-blue-800 text-white hover:text-blue-400 px-2 py-1 rounded" >Sign In</Link>
            )}
          </div>

          {/* Mobile Menu Button (Hamburger to "X") */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!isOpen)} className="relative w-8 h-8 flex flex-col items-center justify-center">
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 my-1 ${isOpen ? "opacity-0" : "opacity-100"}`} />
              <div className={`bg-white w-8 h-1 rounded transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden px-4 pb-3 space-y-1 bg-black">
            <Link to="/" className="block text-white hover:text-blue-400" onClick={handleLinkClick}>Home</Link>
            <Link to="/contact" className="block text-white hover:text-blue-400" onClick={handleLinkClick}>Contact</Link>
            {user ? (
              <>
                <Link to="/inductions/my-inductions" className="block text-white hover:text-blue-400" onClick={handleLinkClick}>My Inductions</Link>
                
                {/* Admin Links (expanded in mobile view) */}
                {user.role === 'admin' && (
                  <div className="mt-2">
                    <p className="text-blue-400">Administrator</p>
                    <Link to="/management/dashboard" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Dashboard</Link>
                    <Link to="/management/users/view" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Manage Users</Link>
                    <Link to="/management/inductions/results" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Results</Link>
                    <Link to="/management/inductions/view" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Inductions</Link>
                    <Link to="/admin/settings" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Settings</Link>
                  </div>
                )}
                
                {/* Manager Links (expanded in mobile view) */}
                {user.role === 'manager' && (
                  <div className="mt-2">
                    <p className="text-blue-400">Manager</p>
                      <Link to="/management/dashboard" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Dashboard</Link>
                      <Link to="/management/users/view" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Manage Users</Link>
                      <Link to="/management/inductions/results" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Results</Link>
                      <Link to="/management/inductions/view" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Inductions</Link>
                    </div>
                )}

                {/* User Links */}
                <div className="mt-2">
                  <p className="text-blue-400">Kia ora, {user.displayName ? user.displayName.split(" ")[0] : ""}</p>
                  <Link to="/account/manage" className="block text-white hover:text-blue-400 px-4" onClick={handleLinkClick}>Manage my Account</Link>
                  <button
                    onClick={() => {
                      signOut();
                      handleLinkClick();
                    }}
                    className="block text-white hover:text-blue-400 px-4 text-left w-full"
                  >Sign Out</button>
                </div>
              </>
            ) : (
              <Link to="/auth/signin" className="block bg-blue-800 text-white hover:text-blue-400 px-2 py-1 rounded" onClick={handleLinkClick}>
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
