import React from 'react';
import { useState} from "react";
import { DefaultNewUser } from '../models/User';
import { UserForm } from '../components/UserForm';
import { createNewUser } from '../api/UserApi';
import useAuth from '../hooks/useAuth';

const HomePage = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const {user, loading} = useAuth();

  const handleSubmit = (submittedUser) => {
     if(user){
      createNewUser(user, submittedUser)
      .then(() => {
        alert("User created successfully!");
        
      })
      .catch((err) => console.error(err));
     }
  }  
    
  return (
    <div>
      <h1>Welcome to the Induction App</h1>
      <p>This is a public page. Please sign in to view your induction forms.</p>

        <h1>{"Edit User"}</h1>
      <UserForm userData={newUser} onSubmit={handleSubmit} />
    </div>
  );
};

export default HomePage;