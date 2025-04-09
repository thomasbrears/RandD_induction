import axios from 'axios';

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

export const getSignedUrl = async (user, fileName) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token } : {};
    const response = await axios.get(`${API_URL}/files/signed-url`, {
      headers,
      params: { fileName },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
};

export const uploadFile = async (user, file) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const token = user?.token;
    const headers = token
      ? { authtoken: token, "Content-Type": "multipart/form-data" }
      : { "Content-Type": "multipart/form-data" };

    const response = await axios.post(`${API_URL}/files/upload`, formData, {
      headers,
    });

    return response.data; // contains { url, gcsFileName }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};