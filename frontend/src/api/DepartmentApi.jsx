import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-production-url.com/api'
  : 'http://localhost:8000/api';

  export const getAllDepartments = async () => {
    try {
      const user = auth.currentUser; // Get current authenticated user
      if (!user) throw new Error("User not authenticated");
  
      const token = await user.getIdToken(); // Get Firebase ID token
  
      const response = await axios.get("http://localhost:8000/api/departments/", {
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