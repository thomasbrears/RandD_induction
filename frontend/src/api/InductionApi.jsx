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
  // Cancel any previous request if a new one starts
  if (window.abortController) {
    window.abortController.abort();
  }
  
  // Create a new abort controller for this request
  window.abortController = new AbortController();
  
  try {
    const token = user?.token;
    const headers = token ? {authtoken: token}: {};
    
    console.log("API: Starting induction request");
    
    // No artificial delay needed
    const assignedResponse = await axios.get(`${API_URL}/users/get-assigned-induction`, {
      headers,
      params: { assignmentID: idParam },
      signal: window.abortController.signal
    });
    
    console.log("API: Got response", !!assignedResponse?.data?.induction);
    
    if (assignedResponse.data?.induction) {
      return assignedResponse.data.induction;
    }
    
    // Important: Return null if no induction found, but don't throw error
    console.log("API: No induction found");
    return null;
  } catch (error) {
    // Don't log aborted requests as errors
    if (error.name === 'AbortError' || error.name === 'CanceledError') {
      console.log("API: Request aborted");
      return null;
    }
    
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
