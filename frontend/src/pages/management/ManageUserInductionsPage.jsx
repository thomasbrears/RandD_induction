import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser, sendPasswordResetEmail, setPassword  } from "../../api/UserApi";
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import UserInductionManagement from '../../components/management/UserInductionManagement';

const ManageUserInductionPage = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const uid = location.state?.uid; 

  useEffect(() => {
    if (uid && !authLoading) {
      const fetchUsers = async () => {
        try {
          setLoading(true);
          setLoadingMessage(`Loading the users inductions...`);

          const userData = await getUser(user, uid);
          setViewedUser(userData);
        } catch (err) {
          const errorMessage = err.response?.data?.message || "An error occurred";
          toast.error(errorMessage);
        } finally {
          setLoading(false);
        }
      };
      fetchUsers();
    }else if(!authLoading){
      setTimeout(() => {
        navigate("/management/users/view");
      }, 1000);

      const errorMessage = "No user was selected. Please select a user to edit.";
      toast.error(errorMessage);
    }
    
  }, [uid, navigate, user, authLoading]);

  const handleSubmit = (userData) => {
    if(user){
      updateUser(user, userData)
      .then(() => {
        toast.success('Inductions updated sucessfully!', { position: 'top-right', autoClose: 3000, });
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || "An error occurred";
          toast.error(errorMessage);
        console.error(err);
      });
     }
  }; 

  return (
    <>
      <Helmet><title>Manage Inductions | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title={`Manage Inductions for ${viewedUser.firstName || 'User'} ${viewedUser.lastName || 'User'}`} 
        subtext={`View, Update or Assign new induction(s) for ${viewedUser.firstName || 'User'}`} 
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          {loading ? (
            <p className="text-gray-600">{loadingMessage}</p>
          ) : (
            <UserInductionManagement userData={viewedUser} onSubmit={handleSubmit} />
          )}
        </div>
      </div>
    </>
  );
};

export default ManageUserInductionPage;