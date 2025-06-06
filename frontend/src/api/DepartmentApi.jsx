import axios from 'axios';
import { auth } from "../firebaseConfig";

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://inductions.autevents.co.nz/api' // production website
  : 'http://localhost:8000/api'; // Local development

export const getAllDepartments = async () => {
  try {
    const user = auth.currentUser; // Get current authenticated user
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken(); // Get Firebase ID token

    const response = await axios.get(`${API_URL}/departments/`, {
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

export const addDepartment = async (name, email) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.post(
      `${API_URL}/departments`, 
      { name, email },
      {
        headers: {
          authtoken: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error adding department:", error);
    throw error;
  }
};

export const updateDepartment = async (id, name, email) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    const response = await axios.put(
      `${API_URL}/departments/${id}`, 
      { name, email },
      {
        headers: {
          authtoken: token,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
};

export const deleteDepartment = async (id) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    const token = await user.getIdToken();

    await axios.delete(`${API_URL}/departments/${id}`, {
      headers: {
        authtoken: token,
      },
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
};