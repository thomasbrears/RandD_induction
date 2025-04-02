import axios from "axios";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; 

// Assign an induction to a user
export const assignInductionToUser = async (user, data) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.post(
      `${API_URL}/user-inductions/assign`,
      data,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error assigning induction:", error);
    throw error;
  }
};

// Get all inductions assigned to a user
export const getUserInductions = async (user, userId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/user/${userId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user inductions:", error);
    throw error;
  }
};

// Get a specific user induction by ID
export const getUserInductionById = async (user, id) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/${id}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user induction:", error);
    throw error;
  }
};

export const updateUserInduction = async (user, inductionId, updateData) => {
    try {
      // Process dates to ensure they're in a format the API can handle
      const processedData = {
        ...updateData
      };
      
      // Format dates as ISO strings if they aren't already
      if (updateData.dueDate && !(typeof updateData.dueDate === 'string')) {
        processedData.dueDate = new Date(updateData.dueDate).toISOString();
      }
      
      if (updateData.availableFrom && !(typeof updateData.availableFrom === 'string')) {
        processedData.availableFrom = new Date(updateData.availableFrom).toISOString();
      }
      
      if (updateData.completedAt && !(typeof updateData.completedAt === 'string')) {
        processedData.completedAt = new Date(updateData.completedAt).toISOString();
      }
      
      const token = user?.token;
      const headers = token ? { authtoken: token } : {};
      
      const response = await axios.put(
        `${API_URL}/user-inductions/${inductionId}`,
        processedData,
        { headers }
      );
      
      return response.data;
    } catch (error) {
      console.error("Error in updateUserInduction:", error);
      throw error;
    }
  };

// Delete a user induction assignment
export const deleteUserInduction = async (user, id) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.delete(
      `${API_URL}/user-inductions/${id}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error deleting user induction:", error);
    throw error;
  }
};

// Get all users assigned to a specific induction
export const getUsersByInduction = async (user, inductionId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/by-induction`,
      { 
        headers,
        params: { inductionId }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching users by induction:", error);
    throw error;
  }
};

// Get induction completion statistics
export const getInductionStats = async (user, inductionId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/stats`,
      { 
        headers,
        params: { inductionId }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching induction stats:", error);
    throw error;
  }
};

// Get results for a specific user induction
export const getUserInductionResults = async (user, id) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/results/${id}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user induction results:", error);
    throw error;
  }
};

// Get all results for a specific induction
export const getInductionResults = async (user, inductionId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/induction-results/${inductionId}`,
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching induction results:", error);
    throw error;
  }
};

// Get detailed statistics for a specific induction
export const getResultsStats = async (user, inductionId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(
      `${API_URL}/user-inductions/results-stats`,
      { 
        headers,
        params: { inductionId }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error fetching results stats:", error);
    throw error;
  }
};

// Export induction results to Excel (placeholder)
export const exportInductionResultsToExcel = async (user, inductionId) => {
  try {
    console.log("Export to Excel functionality coming soon!");
    return { success: false, message: "Export feature coming soon" };
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    throw error;
  }
};

// Export induction results to PDF (placeholder)
export const exportInductionResultsToPDF = async (user, inductionId) => {
  try {
    console.log("Export to PDF functionality coming soon!");
    return { success: false, message: "Export feature coming soon" };
  } catch (error) {
    console.error("Error exporting to PDF:", error);
    throw error;
  }
};


// Send reminder email for a user induction
export const sendInductionReminder = async (user, userInductionId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.post(
      `${API_URL}/user-inductions/send-reminder/${userInductionId}`,
      {},
      { headers }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error sending reminder:", error);
    throw error;
  }
};