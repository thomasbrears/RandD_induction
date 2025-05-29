import axios from 'axios';
import { getAuth } from 'firebase/auth';

const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://inductions.autevents.co.nz/api' // production website
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

export const getBackgroundImages = async () => {
  try {
    const response = await axios.get(`${API_URL}/content/get-backgrounds`);
    return response.data;
  } catch (error) {
    console.error("Error fetching website backgrounds:", error);
    throw error;
  }
};

export const updateBackgroundImage = async (key, image) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await axios.put(
      `${API_URL}/content/update-background-image`,
      { key, image }, // image can be an object or null
      {
        headers: {
          "Content-Type": "application/json",
          authtoken: token,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating background image:", error);
    throw error;
  }
};

export const getHeaderImages = async () => {
  try {
    const response = await axios.get(`${API_URL}/content/get-header-images`);
    return response.data;
  } catch (error) {
    console.error("Error fetching website header images:", error);
    throw error;
  }
};

export const updateHeaderImages = async (headerImages) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      throw new Error("Authentication required");
    }

    const token = await user.getIdToken();

    const response = await axios.put(
      `${API_URL}/content/update-header-images`,
      { images: headerImages },
      {
        headers: {
          "Content-Type": "application/json",
          authtoken: token,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating header images:", error);
    throw error;
  }
};