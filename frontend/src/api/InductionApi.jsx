import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const getAllInductions = async (user) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/api/inductions`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching inductions:", error);
    throw error; 
  }
};

//User query?
export const getAssignedInductions = async (user, uid) => {
  try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.get(`${API_URL}/api/get-assigned-inductions`,{
          headers,
          params: { uid },
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned inductions:", error);
    throw error; 
  }
};

export const createNewInduction = async (user, inductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};

    const response = await axios.post(
      `${API_URL}/api/create-induction`,
      inductionData,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching assigned inductions:", error);
    throw error; 
  }
};

export const getInduction = async (user, id) => {
  try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      const response = await axios.get(`${API_URL}/api/get-induction`,{
          headers,
          params: { id },
      });
    return response.data;
  } catch (error) {
    console.error("Error fetching induction:", error);
    throw error; 
  }
};
