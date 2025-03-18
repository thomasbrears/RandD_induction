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

export const getInduction = async (user, idParam) => {
  try {
    const token = user?.token;
    const headers = token ? {authtoken: token}: {};
    
    // First attempt to get the induction from the assignment endpoint (new approach)
    try {
      const assignedResponse = await axios.get(`${API_URL}/users/get-assigned-induction`, {
        headers,
        params: { assignmentID: idParam },
      });
      
      if (assignedResponse.data?.induction) {
        return assignedResponse.data.induction;
      }
    } catch (err) {
      // If the endpoint doesn't exist or returns an error, we'll try the fallback
      console.log("Assignment endpoint failed, trying fallback...");
    }
    
    // Fallback to the direct induction endpoint (old approach)
    const response = await axios.get(`${API_URL}/inductions/get-induction`, {
      headers,
      params: { id: idParam },
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching induction:", error);
    throw error; 
  }
};

export const updateInduction = async (user, updatedInductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};

    const response = await axios.put(
      `${API_URL}/inductions/update-induction`, 
      updatedInductionData,
      { headers }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating induction:", error);
    throw error; 
  }
};
