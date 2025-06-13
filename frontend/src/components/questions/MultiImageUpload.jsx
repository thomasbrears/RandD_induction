import React, { useState, useEffect } from 'react';
import { Upload, Button, message, Image } from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';

const MultiImageUpload = ({ 
  questionId, 
  initialImageFiles = [], 
  getImageUrl, 
  onFilesChange,
  maxImages = 2 
}) => {
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Load existing images when component mounts
  useEffect(() => {
    const loadExistingImages = async () => {
      if (initialImageFiles.length > 0 && questionId) {
        const existingFiles = [];
        
        for (let i = 0; i < initialImageFiles.length; i++) {
          if (initialImageFiles[i]) {
            try {
              const url = await getImageUrl(questionId, i);
              existingFiles.push({
                uid: `existing-${i}`,
                name: initialImageFiles[i],
                status: 'done',
                url: url,
                isExisting: true,
                imageIndex: i
              });
            } catch (error) {
              console.error(`Error loading existing image ${i}:`, error);
            }
          }
        }
        
        setFileList(existingFiles);
      } else {
        // Clear file list if no initial files
        setFileList([]);
      }
    };
    
    loadExistingImages();
  }, [initialImageFiles, questionId, getImageUrl]);

  // Handle file selection/upload
  const handleChange = ({ fileList: newFileList }) => {    
    // Limit to maxImages
    const limitedFileList = newFileList.slice(0, maxImages);
    
    // Ensure proper indexing
    const processedFileList = [];
    const fileChanges = [];
    
    // First, preserve existing files in their original positions
    limitedFileList.forEach((file, listIndex) => {
      let targetIndex = listIndex;
      
      // If its an existing file, preserve its original index
      if (file.isExisting && file.imageIndex !== undefined) {
        targetIndex = file.imageIndex;
      }
      
      processedFileList[targetIndex] = {
        ...file,
        imageIndex: targetIndex
      };
    });
    
    // Create file changes array with proper indexing
    for (let i = 0; i < maxImages; i++) {
      const file = processedFileList[i];
      
      if (file) {
        if (file.originFileObj) {
          // New file uploaded
          fileChanges.push({
            index: i,
            file: file.originFileObj,
            fileName: file.name,
            isNew: true
          });
        } else if (file.isExisting) {
          // Existing file that should be kept
          fileChanges.push({
            index: i,
            fileName: file.name,
            isExisting: true
          });
        }
      }
      // If no file at this index, it will be handled as deletion by parent
    }
    
    // Update local state - filter out undefined entries for display
    const displayFileList = processedFileList.filter(Boolean).map((file, displayIndex) => ({
      ...file,
      // Keep the original imageIndex for tracking, but ensure uid is unique
      uid: file.uid || `file-${file.imageIndex || displayIndex}-${Date.now()}`
    }));
    
    setFileList(displayFileList);
    
    // Notify parent component of changes
    onFilesChange(fileChanges);
  };

  // Handle preview
  const handlePreview = async (file) => {
    if (!file.url && !file.preview && file.originFileObj) {
      file.preview = await getBase64(file.originFileObj);
    }
    
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1));
  };

  // Convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Validate file before upload
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('Image must be smaller than 5MB!');
      return false;
    }
    
    return false; // Prevent automatic upload
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div className="multi-image-upload">
      <div className="mb-2">
        <span className="text-sm font-medium text-gray-700">
          Images ({fileList.length}/{maxImages})
        </span>
      </div>
      
      <Upload
        listType="picture-card"
        fileList={fileList}
        onPreview={handlePreview}
        onChange={handleChange}
        beforeUpload={beforeUpload}
        multiple={true}
        accept="image/*"
        className="multi-image-uploader"
      >
        {fileList.length >= maxImages ? null : uploadButton}
      </Upload>
      
      {/* Preview Modal */}
      <Image
        wrapperStyle={{ display: 'none' }}
        preview={{
          visible: previewOpen,
          onVisibleChange: (visible) => setPreviewOpen(visible),
          afterOpenChange: (visible) => !visible && setPreviewImage(''),
        }}
        src={previewImage}
        alt={previewTitle}
      />
    </div>
  );
};

export default MultiImageUpload;