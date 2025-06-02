import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // production website
  : 'http://localhost:8000/api'; // Local development

export const getEmailSettings = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.get(`${API_URL}/email-settings/`, {
      headers: {
        authtoken: token,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return null;
  }
};

export const updateEmailSettings = async (settings) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.put(
      `${API_URL}/email-settings/`,
      settings,
      {
        headers: {
          authtoken: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating email settings:", error);
    throw error;
  }
};