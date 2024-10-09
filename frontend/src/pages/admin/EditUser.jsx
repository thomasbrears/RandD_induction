import React, { useState, useEffect } from 'react';
import { UserForm } from '../../components/UserForm';
import { DefaultNewUser } from '../../models/User';
import useAuth from '../../hooks/useAuth';
import { useLocation, useNavigate } from 'react-router-dom';
import { getUser, updateUser } from "../../api/UserApi";
import { toast } from 'react-toastify';
import { deleteUser } from 'firebase/auth';

const EditUser = () => {
  const [viewedUser, setViewedUser] = useState(DefaultNewUser);
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
        }
      };
      fetchUsers();
    }
    
  }, [uid, navigate, user, loading]);

  const handleSubmit = (userData) => {
    if(user){
      updateUser(user, userData)
      .then(() => {
        toast.success('User updated sucessfully!', {
          position: 'bottom-left',
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
        });
      })
      .catch((err) => {
        const errorMessage = err.response?.data?.message || "An error occurred";
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
        console.error(err);
      });
     }
  }; 

  const handleDelete = () =>{
    deleteUser(user, viewedUser.uid)
    .then(() => {
      toast.success('User deleted sucessfully!', {
        position: 'bottom-left',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
      });

      setTimeout(() => {
        navigate("/admin/view-users");
      }, 3000); 
    })
    .catch((err) => {
      const errorMessage = err.response?.data?.message || "An error occurred";
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
      console.error(err);
    });
  };

  return (
    <div>
      <h1 className = "underline">Admin Edit User</h1>
      <p>Only admins can access this Edit User.</p>

      <h1>{"Edit User"}</h1>
      <button
        className='inline-block px-5 py-2.5 bg-black text-white no-underline border-none rounded cursor-pointer text-base text-center transition-colors duration-300 transform hover:bg-[#0c027d] active:scale-95 my-2.5'
        onClick={handleDelete}
        >
        
        Delete User
      </button>
      <UserForm userData={viewedUser} onSubmit={handleSubmit} />
    </div>
  );
};

export default EditUser;