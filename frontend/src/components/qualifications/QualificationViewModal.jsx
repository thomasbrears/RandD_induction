import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Descriptions, 
  Button, 
  Space, 
  Image, 
  Typography,
  Tag,
  Popconfirm,
  Divider,
  Spin,
  Alert
} from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  EyeOutlined,
  CalendarOutlined,
  BankOutlined,
  FileTextOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import QualificationStatusTag from './QualificationStatusTag';
import { formatDate } from '../../utils/dateUtils';
import { getSignedUrl } from '../../api/FileApi';
import useAuth from '../../hooks/useAuth';

const { Title, Text } = Typography;

const QualificationViewModal = ({
  open,
  onClose,
  qualification,
  onEdit,
  onDelete,
  onDownload,
  showActions = true
}) => {
  const { user } = useAuth();
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch fresh signed URL when modal opens
  useEffect(() => {
    if (open && qualification && qualification.fileName && qualification.gcsFileName && user) {
      const isImageFile = qualification.fileName && 
        /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(qualification.fileName);
      
      if (isImageFile) {
        setImageLoading(true);
        setImageError(false);
        setImageUrl(null);

        getSignedUrl(user, qualification.gcsFileName)
          .then(response => {
            setImageUrl(response.url);
            setImageError(false);
          })
          .catch(error => {
            console.error('Error getting signed URL for image:', error);
            setImageError(true);
          })
          .finally(() => {
            setImageLoading(false);
          });
      }
    }
  }, [open, qualification?.gcsFileName, qualification?.fileName, user]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setImageError(false);
      setImageLoading(false);
    }
  }, [open]);

  if (!qualification) return null;

  const isExpired = qualification.expiryDate && new Date(qualification.expiryDate) < new Date();
  const isExpiringSoon = qualification.expiryDate && 
    new Date(qualification.expiryDate) < new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) && 
    !isExpired;

  const isImageFile = qualification.fileName && 
    /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(qualification.fileName);

  const handleEdit = () => {
    if (onEdit) {
      onEdit(qualification);
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(qualification);
      onClose();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(qualification);
    }
  };

  const retryImageLoad = () => {
    if (qualification.gcsFileName && user) {
      setImageLoading(true);
      setImageError(false);
      
      getSignedUrl(user, qualification.gcsFileName)
        .then(response => {
          setImageUrl(response.url);
          setImageError(false);
        })
        .catch(error => {
          console.error('Error getting signed URL for image:', error);
          setImageError(true);
        })
        .finally(() => {
          setImageLoading(false);
        });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileTextOutlined />
            <span>Qualification Details</span>
          </div>
          <QualificationStatusTag 
            status={qualification.status} 
            expiryDate={qualification.expiryDate} 
          />
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={showActions ? (
        <Space>
          <Button onClick={onClose}>
            Close
          </Button>
          {onDownload && (
            <Button 
              icon={<DownloadOutlined />} 
              onClick={handleDownload}
            >
              Download
            </Button>
          )}
          {onEdit && (
            <Button 
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
          {onDelete && (
            <Popconfirm
              title="Delete Qualification"
              description="Are you sure you want to delete this qualification? This action cannot be undone."
              onConfirm={handleDelete}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <Button 
                danger 
                icon={<DeleteOutlined />}
              >
                Delete
              </Button>
            </Popconfirm>
          )}
        </Space>
      ) : (
        <Button onClick={onClose}>Close</Button>
      )}
      width={700}
      className="qualification-view-modal"
    >
      <div className="space-y-6">
        {/* Main Information */}
        <div>
          <Title level={4} className="mb-4">
            {qualification.qualificationName}
          </Title>
          
          {/* Status Warning */}
          {isExpired && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <Text type="danger" strong>
                This qualification has expired on {formatDate(qualification.expiryDate)}
              </Text>
            </div>
          )}
          
          {isExpiringSoon && (
            <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
              <Text style={{ color: '#d46b08' }} strong>
                This qualification expires soon on {formatDate(qualification.expiryDate)}
              </Text>
            </div>
          )}
        </div>

        {/* Details */}
        <Descriptions 
          bordered 
          column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
          size="middle"
        >
          <Descriptions.Item 
            label={<span><FileTextOutlined className="mr-2" />Type</span>}
            span={2}
          >
            <Tag color="blue">{qualification.qualificationType}</Tag>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<span><BankOutlined className="mr-2" />Issuer</span>}
          >
            {qualification.issuer || 'Not specified'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label={<span><CalendarOutlined className="mr-2" />Issue Date</span>}
          >
            {qualification.issueDate ? formatDate(qualification.issueDate) : 'Not specified'}
          </Descriptions.Item>
          
          {qualification.expiryDate && (
            <Descriptions.Item 
              label={<span><CalendarOutlined className="mr-2" />Expiry Date</span>}
              span={2}
            >
              <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : ''}>
                {formatDate(qualification.expiryDate)}
                {isExpired && <span className="ml-2 text-red-600">(Expired)</span>}
                {isExpiringSoon && <span className="ml-2 text-orange-600">(Expiring Soon)</span>}
              </span>
            </Descriptions.Item>
          )}
          
          <Descriptions.Item 
            label="File Name"
            span={2}
          >
            <div className="flex items-center gap-2">
              <span>{qualification.fileName}</span>
              {onDownload && (
                <Button 
                  size="small" 
                  icon={<DownloadOutlined />} 
                  onClick={handleDownload}
                  type="link"
                >
                  Download
                </Button>
              )}
            </div>
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="Uploaded"
          >
            {qualification.uploadedAt ? formatDate(qualification.uploadedAt) : 'Unknown'}
          </Descriptions.Item>
          
          <Descriptions.Item 
            label="Last Updated"
          >
            {qualification.updatedAt ? formatDate(qualification.updatedAt) : 'Never'}
          </Descriptions.Item>
        </Descriptions>

        {/* Notes */}
        {qualification.notes && (
          <div>
            <Title level={5}>Notes</Title>
            <div className="p-3 bg-gray-50 rounded-md">
              <Text>{qualification.notes}</Text>
            </div>
          </div>
        )}

        {/* File Preview */}
        {isImageFile && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <Title level={5} className="mb-0">Preview</Title>
              {imageError && (
                <Button 
                  size="small" 
                  icon={<ReloadOutlined />} 
                  onClick={retryImageLoad}
                  loading={imageLoading}
                >
                  Retry
                </Button>
              )}
            </div>
            
            <div className="text-center">
              {imageLoading && (
                <div className="flex items-center justify-center h-40 bg-gray-100 rounded">
                  <Spin tip="Loading preview..." />
                </div>
              )}
              
              {imageError && !imageLoading && (
                <Alert
                  message="Preview unavailable"
                  description="Unable to load image preview. The file may be temporarily inaccessible."
                  type="warning"
                  showIcon
                  action={
                    <Button size="small" onClick={retryImageLoad}>
                      Retry
                    </Button>
                  }
                />
              )}
              
              {imageUrl && !imageLoading && !imageError && (
                <Image
                  src={imageUrl}
                  alt={qualification.qualificationName}
                  style={{ maxHeight: '400px', maxWidth: '100%' }}
                  placeholder={
                    <div className="flex items-center justify-center h-40 bg-gray-100">
                      <Spin tip="Loading image..." />
                    </div>
                  }
                  onError={() => {
                    console.error('Image failed to load:', imageUrl);
                    setImageError(true);
                  }}
                  fallback="https://dummyimage.com/400x400/c9c9c9/000000.png&text=Image+Preview+Unavailable+"
                />
              )}
            </div>
            
            {!isImageFile && (
              <Alert
                message="File Preview"
                description={`This file type (${qualification.fileName?.split('.').pop()?.toUpperCase()}) cannot be previewed. Use the download button to view the file.`}
                type="info"
                showIcon
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default QualificationViewModal;