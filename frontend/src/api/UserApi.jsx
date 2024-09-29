//rewrite and adjust
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const createNewUser = async (user, userData) => {
  const token = user?.token;
    const headers = token ? {authtoken: token}: {};
    try {
      const response = await axios.post(`${API_URL}/api/users/create-new-user`, userData,{
        headers,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  };

  //only working one
export const getAllUsers = async (user,loading) => {

    try {
        const token = user?.token;
        const headers = token ? {authtoken: token}: {};
        const response = await axios.get(`${API_URL}/api/users`,{
            headers,
        });
      return response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;  // Handle this appropriately in the calling component
    }
  };

  /*
export const updateUser = async (userId, userData) => {
    try {
      const response = await axios.put(`${API_URL}/api/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      console.error("Error updating user:", error);
      throw error;
    }
  };
  

  export const deleteUser = async (userId) => {
    try {
      const response = await axios.delete(`${API_URL}/api/users/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting user:", error);
      throw error;
    }
  };*/
