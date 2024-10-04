import { useState, useEffect } from "react";
import Select from "react-select";
import Permissions from "../models/Permissions";
import { DefaultNewUser } from "../models/User";
import Positions from "../models/Positions";
import Locations from "../models/Locations";

export const UserForm = ({ userData = DefaultNewUser, onSubmit }) => {
  const [user, setUser] = useState(DefaultNewUser);
  //note: input validation to make sure that the first and last name are not empty
  useEffect(() => {
    setUser({
      uid: userData.uid,
      firstName: userData.firstName || "",
      lastName: userData.lastName || "",
      email: userData.email || "",
      permission: userData.permission || "",
      position: userData.position || "",
      locations: userData.locations || [],
    });
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

  const handlePositionsChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      position: e.target.value,
    }));
  };

  const handleLocationsChange = (selectedOptions) => {
    const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
    
    setUser((prevUser) => ({
      ...prevUser,
      locations: selectedValues,
    }));
  };

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

      <select
        name="position"
        value={user.position}
        onChange={handlePositionsChange}
      >
        {Object.values(Positions).map((perm) => (
          <option key={perm} value={perm}>
            {perm.charAt(0).toUpperCase() + perm.slice(1)}
          </option>
        ))}
      </select>

      <Select
        isMulti
        name="locations"
        options={Object.values(Locations).map((loc) => ({
          value: loc,
          label: loc.charAt(0).toUpperCase() + loc.slice(1),
        }))}
        value={user.locations.map((loc) => ({
          value: loc,
          label: loc.charAt(0).toUpperCase() + loc.slice(1),
        }))}
        onChange={handleLocationsChange}
      />

      <button type="submit">
        {userData._id ? "Save Changes" : "Create User"}
      </button>
    </form>
  );
};
