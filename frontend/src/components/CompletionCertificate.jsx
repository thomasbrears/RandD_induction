import React, { useState } from 'react';
import { Modal, Button, message, Spin } from 'antd';
import { DownloadOutlined, TrophyOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import fetchWithAuth from '../api/fetchWithAuth';

/**
 * Completion Certificate component that requests certificate generation from the backend
 * The backend handles all certificate creation for security
 */
const CompletionCertificate = ({ induction, user }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Handle showing the modal
  const showModal = () => {
    setIsModalVisible(true);
  };
  
  // Handle closing the modal
  const handleCancel = () => {
    setIsModalVisible(false);
  };
  
  // Generate and download the certificate from backend
  const downloadCertificate = async () => {
    // We need to use the userInductionId which is the ID of the completed assignment
    const userInductionId = induction?.id;
    if (!userInductionId) {
      message.error("Cannot generate certificate: Missing assignment ID");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // The fetch API with responseType: 'blob' to handle binary data (PDF)
      const response = await fetchWithAuth(
        `/api/certificates/generate/${userInductionId}`, 
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
      
      // Close the modal once downloaded
      setIsModalVisible(false);
    } catch (err) {
      console.error('Certificate download error:', err);
      setError(err.message || 'Failed to download certificate');
      message.error('Could not generate certificate: ' + (err.message || 'Server error'));
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      <Button
        type="primary"
        icon={<TrophyOutlined />}
        onClick={showModal}
        className="certificate-btn"
        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
      >
        View Certificate
      </Button>
      
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <SafetyCertificateOutlined style={{ fontSize: '20px', marginRight: '10px' }} />
            Completion Certificate
          </div>
        }
        open={isModalVisible}
        onCancel={handleCancel}
        footer={[
          <Button key="close" onClick={handleCancel}>
            Close
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={downloadCertificate}
            loading={loading}
            style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
          >
            Download Certificate
          </Button>,
        ]}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px' }}>
            <Spin size="large" tip="Generating your certificate..." />
            <p style={{ marginTop: '20px' }}>Please wait while we validate and generate your certificate...</p>
          </div>
        ) : error ? (
          <div style={{
            padding: '20px',
            textAlign: 'center',
            color: '#ff4d4f',
            border: '1px solid #ffccc7',
            borderRadius: '4px',
            backgroundColor: '#fff2f0',
          }}>
            <p style={{ fontSize: '16px', fontWeight: 'bold' }}>Certificate Error</p>
            <p>{error}</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <SafetyCertificateOutlined style={{ fontSize: '60px', color: '#52c41a', marginBottom: '20px' }} />
            <h2>Your Certificate is Ready!</h2>
            <p>
              Congratulations on completing <strong>{induction?.inductionName || 'your induction'}</strong>!
            </p>
            <p>Click the Download button below to get your official completion certificate.</p>
            <p style={{ marginTop: '20px', fontSize: '14px', color: '#888' }}>
              All certificates are securely generated and verified by our system.
            </p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default CompletionCertificate;
