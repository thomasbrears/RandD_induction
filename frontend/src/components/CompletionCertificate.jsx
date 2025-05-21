import React, { useState } from 'react';
import { Button, message, Spin } from 'antd';
import { DownloadOutlined, TrophyOutlined } from '@ant-design/icons';
import fetchWithAuth from '../api/fetchWithAuth';

/**
 * Completion Certificate component that requests certificate generation from the backend
 * The backend handles all certificate creation for security
 */
const CompletionCertificate = ({ induction, user }) => {
  const [loading, setLoading] = useState(false);
  
  // Generate and download the certificate directly
  const downloadCertificate = async () => {
    const userInductionId = induction?.id;
    if (!userInductionId) {
      message.error("Cannot generate certificate: Missing assignment ID");
      return;
    }
    
    setLoading(true);
    
    try {
      // Log the URL and ID for debugging
      console.log(`Generating certificate for ID: ${userInductionId}`);
      console.log(`API URL: /certificates/generate/${userInductionId}`);
      
      // The fetch API with responseType: 'blob' to handle binary data (PDF)
      // NOTE: The fetchWithAuth function already includes the /api prefix in its API_URL
      const response = await fetchWithAuth(
        `/certificates/generate/${userInductionId}`, 
        { responseType: 'blob' }
      );
      
      // If there's an error
      if (!response.ok) {
        let errorMessage = "Failed to generate certificate";
        
        // Try to parse error message if it's JSON
        try {
          // Convert blob to text to read error message
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (parseErr) {
          console.error('Error parsing error response:', parseErr);
        }
        
        throw new Error(errorMessage);
      }
      
      // Get the filename from the Content-Disposition header if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'certificate.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }
      
      // Create a blob URL for the PDF and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      // Clean up blob URL
      window.URL.revokeObjectURL(url);
      
      // Show success message
      message.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Certificate download error:', err);
      message.error('Could not generate certificate: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      type="primary"
      icon={loading ? <Spin size="small" /> : <DownloadOutlined />}
      onClick={downloadCertificate}
      loading={loading}
      disabled={loading}
      className="certificate-btn"
      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
    >
      {loading ? 'Generating...' : 'Download Certificate'}
    </Button>
  );
};

export default CompletionCertificate;
