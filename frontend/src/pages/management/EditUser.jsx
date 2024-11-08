import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser, sendPasswordResetEmail, setPassword  } from "../../api/UserApi";
import { toast } from 'react-toastify';
import PageHeader from '../../components/PageHeader';

const EditUser = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
  const [showSetPassword, setShowSetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
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
        } catch (err) {
          const errorMessage = err.response?.data?.message || "An error occurred";
          toast.error(errorMessage);
        }
      };
      fetchUsers();
    }else if(!loading){
      setTimeout(() => {
        navigate("/admin/view-users");
      }, 3000);

      const errorMessage = "An error occurred, no user was selected.";
      toast.error(errorMessage);
    }
    
  }, [uid, navigate, user, loading]);

  const handleSubmit = (userData) => {
    if(user){
      updateUser(user, userData)
      .then(() => {
        toast.success('User updated sucessfully!', { position: 'top-right', autoClose: 3000, });
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
      <Helmet><title>Edit User | AUT Events Induction Portal</title></Helmet>
      <PageHeader 
        title="Edit User" 
        subtext="Update user details or assign new induction(s)" 
      />
      <div className="p-6">
        <UserForm userData={viewedUser} onSubmit={handleSubmit} />
      </div>
    </>
  );
};

export default EditUser;