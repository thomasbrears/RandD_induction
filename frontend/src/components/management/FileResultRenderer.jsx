import React, { useState, useEffect } from 'react';
import { Button, Image, Spin, Tooltip, Alert } from 'antd';
import { 
  DownloadOutlined, FilePdfOutlined, 
  FileWordOutlined, FileExcelOutlined, FilePptOutlined, 
  EyeOutlined, FileImageOutlined, FileUnknownOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { getSignedUrl } from '../../api/FileApi';
import useAuth from '../../hooks/useAuth';
import { auth } from '../../firebaseConfig';

/**
 * Component for rendering file uploads in result view
 */
const FileResultRenderer = ({ answer }) => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fileUrl, setFileUrl] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [fileName, setFileName] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [authError, setAuthError] = useState(false);
  
  // Function to handle the download action
  const handleDownload = () => {
    if (!fileUrl) return;
    
    try {
      setDownloadLoading(true);
      
      // Open in a new tab - letting browser handle download based on file type to advoid CORS issues
      window.open(fileUrl, '_blank');
      
      setTimeout(() => {
        setDownloadLoading(false);
      }, 1000);
    } catch (error) {
      setDownloadLoading(false);
    }
  };

  // Function to get a Firebase token directly if the auth hook isnt providing one
  const getFirebaseToken = async () => {
    try {
      // If we have a current user in Firebase directly
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken(true);
        return { token };
      }
      
      // Try to find Firebase auth data in localStorage as fallback
      const firebaseAuthKey = Object.keys(localStorage).find(key => 
        key.startsWith('firebase:authUser:')
      );
      
      if (firebaseAuthKey) {
        try {
          const firebaseAuth = JSON.parse(localStorage.getItem(firebaseAuthKey));
          if (firebaseAuth && firebaseAuth.stsTokenManager && firebaseAuth.stsTokenManager.accessToken) {
            return { token: firebaseAuth.stsTokenManager.accessToken };
          }
        } catch (error) {
          console.error('Error parsing Firebase auth data:', error);
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting Firebase token:', error);
      return null;
    }
  };
  
  useEffect(() => {
    // Dont try to fetch the file URL if we're still loading auth
    if (authLoading) {
      return;
    }
    
    const fetchFileUrl = async () => {
      // Get the file path
      const filePath = answer.uploadedName || answer.fileName || null;
      
      if (!filePath) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setAuthError(false);
                
        // First try with the user from useAuth
        if (user && user.token) {
          try {
            const response = await getSignedUrl(user, filePath);
            if (response && response.url) {
              setFileUrl(response.url);
              
              // Process file metadata after successful fetch
              processFileMetadata(filePath);
              return;
            }
          } catch (apiError) {
            console.error('Auth error with useAuth token:', apiError);
          }
        }
        
        // If that fails, try to get a token directly from Firebase
        const directToken = await getFirebaseToken();
        if (directToken) {
          try {
            const response = await getSignedUrl(directToken, filePath);
            if (response && response.url) {
              setFileUrl(response.url);
              
              // Process file metadata after successful fetch
              processFileMetadata(filePath);
              return;
            }
          } catch (apiError) {
            console.error('Auth error with direct token:', apiError);
          }
        }
        
        // If we get here, we could not authenticate
        console.error('Failed to authenticate for file access');
        setAuthError(true);
        
        // Still process file metadata even if we could not get the URL
        processFileMetadata(filePath);
        
      } catch (error) {
        console.error('General error:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Function to process file metadata
    const processFileMetadata = (filePath) => {
      // Extract original file name from path
      const pathParts = filePath.split('/');
      const fullName = pathParts[pathParts.length - 1];
      
      // Try to extract original filename - usually after the last underscore
      const underscoreIndex = fullName.lastIndexOf('_');
      if (underscoreIndex !== -1 && underscoreIndex < fullName.length - 1) {
        setFileName(fullName.substring(underscoreIndex + 1));
      } else {
        setFileName(fullName);
      }
      
      // If we already have the file type from the answer
      if (answer.fileType) {
        if (answer.fileType.includes('image')) {
          setFileType('image');
        } else if (answer.fileType.includes('pdf')) {
          setFileType('pdf');
        } else if (answer.fileType.includes('word') || answer.fileType.includes('doc')) {
          setFileType('word');
        } else if (answer.fileType.includes('excel') || answer.fileType.includes('sheet') || answer.fileType.includes('xls')) {
          setFileType('excel');
        } else if (answer.fileType.includes('powerpoint') || answer.fileType.includes('presentation') || answer.fileType.includes('ppt')) {
          setFileType('powerpoint');
        } else {
          setFileType('other');
        }
      } else {
        // Otherwise determine file type from extension
        const fileExtension = fullName.split('.').pop().toLowerCase();
        
        if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) {
          setFileType('image');
        } else if (fileExtension === 'pdf') {
          setFileType('pdf');
        } else if (['doc', 'docx'].includes(fileExtension)) {
          setFileType('word');
        } else if (['xls', 'xlsx'].includes(fileExtension)) {
          setFileType('excel');
        } else if (['ppt', 'pptx'].includes(fileExtension)) {
          setFileType('powerpoint');
        } else {
          setFileType('other');
        }
      }
    };
    
    fetchFileUrl();
  }, [answer, user, authLoading]);
  
  // Show auth loading spinner if still loading auth
  if (authLoading) {
    return <Spin tip="Checking authentication..." />;
  }
  
  // Return spinner while loading
  if (loading) {
    return <Spin tip="Loading file..." />;
  }
  
  // Show auth error message
  if (authError) {
    return (
      <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-md">
        <Alert
          message="Authentication Required"
          description={
            <div>
              <p>You need to be logged in to access this file. Please ensure you're logged in and try again.</p>
              <p className="mt-2 text-sm">File: {fileName}</p>
            </div>
          }
          type="warning"
          showIcon
          icon={<WarningOutlined />}
        />
      </div>
    );
  }
  
  // Show a simple empty state if no file
  if (!fileUrl) {
    return <p className="text-gray-500 italic">File not available</p>;
  }
  
  // Function to get the appropriate icon based on file type
  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <FileImageOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
      case 'pdf':
        return <FilePdfOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'word':
        return <FileWordOutlined style={{ color: '#2f54eb', fontSize: 24 }} />;
      case 'excel':
        return <FileExcelOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'powerpoint':
        return <FilePptOutlined style={{ color: '#fa8c16', fontSize: 24 }} />;
      default:
        return <FileUnknownOutlined style={{ fontSize: 24 }} />;
    }
  };
  
  // Get appropriate view button tooltip based on file type
  const getViewTooltip = () => {
    switch (fileType) {
      case 'image':
        return 'View image';
      case 'pdf':
        return 'View PDF';
      case 'word':
        return 'View document';
      case 'excel':
        return 'View spreadsheet';
      case 'powerpoint':
        return 'View presentation';
      default:
        return 'View file';
    }
  };
  
  return (
    <div className="p-4 border border-gray-200 rounded-md">
      <div className="flex justify-between">
        <div className="flex items-start space-x-3">
          {getFileIcon()}
          <div>
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-gray-500">
              {fileType ? fileType.charAt(0).toUpperCase() + fileType.slice(1) + ' file' : 'File'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {fileUrl && (
            <Tooltip title={getViewTooltip()}>
              <Button 
                icon={<EyeOutlined />} 
                onClick={() => window.open(fileUrl, '_blank')}
                size="small"
              />
            </Tooltip>
          )}
          <Tooltip title="Download file (Click this button, then Right-click on image and select 'Save image as' to save image)">
            <Button 
              type="primary" 
              size="small"
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
              loading={downloadLoading}
            >
              Download
            </Button>
          </Tooltip>
        </div>
      </div>
      
      {/* Show image preview if it's an image */}
      {fileType === 'image' && fileUrl && (
        <div className="mt-3">
          <Image
            src={fileUrl}
            alt={fileName}
            className="mt-2 rounded"
            style={{ maxHeight: '200px', objectFit: 'contain' }}
          />
        </div>
      )}
    </div>
  );
};

export default FileResultRenderer;