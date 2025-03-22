import axios from 'axios';

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
    // Handle case where user or ID may be undefined/null
    // Instead of throwing immediately, log and continue
    if (!idParam) {
      console.warn("No ID parameter provided to getInduction");
      return null;
    }
    
    if (!user) {
      console.warn("No user provided to getInduction");
      return null;
    }

    const token = user?.token;
    if (!token) {
      console.warn("No token available in user object");
    }
    
    const headers = token ? {authtoken: token}: {};
    
    // First, try to get the assigned induction if it looks like an assignment ID
    // (assignment IDs typically contain underscores)
    if (idParam && idParam.includes('_')) {
      try {
        const assignmentResponse = await axios.get(`${API_URL}/users/get-assigned-induction`, {
          headers,
          params: { assignmentID: idParam }
        });
        
        if (assignmentResponse.data && assignmentResponse.data.induction) {
          return assignmentResponse.data.induction;
        }
      } catch (assignmentError) {
        console.log("Assignment endpoint failed, trying induction endpoint...", assignmentError.message);
        // Continue to the regular induction endpoint
      }
      
      // If assignment approach fails, try to extract the induction ID from the assignment ID
      const parts = idParam.split('_');
      if (parts.length >= 2) {
        const extractedId = parts[1]; // Second part might be the induction ID
        
        try {
          const extractedResponse = await axios.get(`${API_URL}/inductions/get-induction`, {
            headers,
            params: { id: extractedId }
          });
          
          if (extractedResponse.data) {
            return extractedResponse.data;
          }
        } catch (extractedError) {
          console.log("Extracted ID attempt failed, trying original ID", extractedError.message);
          // Continue to try with the original ID
        }
      }
    }
    
    // Default approach - try with the ID as provided

    const response = await axios.get(`${API_URL}/inductions/get-induction`, {
      headers,
      params: { id: idParam },
    });
    
    if (response.data) {
      return response.data;
    }
    
    return null;
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

export const deleteInduction = async (user, idParam) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.delete(`${API_URL}/inductions/delete-induction`, {
      headers,
      params: { id: idParam },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting induction:", error);
    throw error;
  }
};

