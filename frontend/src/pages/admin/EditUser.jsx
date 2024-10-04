import React, { useState, useEffect } from 'react';
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser } from "../../api/UserApi";

const EditUser = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const uid = location.state?.uid; 

  useEffect(() => {
    if (uid && !loading) {
      const fetchUsers = async () => {
        try {
          const userData = await getUser(user, uid);
          setViewedUser(userData);
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      };
      fetchUsers();
    }
    
  }, [uid, navigate, user, loading]);

  const handleSubmit = (userData) => {
    if(user){
      updateUser(user, userData)
      .then(() => {
        alert("User updated successfully!");
        
      })
      .catch((err) => console.error(err));
     }
  }; 

  return (
    <div>
      <h1 className = "underline">Admin Edit User</h1>
      <p>Only admins can access this Edit User.</p>

      <h1>{"Edit User"}</h1>
      <UserForm userData={viewedUser} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditUser;