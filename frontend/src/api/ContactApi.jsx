import axios from 'axios';

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

// Submit contact form (public or authenticated)
export const submitContactForm = async (formData, authToken = null) => {
  try {
    // Headers with or without authentication
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add auth token if available
    if (authToken) {
      headers.authtoken = authToken;
    } else {
      console.log('Sending request without auth (public user)');
    }
    
    const response = await axios.post(`${API_URL}/contact/submit`, formData, {
      headers
    });
    
    return response.data;
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    // Error handling
    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in with request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
};

// Get all contacts (authenticated)
export const getAllContacts = async (authToken) => {
  try {
    if (!authToken) throw new Error("Authentication token required");

    const response = await axios.get(`${API_URL}/contact/`, {
      headers: {
        authtoken: authToken
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return [];
  }
};

// Get all contact form submissions (authenticated)
export const getContactSubmissions = async (authToken) => {
    try {
      if (!authToken) {
        throw new Error("Authentication required");
      }
  
      const response = await axios.get(`${API_URL}/contact/`, {
        headers: {
          authtoken: authToken
        }
      });
  
      return response.data;
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      throw error;
    }
  };
  
  // Get a single contact submission by ID (authenticated)
  export const getContactSubmissionById = async (id, authToken) => {
    try {
      if (!authToken) {
        throw new Error("Authentication required");
      }
  
      const response = await axios.get(`${API_URL}/contact/${id}`, {
        headers: {
          authtoken: authToken
        }
      });
  
      return response.data;
    } catch (error) {
      console.error(`Error fetching contact submission ${id}:`, error);
      throw error;
    }
  };
  
  // Update contact submission status (authenticated) - NOT IMPLEMTED ON FRONTEND
  export const updateContactSubmissionStatus = async (id, status, authToken) => {
    try {
      if (!authToken) {
        throw new Error("Authentication required");
      }
  
      const response = await axios.patch(
        `${API_URL}/contact/${id}/status`,
        { status },
        {
          headers: {
            authtoken: authToken
          }
        }
      );
  
      return response.data;
    } catch (error) {
      console.error(`Error updating contact submission ${id} status:`, error);
      throw error;
    }
  };
  
  // Delete a contact submission (authenticated)
  export const deleteContactSubmission = async (id, authToken) => {
    try {
      if (!authToken) {
        throw new Error("Authentication required");
      }
  
      const response = await axios.delete(`${API_URL}/contact/${id}`, {
        headers: {
          authtoken: authToken
        }
      });
  
      return response.data;
    } catch (error) {
      console.error(`Error deleting contact submission ${id}:`, error);
      throw error;
    }
  };