import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser } from "../../api/UserApi";
import { getUserInductions } from "../../api/UserInductionApi";
import { notifyError, notifySuccess } from '../../utils/notificationService';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import UserInductionsList from '../../components/management/UserInductionsList';
import { Result, Button, Typography, Space, Skeleton, Card, Divider, Form } from 'antd';
import { EditOutlined, CheckCircleOutlined, ArrowRightOutlined, EditFilled, UsergroupAddOutlined } from '@ant-design/icons';

const { Title } = Typography;

const EditUser = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [userUpdated, setUserUpdated] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(null);
  const [userInductionsMap, setUserInductionsMap] = useState({});
  const [loadingInductions, setLoadingInductions] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const uid = location.state?.uid;

  // Function to fetch user data
  const fetchUserData = async () => {
    if (!uid || authLoading) return;
    
    try {
      setLoading(true);
      setLoadingMessage(`Loading the user's details...`);
      const userData = await getUser(user, uid);
      setViewedUser(userData);
    } catch (err) {
      notifyError("Failed to load user details", err.response?.data?.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch of user data
  useEffect(() => {
    if (uid && !authLoading) {
      fetchUserData();
    } else if (!authLoading) {
      notifyError("No user selected", "Please select a user to edit.");
      setTimeout(() => navigate("/management/users/view"), 1000);
    }
  }, [uid, user, authLoading, navigate]);

  // Fetch user inductions
  useEffect(() => {
    if (viewedUser?.uid && !authLoading && user) {
      const fetchUserInductions = async () => {
        try {
          setLoadingInductions(true);
          const userInductionsData = await getUserInductions(user, viewedUser.uid);
          
          const inductionsMap = {};
          
          // First try to match by assignmentId
          userInductionsData.forEach(apiInduction => {
            if (apiInduction.assignmentId) {
              inductionsMap[apiInduction.assignmentId] = apiInduction;
            }
          });
          
          // Also index by inductionId for fallback matching
          userInductionsData.forEach(apiInduction => {
            if (apiInduction.inductionId) {
              inductionsMap[`induction-${apiInduction.inductionId}`] = apiInduction;
            }
          });
          
          setUserInductionsMap(inductionsMap);
          
        } catch (err) {
          console.error("Failed to load user inductions:", err);
        } finally {
          setLoadingInductions(false);
        }
      };
      
      fetchUserInductions();
    }
  }, [viewedUser, user, authLoading]);

  const handleSubmit = (userData) => {
    if (user) {
      updateUser(user, userData)
        .then(() => {
          notifySuccess("User updated successfully");
          setUpdatedUser({
            uid: userData.uid,
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: `${userData.firstName} ${userData.lastName}`,
          });
          setUserUpdated(true);
        })
        .catch((err) => {
          notifyError("Update failed", err.response?.data?.message || "An error occurred");
        });
    }
  };

  const handleEditAgain = () => {
    // Re-fetch the user data to get the latest info
    fetchUserData();
    setUserUpdated(false);
  };

  const handleManageInductions = () => {
    navigate("/management/users/inductions", { state: { uid: viewedUser.uid } });
  };

  const handleViewResults = (induction) => {
    // First try to find the corresponding userInduction by assignmentID
    let userInductionId = null;
    
    if (induction.assignmentID && userInductionsMap[induction.assignmentID]) {
      // If we have a match by assignmentID
      userInductionId = userInductionsMap[induction.assignmentID].id;
    } else if (userInductionsMap[`induction-${induction.id}`]) {
      // Fallback to matching by induction ID
      userInductionId = userInductionsMap[`induction-${induction.id}`].id;
    }
    
    if (userInductionId) {
      // If we found a matching userInduction, navigate to the results page
      navigate(`/management/results/user/${viewedUser.uid}/${userInductionId}`);
    } else {
      // If we couldn't find a match, go to the results hub
      notifyError(
        "Results not available", 
        "Could not find the results for this induction. Redirecting to the Results Hub."
      );
      setTimeout(() => {
        navigate("/management/results", { 
          state: { 
            selectedUser: viewedUser.uid 
          } 
        });
      }, 2000);
    }
  };

  return (
    <>
      <Helmet>
        <title>Edit User | AUT Events Induction Portal</title>
      </Helmet>

      <PageHeader 
        title={`Update ${viewedUser.firstName || 'User'} ${viewedUser.lastName || ''}`} 
        subtext={`Update ${viewedUser.firstName || 'User'}'s details here`} 
      />

      <div className="flex px-4 md:px-0 bg-gray-50">
        <div>
          <ManagementSidebar />
        </div>

        <div className="flex-1 mb-4 mx-4">
          {loading ? (
            <Card className="mx-auto max-w-4xl shadow-lg mt-6">
              <Skeleton.Input active size="small" style={{ width: 150, marginBottom: 16 }} />
              <Divider />
              <Form layout="vertical">
                <Skeleton.Input active style={{ width: '100%', height: 32, marginBottom: 24 }} />
                <Skeleton.Input active style={{ width: '100%', height: 32, marginBottom: 24 }} />
                <Skeleton.Input active style={{ width: '100%', height: 32, marginBottom: 24 }} />
                <div className="text-center mt-6">
                  <Skeleton.Button active style={{ width: 120, height: 40 }} />
                </div>
              </Form>
            </Card>
          ) : userUpdated && updatedUser ? (
            // Success message screen with buttons
            <Result
              status="success"
              icon={<CheckCircleOutlined />}
              title={<Title level={3}>{`${updatedUser.displayName}'s details have been updated!`}</Title>}
              subTitle="What would you like to do next?"
              extra={
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    icon={<ArrowRightOutlined />}
                    onClick={() => navigate("/management/users/inductions", { state: { uid: updatedUser.uid } })}
                    size="large"
                    block
                  >
                    Manage {updatedUser.firstName}'s Inductions
                  </Button>
                  <Button
                    icon={<EditFilled />}
                    onClick={handleEditAgain}
                    size="large"
                    block
                  >
                    Edit {updatedUser.firstName} again
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
            <div className="space-y-6">
              {/* User Form */}
              <UserForm userData={viewedUser} onSubmit={handleSubmit} />
              
              {/* Inductions List Section */}
              <UserInductionsList
                inductions={viewedUser.assignedInductions || []}
                userId={viewedUser.uid}
                onManageInductions={handleManageInductions}
                onViewResults={handleViewResults}
                loadingResults={loadingInductions}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditUser;