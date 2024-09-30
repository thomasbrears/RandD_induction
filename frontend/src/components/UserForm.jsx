import { useState, useEffect } from "react";
import Permissions from "../models/Permissions";
//import Locations from "../models/Locations";
//import Positions from "../models/Positions";
import { DefaultNewUser } from "../models/User";

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
    const [user, setUser] = useState(userData);
  
    useEffect(() => {
      setUser(userData);
    }, [userData]);
    
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const handlePermissionsChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      permission: e.target.value,
    }));
  };

  const handleLocationsChange = (newLocations) => {
    setUser((prevUser) => ({
      ...prevUser,
      locations: newLocations,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(user);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="firstName"
        value={user.firstName}
        onChange={handleInputChange}
        placeholder="First Name"
      />
      <input
        type="text"
        name="lastName"
        value={user.lastName}
        onChange={handleInputChange}
        placeholder="Last Name"
      />
      <input
        type="email"
        name="email"
        value={user.email}
        onChange={handleInputChange}
        placeholder="Email"
      />
      <select
        name="permission"
        value={user.permission}
        onChange={handlePermissionsChange}
      >
        {Object.values(Permissions).map((perm) => (
          <option key={perm} value={perm}>
            {perm.charAt(0).toUpperCase() + perm.slice(1)}
          </option>
        ))}
      </select>
      {/* Render other fields such as Positions, Locations, etc. */}
      <button type="submit">
        {userData._id ? "Save Changes" : "Create User"}
      </button>
    </form>
  );
};