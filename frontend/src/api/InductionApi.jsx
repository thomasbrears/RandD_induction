import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getAllInductions = async (user) => {
  try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.get(`${API_URL}/api/inductions`,{
          headers,
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching inductions:", error);
    throw error; 
  }
};

export const getAssignedInductions = async (user, uid) => {
  try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.get(`${API_URL}/api/inductions`,{
          headers,
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned inductions:", error);
    throw error; 
  }
};

