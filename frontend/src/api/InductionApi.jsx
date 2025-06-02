import axios from 'axios';

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // production website
  : 'http://localhost:8000/api'; // Local development

// timeout for all requests
const axiosConfig = {
  timeout: 15000 // 15 seconds timeout
};

export const getAllInductions = async (user, includeDrafts = false) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/inductions`, {
      headers,
      ...axiosConfig
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching inductions:", error);
    throw error; 
  }
};

// Get only draft inductions
export const getDraftInductions = async (user) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/inductions`, {
      headers,
      ...axiosConfig
    });
    
    // Filter to include only drafts
    return response.data.filter(induction => induction.isDraft === true);
  } catch (error) {
    console.error("Error fetching draft inductions:", error);
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
          ...axiosConfig
      });
    
    // Filter out drafts from assignments - drafts should never be assigned
    return response.data.filter(induction => !induction.isDraft);
  } catch (error) {
    console.error("Error fetching assigned inductions:", error);
    throw error; 
  }
};

export const createNewInduction = async (user, inductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    // isDraft is explicitly set to false for regular induction creation
    const finalData = {
      ...inductionData,
      isDraft: false
    };
    
    const response = await axios.post(
      `${API_URL}/inductions/create-induction`,
      finalData,
      {
        headers,
        ...axiosConfig
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating induction:", error);
    throw error; 
  }
};

// Create a draft induction
// This function is used to create a new draft induction
export const createDraftInduction = async (user, inductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    // Ensure the draft flag is set
    const draftData = {
      ...inductionData,
      isDraft: true
    };
    
    const response = await axios.post(
      `${API_URL}/inductions/create-induction`,
      draftData,
      {
        headers,
        ...axiosConfig
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating draft induction:", error);
    throw error; 
  }
};

// Save a draft induction
// This function will either create a new draft or update an existing one
export const saveDraftInduction = async (user, inductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    // Ensure we're saving as a draft
    const draftData = {
      ...inductionData,
      isDraft: true
    };
    
    if (draftData.id) {
      // Update existing draft
      const response = await axios.put(
        `${API_URL}/inductions/update-induction`,
        draftData,
        {
          headers,
          ...axiosConfig
        }
      );
      return response.data;
    } else {
      // Create new draft
      return createDraftInduction(user, draftData);
    }
  } catch (error) {
    console.error("Error saving draft induction:", error);
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
          params: { assignmentID: idParam },
          ...axiosConfig
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
            params: { id: extractedId },
            ...axiosConfig
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
      ...axiosConfig
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

// updateInduction with retry logic and validation
export const updateInduction = async (user, updatedInductionData, maxRetries = 3) => {
  let retries = 0;
  
  // Validate the data before sending to avoid obvious errors
  if (!updatedInductionData.id) {
    throw new Error("Missing induction ID");
  }
  
  // Ensure name and description are strings
  if (updatedInductionData.name && typeof updatedInductionData.name !== 'string') {
    updatedInductionData.name = String(updatedInductionData.name);
  }

  if (updatedInductionData.description && typeof updatedInductionData.description !== 'string') {
    updatedInductionData.description = String(updatedInductionData.description);
  }
  
  // Make sure name isnt too long 
  if (updatedInductionData.name && updatedInductionData.name.length > 50) {
    updatedInductionData.name = updatedInductionData.name.substring(0, 50);
  }
  
  // Clean up questions array if needed
  if (updatedInductionData.questions && !Array.isArray(updatedInductionData.questions)) {
    updatedInductionData.questions = [];
  }

  while (retries < maxRetries) {
    try {
      const token = user?.token;
      const headers = token ? { authtoken: token } : {};
            
      const response = await axios.put(
        `${API_URL}/inductions/update-induction`, 
        updatedInductionData,
        { 
          headers,
          ...axiosConfig
        }
      );
      
      return response.data;
    } catch (error) {
      retries++;
      console.error(`Error updating induction (attempt ${retries}/${maxRetries}):`, error);
      
      // If we've used all retries, throw the error
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Publish a draft induction
// This function is used to convert a draft induction into a published one
export const publishDraft = async (user, inductionData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    // Set isDraft to false and update
    const publishData = {
      ...inductionData,
      isDraft: false
    };
    
    return updateInduction(user, publishData);
  } catch (error) {
    console.error("Error publishing draft:", error);
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
      ...axiosConfig
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting induction:", error);
    throw error;
  }
};