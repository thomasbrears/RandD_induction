import React from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const Navbar = () => {
  const { user, signOut } = useAuth();

  return (
    <nav className="bg-gray-800 text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">AUT Events</Link>
        <div>
          <Link to="/" className="mr-4">Home</Link>
          <Link to="/contact" className="mr-4">Contact</Link>
          {user ? (
            <>
              <Link to="/formlist" className="mr-4">My Forms</Link>
              {user.role === 'admin' && (
                <Link to="/admin/dashboard" className="mr-4">Admin</Link>
              )}
              <button onClick={signOut} className="bg-red-500 px-2 py-1 rounded">Sign Out</button>
            </>
          ) : (
            <Link to="/signin" className="bg-blue-500 px-2 py-1 rounded">Sign In</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
