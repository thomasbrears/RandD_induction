import axios from "axios";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

export const createNewUser = async (user, userData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};

    const response = await axios.post(
      `${API_URL}/users/create-new-user`,
      userData,
      {
        headers,
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("Error response from server:", error.response.data);
      throw new Error(error.response.data.message || "Failed to create user");
    } else if (error.request) {
      console.error("No response received:", error.request);
      throw new Error("No response from server. Please try again later.");
    } else {
      console.error("Error setting up request:", error.message);
      throw new Error(error.message || "Error creating user");
    }
  }
};

export const getAllUsers = async (user) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/users`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const getUser = async (user, uid) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/users/get-user`, {
      headers,
      params: { uid },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUser = async (user, userData) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.put(`${API_URL}/users/update-user`, userData, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const deleteUser = async (user, uid) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.delete(`${API_URL}/users/delete-user`, {
      headers,
      params: { uid },
    });
    return response.data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const deactivateUser = async (user, uid) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.post(`${API_URL}/users/deactivate-user`, null, {
      headers,
      params: { uid },
    });
    return response.data;
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }
};

export const reactivateUser = async (user, uid) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.post(`${API_URL}/users/reactivate-user`, null, {
      headers,
      params: { uid },
    });
    return response.data;
  } catch (error) {
    console.error("Error reactivating user:", error);
    throw error;
  }
};