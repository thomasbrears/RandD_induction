import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://inductions.autevents.co.nz/api' // production website
  : 'http://localhost:8000/api'; // Local development

export const getAllCertificateTypes = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.get(`${API_URL}/certificate-types/`, {
      headers: {
        authtoken: token,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching certificate types:", error);
    return [];
  }
};

export const addCertificateType = async (name) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.post(`${API_URL}/certificate-types`, 
      { name }, 
      {
        headers: {
          authtoken: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding certificate type:", error);
    throw error;
  }
};

export const updateCertificateType = async (id, name) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.put(`${API_URL}/certificate-types/${id}`, 
      { name }, 
      {
        headers: {
          authtoken: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating certificate type:", error);
    throw error;
  }
};

export const deleteCertificateType = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    await axios.delete(`${API_URL}/certificate-types/${id}`, {
      headers: {
        authtoken: token,
      },
    });
  } catch (error) {
    console.error("Error deleting certificate type:", error);
    throw error;
  }
};