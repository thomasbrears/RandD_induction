import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

  export const getAllDepartments = async () => {
    try {
      const user = auth.currentUser; // Get current authenticated user
      if (!user) throw new Error("User not authenticated");
  
      const token = await user.getIdToken(); // Get Firebase ID token
  
      const response = await axios.get(`${API_URL}/api/departments/`, {
        headers: {
          authtoken: token, // Attach token to headers
        },
      });
  
      return response.data;
    } catch (error) {
      console.error("Error fetching departments:", error);
      return [];
    }
  };