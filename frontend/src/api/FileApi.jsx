import axios from 'axios';

// Dynamic API URL for local or deployed environments
const API_URL = process.env.NODE_ENV === 'production'
  ? 'https://dev-aut-events-induction.vercel.app/api' // Development website
  : 'http://localhost:8000/api'; // Local development

export const getSignedUrl = async (user, fileName) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token , filename: fileName} : {};
    const response = await axios.get(`${API_URL}/files/signed-url`, {
      headers,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching files:", error);
    throw error;
  }
};

export const uploadFile = async (user, file, customFileName = null) => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    // If customFileName is provided, append it as a field
    if (customFileName) {
      formData.append("customFileName", customFileName);
    }

    const token = user?.token;
    const headers = token
      ? { authtoken: token, "Content-Type": "multipart/form-data" }
      : { "Content-Type": "multipart/form-data" };

    const response = await axios.post(`${API_URL}/files/upload-file`, formData, {
      headers,
    });

    return response.data; // { url, gcsFileName }
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteFile = async (user, fileName) =>{
  try{
    const token = user?.token;
    const headers = token ? { authtoken: token, filename: fileName } : {};

    const response = await axios.delete(`${API_URL}/files/delete-file`, {
      headers,
    });

    return response.data;

  } catch (error) {
    console.error("Error deleting file:", error);
    throw error;
  }
};