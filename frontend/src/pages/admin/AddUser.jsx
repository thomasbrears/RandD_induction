import React, { useState} from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { UserForm } from "../../components/UserForm";
import { createNewUser } from "../../api/UserApi";
import { DefaultNewUser } from "../../models/User";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";

const AddUser = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const { user } = useAuth();

  const handleSubmit = (submittedUser) => {
    if (user) {
      createNewUser(user, submittedUser)
        .then(() => {
          toast.success("User created sucessfully!", { position: 'top-right', autoClose: 3000, });
          setNewUser(DefaultNewUser);
        })
        .catch((err) => {
          const errorMessage = err.message || "An error occurred";
          toast.error(errorMessage);
        });
    }
  };

  return (
    <>
      <Helmet><title>Create a User | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Create User" 
        subtext="Lets create and welcome a new user!" 
      />
      <div className="p-6">
        <UserForm userData={newUser} onSubmit={handleSubmit} />
      </div>
    </>
  );
}; 

export default AddUser;
