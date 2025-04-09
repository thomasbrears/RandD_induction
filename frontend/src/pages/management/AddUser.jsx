import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
import { UserForm } from "../../components/UserForm";
import { createNewUser } from "../../api/UserApi";
import { DefaultNewUser } from "../../models/User";
import useAuth from "../../hooks/useAuth";
import { notifyError, notifySuccess } from "../../utils/notificationService";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";
import { useNavigate } from "react-router-dom";
import { Result, Button, Typography, Space, Skeleton, Card, Divider, Row, Col, Form } from "antd";
import { UserAddOutlined, CheckCircleOutlined, ArrowRightOutlined, UsergroupAddOutlined } from '@ant-design/icons';

const { Title } = Typography;

const AddUser = () => {
  const [newUser, setNewUser] = useState(DefaultNewUser);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const [createdUser, setCreatedUser] = useState(null);
  const [userCreated, setUserCreated] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (submittedUser) => {
    if (user) {
      setIsLoading(true);
      createNewUser(user, submittedUser)
        .then((createdUser) => {
          notifySuccess("User created successfully");

          // Save the created user's info in state
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
          notifyError("Failed to create user", errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <>
      <Helmet>
        <title>Create a User | AUT Events Induction Portal</title>
      </Helmet>

      {/* Page Header */}
      <PageHeader 
        title="Create User" 
        subtext="Let's create and welcome a new user!" 
      />

      <div className="flex px-4 md:px-0 bg-gray-50">
        <div className="">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 mb-4 mx-4">
        {isLoading ? (
          <Card className="mx-auto max-w-4xl shadow-lg mt-6">
            <div className="space-y-4">
              <div className="flex items-center mb-3">
                <Skeleton.Input active style={{ width: '180px', height: '24px' }} />
              </div>
              <Divider />
              
              {/* Form fields */}
              <div className="space-y-4">
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
                <Skeleton.Input active style={{ width: '100%', height: '40px' }} />
              </div>
              
              <div className="flex justify-end mt-4">
                <Skeleton.Button active style={{ width: 120, height: 40 }} />
              </div>
            </div>
          </Card>
          ) : userCreated && createdUser ? (
            // Success Message screen with buttons
            <Result
              status="success"
              icon={<CheckCircleOutlined />}
              title={<Title level={3}>{`${createdUser.displayName}'s account has been created!`}</Title>}
              subTitle="What would you like to do next?"
              extra={
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate("/management/users/inductions", { state: { uid: createdUser.uid } })}
                    size="large"
                    block
                  >
                    Assign Induction(s) to {createdUser.firstName}
                  </Button>
                  <Button
                    icon={<UserAddOutlined />}
                    onClick={() => {
                      setUserCreated(false);
                      setCreatedUser(null);
                      setNewUser(DefaultNewUser);
                    }}
                    size="large"
                    block
                  >
                    Create Another User
                  </Button>
                  <Button
                    icon={<UsergroupAddOutlined />}
                    onClick={() => navigate("/management/users/view")}
                    size="large"
                    block
                  >
                    View All Users
                  </Button>
                </Space>
              }
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