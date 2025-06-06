import axios from 'axios';

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

export const uploadPublicFile = async (user, file, filePath) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("filePath", filePath);

    const token = user?.token;
    const headers = {
      ...(token && { authtoken: token }),
      "Content-Type": "multipart/form-data",
    };

    const response = await axios.post(`${API_URL}/files/upload-public-file`, formData, {
      headers,
    });

    return response.data; // { url, filePath }
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

// Function to get download URL
export const getDownloadUrl = async (user, fileName) => {
  try {
    const token = user?.token;
    const headers = token ? { authtoken: token, filename: fileName } : { filename: fileName };

    const response = await axios.get(`${API_URL}/files/download-url`, {
      headers,
    });

    return response.data; // { downloadUrl }
  } catch (error) {
    console.error("Error getting download URL:", error);
    throw error;
  }
};

// Download function with multiple fallback methods
export const downloadFile = async (user, fileName) => {
  try {
    const token = user?.token;
    const originalFileName = fileName.split('/').pop();

    // Method 1: Try the new download URL endpoint first
    try {
      const urlResponse = await getDownloadUrl(user, fileName);
      if (urlResponse.downloadUrl) {
        // Use the signed URL to download the file
        const fileResponse = await axios.get(urlResponse.downloadUrl, {
          responseType: 'blob',
          timeout: 30000, // 30 second timeout
        });
        
        return new File([fileResponse.data], originalFileName, { 
          type: fileResponse.data.type || 'application/octet-stream' 
        });
      }
    } catch (downloadUrlError) {
      console.warn('Download URL method failed, trying direct download:', downloadUrlError.message);
    }

    // Method 2: Fallback to direct download endpoint
    try {
      const headers = token ? { authtoken: token, filename: fileName } : { filename: fileName };
      
      const response = await axios.get(`${API_URL}/files/download-file`, {
        headers,
        responseType: 'blob',
        timeout: 60000, // 60 second timeout for larger files
      });

      return new File([response.data], originalFileName, { 
        type: response.data.type || 'application/octet-stream' 
      });
    } catch (directDownloadError) {
      console.warn('Direct download method failed:', directDownloadError.message);
      throw directDownloadError;
    }

  } catch (error) {
    console.error("Error downloading file:", error);
    
    // Provide more specific error messages
    if (error.response) {
      if (error.response.status === 404) {
        throw new Error('File not found. It may have been deleted or moved.');
      } else if (error.response.status === 403) {
        throw new Error('Access denied. You may not have permission to download this file.');
      } else if (error.response.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Download timeout. The file may be too large or your connection is slow.');
    }
    
    throw new Error(`Download failed: ${error.message}`);
  }
};

// Alternative: Simple function to get a viewable signed URL
export const getFileViewUrl = async (user, fileName) => {
  try {
    const response = await getSignedUrl(user, fileName);
    return response.url;
  } catch (error) {
    console.error("Error getting file view URL:", error);
    throw error;
  }
};

// Utility function to trigger download in browser
export const triggerFileDownload = (file, customFileName = null) => {
  try {
    const fileName = customFileName || file.name || 'download';
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the object URL after a short delay
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('Error triggering download:', error);
    return false;
  }
};

// Simple function to download via signed URL (opens in new tab)
export const downloadViaUrl = async (user, fileName, customFileName = null) => {
  try {
    const response = await getSignedUrl(user, fileName);
    if (response.url) {
      const link = document.createElement('a');
      link.href = response.url;
      link.download = customFileName || fileName.split('/').pop();
      link.target = '_blank';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error downloading via URL:', error);
    throw error;
  }
};
