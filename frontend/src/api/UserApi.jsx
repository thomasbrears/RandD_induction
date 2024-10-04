//rewrite and adjust
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const createNewUser = async (user, userData) => {
  try {
    const token = user?.token;
    const headers = token ? {authtoken: token}: {};
    
      const response = await axios.post(`${API_URL}/api/users/create-new-user`, userData,{
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

export const getAllUsers = async (user) => {
    try {
        const token = user?.token;
        const headers = token ? {authtoken: token}: {};
        const response = await axios.get(`${API_URL}/api/users`,{
            headers,
        });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error; 
    }
  };

export const getUser = async (user, uid) =>{
  try{
    const token = user?.token;
    const headers = token ? {authtoken: token}: {};
    const response = await axios.get(`${API_URL}/api/get-user`,{
        headers,
        params: { uid },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;  
  }
};

  
export const updateUser = async (user, userData) => {
    try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.put(`${API_URL}/api/update-user`, userData,{
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };

  export const deleteUser = async (user, uid) => {
    try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.delete(`${API_URL}/api/delete-user`,{
        headers,
        params: { uid },
      });
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };
