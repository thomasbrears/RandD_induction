import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // production website
  : 'http://localhost:8000/api'; // Local development

  export const getAllLocations = async () => {
    try {
      const user = auth.currentUser; // Get current authenticated user
      if (!user) throw new Error("User not authenticated");
  
      const token = await user.getIdToken(); // Get Firebase ID token
  
      const response = await axios.get(`${API_URL}/locations/`, {
        headers: {
          authtoken: token, // Attach token to headers
        },
      });
  
      return response.data;
    } catch (error) {
      console.error("Error fetching locations:", error);
      return [];
    }
  };

  export const addLocation = async (name) => {
    try {
      const response = await axios.post(`${API_URL}/locations`, { name });
      return response.data;
    } catch (error) {
      console.error("Error adding location:", error);
    }
  };
  
  export const updateLocation = async (id, name) => {
    try {
      const response = await axios.put(`${API_URL}/locations/${id}`, { name });
      return response.data;
    } catch (error) {
      console.error("Error updating location:", error);
    }
  };
  
  export const deleteLocation = async (id) => {
    try {
      await axios.delete(`${API_URL}/locations/${id}`);
    } catch (error) {
      console.error("Error deleting location:", error);
    }
  };
  