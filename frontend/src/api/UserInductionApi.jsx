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

// Export induction results to Excel
export const exportInductionResultsToExcel = async (user, inductionId, exportType = 'full') => {
  try {
    const token = user?.token;
    
    if (!token) {
      throw new Error("Authentication required for export");
    }
    
    // Set up the API URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://dev-aut-events-induction.vercel.app/api'
      : 'http://localhost:8000/api';
    
    const url = `${baseUrl}/user-inductions/export-excel/${inductionId}?type=${exportType}&token=${encodeURIComponent(token)}`;

    return {
      url,
      exportType,
      inductionId
    };
  } catch (error) {
    console.error("Error preparing Excel export:", error);
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

// Export induction results to PDF
export const exportInductionResultsToPDF = async (user, inductionId, exportType = 'full') => {
  try {
    const token = user?.token;
    
    if (!token) {
      throw new Error("Authentication required for export");
    }
    
    // Set up the API URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://dev-aut-events-induction.vercel.app/api'
      : 'http://localhost:8000/api';
    
    const url = `${baseUrl}/user-inductions/export-pdf/${inductionId}?type=${exportType}&token=${encodeURIComponent(token)}`;

    return {
      url,
      exportType,
      inductionId
    };
  } catch (error) {
    console.error("Error preparing PDF export:", error);
    throw error;
  }
};

// Handle PDF export using axios
export const handlePDFExport = async (user, inductionId, inductionName, exportType) => {
  try {
    const { url } = await exportInductionResultsToPDF(user, inductionId, exportType);
    
    // Make the request with axios
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'blob',
      validateStatus: false // Don't throw error on non-2xx responses
    });
    
    // Handle error responses
    if (response.status !== 200) {
      // If the error response is a blob, convert it to text to read the error message
      if (response.data instanceof Blob) {
        const errorText = await response.data.text();
        console.error("Export API error response:", errorText);
        
        try {
          // Try to parse as JSON to get a structured error
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Server error during export");
        } catch (e) {
          // If its not valid JSON, use the text as is
          throw new Error(`Export failed with status ${response.status}: ${errorText.slice(0, 150)}...`);
        }
      } else {
        throw new Error(`Export failed with status ${response.status}`);
      }
    }
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.pdf`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error("PDF Export failed:", error);
    
    // Display a more helpful error message
    let errorMessage = error.message || "Could not generate PDF file";
    
    if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
      errorMessage = `Server error during ${exportType} PDF export. This might be due to missing data or an issue with the export template. Try the Excel export instead.`;
    }
    
    throw new Error(errorMessage);
  }
};

// Get URL for exporting staff induction results to Excel
export const exportStaffInductionResultsToExcel = async (user, userInductionId, exportType = 'full') => {
  try {
    const token = user?.token;
    
    if (!token) {
      throw new Error("Authentication required for export");
    }
    
    // Set up the API URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://dev-aut-events-induction.vercel.app/api'
      : 'http://localhost:8000/api';
    
    const url = `${baseUrl}/user-inductions/export-excel/staff/${userInductionId}?type=${exportType}&token=${encodeURIComponent(token)}`;

    return {
      url,
      exportType,
      userInductionId
    };
  } catch (error) {
    console.error("Error preparing staff Excel export:", error);
    throw error;
  }
};

// Get URL for exporting staff induction results to PDF
export const exportStaffInductionResultsToPDF = async (user, userInductionId, exportType = 'full') => {
  try {
    const token = user?.token;
    
    if (!token) {
      throw new Error("Authentication required for export");
    }
    
    // Set up the API URL
    const baseUrl = process.env.NODE_ENV === 'production'
      ? 'https://dev-aut-events-induction.vercel.app/api'
      : 'http://localhost:8000/api';
    
    const url = `${baseUrl}/user-inductions/export-pdf/staff/${userInductionId}?type=${exportType}&token=${encodeURIComponent(token)}`;

    return {
      url,
      exportType,
      userInductionId
    };
  } catch (error) {
    console.error("Error preparing staff PDF export:", error);
    throw error;
  }
};

// Handle staff induction Excel export using axios
export const handleStaffExcelExport = async (user, userInductionId, staffName, inductionName, exportType) => {
  try {
    const { url } = await exportStaffInductionResultsToExcel(user, userInductionId, exportType);
    
    // Make the request with axios
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'blob',
      validateStatus: false // Don't throw error on non-2xx responses
    });
    
    // Handle error responses
    if (response.status !== 200) {
      // If the error response is a blob, convert it to text to read the error message
      if (response.data instanceof Blob) {
        const errorText = await response.data.text();
        console.error("Export API error response:", errorText);
        
        try {
          // Try to parse as JSON to get a structured error
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Server error during export");
        } catch (e) {
          // If its not valid JSON, use the text as is
          throw new Error(`Export failed with status ${response.status}: ${errorText.slice(0, 150)}...`);
        }
      } else {
        throw new Error(`Export failed with status ${response.status}`);
      }
    }
    
    // Create a sanitised filename
    const fileName = `${staffName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.xlsx`;
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error("Excel Export failed:", error);
    
    // Display a more helpful error message
    let errorMessage = error.message || "Could not generate Excel file";
    
    if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
      errorMessage = `Server error during ${exportType} Excel export. This might be due to missing data or an issue with the export template. Try the PDF export instead.`;
    }
    
    throw new Error(errorMessage);
  }
};

// Handle staff induction PDF export using axios
export const handleStaffPDFExport = async (user, userInductionId, staffName, inductionName, exportType) => {
  try {
    const { url } = await exportStaffInductionResultsToPDF(user, userInductionId, exportType);
    
    // Make the request with axios
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'blob',
      validateStatus: false // Dont throw error on non-2xx responses
    });
    
    // Handle error responses
    if (response.status !== 200) {
      // If the error response is a blob, convert it to text to read the error message
      if (response.data instanceof Blob) {
        const errorText = await response.data.text();
        console.error("Export API error response:", errorText);
        
        try {
          // Try to parse as JSON to get a structured error
          const errorJson = JSON.parse(errorText);
          throw new Error(errorJson.error || errorJson.message || "Server error during export");
        } catch (e) {
          // If its not valid JSON, use the text as is
          throw new Error(`Export failed with status ${response.status}: ${errorText.slice(0, 150)}...`);
        }
      } else {
        throw new Error(`Export failed with status ${response.status}`);
      }
    }
    
    // Create a sanitised filename
    const fileName = `${staffName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${inductionName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${exportType}_report.pdf`;
    
    // Create a blob URL and trigger download
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary anchor to trigger download
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
    
    return true;
  } catch (error) {
    console.error("PDF Export failed:", error);
    
    // Display a more helpful error message
    let errorMessage = error.message || "Could not generate PDF file";
    
    if (errorMessage.includes("500") || errorMessage.includes("Internal Server Error")) {
      errorMessage = `Server error during ${exportType} PDF export. This might be due to missing data or an issue with the export template. Try the Excel export instead.`;
    }
    
    throw new Error(errorMessage);
  }
};