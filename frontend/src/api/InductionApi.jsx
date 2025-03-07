import axios from 'axios';

//const API_URL = process.env.REACT_APP_BACKEND_URL;
// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

export const getAllInductions = async (user) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/inductions`, {
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
      const response = await axios.get(`${API_URL}/users/get-assigned-inductions`,{
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
      `${API_URL}/inductions/create-induction`,
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

export const getInduction = async (user, assignmentID) => {
  try {
      const token = user?.token;
      const headers = token ? {authtoken: token}: {};
      
      // First get the assigned induction details
      const assignedResponse = await axios.get(`${API_URL}/users/get-assigned-induction`,{
          headers,
          params: { assignmentID },
      });
      
      // If the API doesn't have a specific endpoint for getting an assigned induction,
      // we would need to get the induction ID from the assignment and then get the induction details
      const induction = assignedResponse.data?.induction;
      
      if (!induction) {
        throw new Error('Failed to get induction details');
      }
      
      return induction;
  } catch (error) {
    console.error("Error fetching induction:", error);
    throw error; 
  }
};
