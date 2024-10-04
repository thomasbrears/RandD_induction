import React, { useState}  from 'react';
import { UserForm } from '../../components/UserForm';
import { createNewUser } from '../../api/UserApi';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';

const AddUser = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const {user} = useAuth();

  const handleSubmit = (submittedUser) => {
    if(user){
     createNewUser(user, submittedUser)
     .then(() => {
       alert("User created successfully!");
       
     })
     .catch((err) => console.error(err));
    }
  }; 

  return (
    <div>
      <h1>Admin AddUser</h1>
      <p>Only admins can access this AddUser.</p>

      <h1>{"Edit User"}</h1>
      <UserForm userData={newUser} onSubmit={handleSubmit} />
    </div>
  );
};

export default AddUser;