import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // production website
  : 'http://localhost:8000/api'; // Local development

  export const getAllPositions = async () => {
    try {
      const user = auth.currentUser; // Get the current authenticated user
      if (!user) throw new Error("User not authenticated");
  
      const token = await user.getIdToken(); // Get Firebase ID token
  
      const response = await axios.get(`${API_URL}/positions`, {
        headers: {
          authtoken: token, // Attach token to headers
        },
      });
  
      return response.data;
    } catch (error) {
      console.error("Error fetching positions:", error);
      return [];
    }
  };  

export const addPosition = async (name) => {
  try {
    const response = await axios.post(`${API_URL}/positions`, { name });
    return response.data;
  } catch (error) {
    console.error("Error adding position:", error);
  }
};

export const updatePosition = async (id, name) => {
  try {
    const response = await axios.put(`${API_URL}/positions/${id}`, { name });
    return response.data;
  } catch (error) {
    console.error("Error updating position:", error);
  }
};

export const deletePosition = async (id) => {
  try {
    await axios.delete(`${API_URL}/positions/${id}`);
  } catch (error) {
    console.error("Error deleting position:", error);
  }
};
