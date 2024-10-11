import React, { useState} from "react";
import { UserForm } from "../../components/UserForm";
import { createNewUser } from "../../api/UserApi";
import { DefaultNewUser } from "../../models/User";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";

const AddUser = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const { user } = useAuth();

  const handleSubmit = (submittedUser) => {
    if (user) {
      createNewUser(user, submittedUser)
        .then(() => {
          toast.success("User created sucessfully!", {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
          setNewUser(DefaultNewUser);
        })
        .catch((err) => {
          const errorMessage = err.message || "An error occurred";
          toast.error(errorMessage, {
            position: "bottom-left",
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
            theme: "light",
          });
        });
    }
  };

  return (
    <div>
      <h1>Admin Add User</h1>
      <p>Only admins can access this Add User.</p>

      <h1>{"Add User"}</h1>
      <UserForm userData={newUser} onSubmit={handleSubmit} />
    </div>
  );
};

export default AddUser;
