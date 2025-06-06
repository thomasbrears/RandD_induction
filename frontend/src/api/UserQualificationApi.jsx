import axios from "axios";

// Dynamic API URL
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://inductions.autevents.co.nz/api' // production website
  : 'http://localhost:8000/api'; // Local development

export const uploadUserQualification = async (user, file, qualificationData) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    
    // Add qualification data
    Object.keys(qualificationData).forEach(key => {
      if (qualificationData[key] !== null && qualificationData[key] !== undefined) {
        formData.append(key, qualificationData[key]);
      }
    });

    const token = user?.token;
    const headers = token
      ? { authtoken: token, "Content-Type": "multipart/form-data" }
      : { "Content-Type": "multipart/form-data" };

    const response = await axios.post(`${API_URL}/user-qualifications/upload`, formData, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error uploading qualification:", error);
    throw error;
  }
};

export const getUserQualifications = async (user, userId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(`${API_URL}/user-qualifications`, {
      headers,
      params: { userId }
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching user qualifications:", error);
    throw error;
  }
};

export const updateUserQualification = async (user, qualificationId, qualificationData, file = null) => {
  try {
    const formData = new FormData();
    
    if (file) {
      formData.append("file", file);
    }
    
    // Add qualification data
    Object.keys(qualificationData).forEach(key => {
      if (qualificationData[key] !== null && qualificationData[key] !== undefined) {
        formData.append(key, qualificationData[key]);
      }
    });

    const token = user?.token;
    const headers = token
      ? { authtoken: token, "Content-Type": "multipart/form-data" }
      : { "Content-Type": "multipart/form-data" };

    const response = await axios.put(`${API_URL}/user-qualifications/${qualificationId}`, formData, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error updating qualification:", error);
    throw error;
  }
};

export const deleteUserQualification = async (user, qualificationId) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};

    const response = await axios.delete(`${API_URL}/user-qualifications/${qualificationId}`, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error deleting qualification:", error);
    throw error;
  }
};

// Manager API functions
export const getAllUserQualifications = async (user, filters = {}) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(`${API_URL}/user-qualifications/all`, {
      headers,
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching all qualifications:", error);
    throw error;
  }
};

export const requestQualificationFromUser = async (user, requestData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};

    const response = await axios.post(`${API_URL}/user-qualifications/request`, requestData, {
      headers,
    });

    return response.data;
  } catch (error) {
    console.error("Error requesting qualification:", error);
    throw error;
  }
};

export const getQualificationRequests = async (user, filters = {}) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    
    const response = await axios.get(`${API_URL}/user-qualifications/requests`, {
      headers,
      params: filters
    });
    
    return response.data;
  } catch (error) {
    console.error("Error fetching qualification requests:", error);
    throw error;
  }
};