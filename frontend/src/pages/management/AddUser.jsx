import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { UserForm } from "../../components/UserForm";
import { createNewUser } from "../../api/UserApi";
import { DefaultNewUser } from "../../models/User";
import useAuth from "../../hooks/useAuth";
import { toast } from "react-toastify";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { useNavigate } from "react-router-dom";
import { Result, Button } from "antd";

const AddUser = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const { user } = useAuth();
  const [createdUser, setCreatedUser] = useState(null); // ✅ Added state for the created user
  const [userCreated, setUserCreated] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (submittedUser) => {
    if (user) {
      createNewUser(user, submittedUser)
        .then((createdUser) => {
          toast.success("User created successfully!");

          // Save the created users info in state
          setCreatedUser({
            uid: createdUser.uid,
            firstName: submittedUser.firstName,
            lastName: submittedUser.lastName,
            displayName: `${submittedUser.firstName} ${submittedUser.lastName}`,
          });
          setUserCreated(true);
        })
        .catch((err) => {
          const errorMessage = err.message || "An error occurred";
          toast.error(errorMessage);
        });
    }
  };

  return (
    <>
      <Helmet>
        <title>Create a User | AUT Events Induction Portal</title>
      </Helmet>

      {/* Page Header */}
      <PageHeader title="Create User" subtext="Let's create and welcome a new user!" />

      <div className="flex px-4 md:px-0 bg-gray-50">
        <div className="">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 mb-4">
          {/* Show success message if user is created or display the user form when creating a new user*/}
          {userCreated && createdUser ? (
            // Success Message screen with buttons
            <Result
              status="success"
              title={`${createdUser.displayName}'s account has been created!`}
              subTitle="What would you like to do next?"
              extra={[
                <Button
                  type="primary"
                  key="assign"
                  onClick={() => navigate("/management/users/inductions", { state: { uid: createdUser.uid } })}
                >
                  Assign Induction(s) to {createdUser.firstName}
                </Button>,
                <Button
                  key="create-new"
                  onClick={() => {
                    setUserCreated(false);
                    setCreatedUser(null);
                    setNewUser(DefaultNewUser);
                  }}
                >
                  Create Another User
                </Button>,
                <Button
                  key="view-users"
                  onClick={() => navigate("/management/users/view")}
                >
                  View All Users
                </Button>,
              ]}
            />
          ) : (
            // create user Form
            <UserForm userData={newUser} onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </>
  );
};

export default AddUser;
