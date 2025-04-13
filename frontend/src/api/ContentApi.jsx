import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

// Get website content
export const getWebsiteContent = async () => {
  try {
    const response = await axios.get(`${API_URL}/content`);
    return response.data;
  } catch (error) {
    console.error("Error fetching website content:", error);
    throw error;
  }
};

// Update website content
export const updateWebsiteContent = async (section, content) => {
  try {
    // Get the current users auth token
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("Authentication required");
    }
    
    // Get user token
    const token = await user.getIdToken();
    
    // Make API request with auth token
    const response = await axios.put(
      `${API_URL}/content/update`,
      { section, content },
      {
        headers: {
          'Content-Type': 'application/json',
          'authtoken': token
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error("Error updating website content:", error);
    throw error;
  }
};