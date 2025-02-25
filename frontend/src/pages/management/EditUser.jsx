import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser } from "../../api/UserApi";
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import { MdManageAccounts } from 'react-icons/md';
import { Result, Button } from 'antd';
import Loading from "../../components/Loading";

const EditUser = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [userUpdated, setUserUpdated] = useState(false);
  const [updatedUser, setUpdatedUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const uid = location.state?.uid;

  useEffect(() => {
    if (uid && !authLoading) {
      const fetchUser = async () => {
        try {
          setLoading(true);
          setLoadingMessage(`Loading the user's details...`);
          const userData = await getUser(user, uid);
          setViewedUser(userData);
        } catch (err) {
          toast.error(err.response?.data?.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      fetchUser();
    } else if (!authLoading) {
      toast.error("No user was selected. Please select a user to edit.");
      setTimeout(() => navigate("/management/users/view"), 1000);
    }
  }, [uid, user, authLoading, navigate]);

  const handleSubmit = (userData) => {
    if (user) {
      updateUser(user, userData)
        .then(() => {
          toast.success("User updated successfully!", { position: "top-right", autoClose: 3000 });
          setUpdatedUser({
            uid: userData.uid,
            firstName: userData.firstName,
            lastName: userData.lastName,
            displayName: `${userData.firstName} ${userData.lastName}`,
          });
          setUserUpdated(true);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message || "An error occurred");
        });
    }
  };

  const handleManageInductions = (uid) => {
    navigate("/management/users/inductions", { state: { uid } });
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
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        <div className="flex-1 ml-6 md:ml-8 p-6">
          {loading ? (
            <Loading message={loadingMessage} />
          ) : userUpdated && updatedUser ? (
            // Success message screen with buttons
            <Result
              status="success"
              title={`${updatedUser.displayName}'s details have been updated!`}
              subTitle="What would you like to do next?"
              extra={[
                <Button type="primary" key="assign" onClick={() => navigate("/management/users/inductions", { state: { uid: updatedUser.uid } })}>
                  Manage {updatedUser.firstName}'s Inductions
                </Button>,
                <Button key="edit-again" onClick={() => setUserUpdated(false)}>
                  Edit {updatedUser.firstName} again
                </Button>,
                <Button key="view-users" onClick={() => navigate("/management/users/view")}>
                  View All Users
                </Button>,
              ]}
            />
          ) : (
            <>
              {/* Edit User Form */}
              <UserForm userData={viewedUser} onSubmit={handleSubmit} />

              {/* Large Manage Induction Button */}
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => handleManageInductions(viewedUser.uid)}
                  className="mt-8 text-lg text-white text-bold px-6 py-3 border-2 rounded-lg bg-blue-500 
                            transition-all duration-300 transform hover:border-blue-500 hover:bg-inherit  hover:text-gray-700 
                            shadow-md"
                >
                  <MdManageAccounts className="inline mr-3 " />
                  Click here to manage and assign inductions for {viewedUser.firstName || 'User'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default EditUser;