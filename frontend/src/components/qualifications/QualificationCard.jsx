import React from 'react';
import { Card, Descriptions, Button, Space, Tooltip, Popconfirm } from 'antd';
import { 
  EyeOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  DownloadOutlined,
  CalendarOutlined,
  BankOutlined 
} from '@ant-design/icons';
import QualificationStatusTag from './QualificationStatusTag';
import { formatDate } from '../../utils/dateUtils';

const QualificationCard = ({ 
  qualification, 
  onView, 
  onEdit, 
  onDelete, 
  onDownload, 
  showUserInfo = false,
  loading = false 
}) => {
  const isExpired = qualification.expiryDate && new Date(qualification.expiryDate) < new Date();
  const isExpiringSoon = qualification.expiryDate && 
    new Date(qualification.expiryDate) < new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) && 
    !isExpired;

  return (
    <Card 
      className={`shadow-md hover:shadow-lg transition-shadow ${isExpired ? 'border-red-300' : isExpiringSoon ? 'border-orange-300' : ''}`}
      loading={loading}
      styles={{ body: { padding: '16px' } }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg truncate" title={qualification.qualificationName}>
            {qualification.qualificationName}
          </h3>
          <p className="text-gray-600 text-sm truncate" title={qualification.qualificationType}>
            {qualification.qualificationType}
          </p>
          {showUserInfo && (
            <p className="text-gray-500 text-xs truncate" title={qualification.userDisplayName}>
              {qualification.userDisplayName} ({qualification.userEmail})
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          <QualificationStatusTag 
            status={qualification.status} 
            expiryDate={qualification.expiryDate} 
          />
        </div>
      </div>
      
      {/* Details */}
      <Descriptions size="small" column={1} className="mb-4">
        <Descriptions.Item 
          label={<span><BankOutlined className="mr-1" />Issuer</span>}
        >
          <span className="text-sm" title={qualification.issuer}>
            {qualification.issuer || 'Not specified'}
          </span>
        </Descriptions.Item>
        
        <Descriptions.Item 
          label={<span><CalendarOutlined className="mr-1" />Issue Date</span>}
        >
          <span className="text-sm">
            {qualification.issueDate ? formatDate(qualification.issueDate) : 'Not specified'}
          </span>
        </Descriptions.Item>
        
        {qualification.expiryDate && (
          <Descriptions.Item 
            label={<span><CalendarOutlined className="mr-1" />Expiry Date</span>}
          >
            <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
              {formatDate(qualification.expiryDate)}
              {isExpired && <span className="ml-1">(Expired)</span>}
              {isExpiringSoon && <span className="ml-1">(Expiring Soon)</span>}
            </span>
          </Descriptions.Item>
        )}
        
        {qualification.notes && (
          <Descriptions.Item label="Notes">
            <span className="text-sm text-gray-600" title={qualification.notes}>
              {qualification.notes.length > 100 
                ? `${qualification.notes.substring(0, 100)}...` 
                : qualification.notes
              }
            </span>
          </Descriptions.Item>
        )}
      </Descriptions>
      
      {/* Action Buttons */}
      <Space size="small" wrap className="w-full">
        <Tooltip title="View qualification">
          <Button 
            icon={<EyeOutlined />} 
            onClick={() => onView(qualification)}
            size="small"
          >
            View
          </Button>
        </Tooltip>
        
        <Tooltip title="Download file">
          <Button 
            icon={<DownloadOutlined />} 
            onClick={() => onDownload(qualification)}
            size="small"
          >
            Download
          </Button>
        </Tooltip>
        
        <Tooltip title="Edit qualification">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => onEdit(qualification)}
            size="small"
          >
            Edit
          </Button>
        </Tooltip>
        
        <Popconfirm
          title="Delete Qualification"
          description="Are you sure you want to delete this qualification? This action cannot be undone."
          onConfirm={() => onDelete(qualification)}
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
        >
          <Tooltip title="Delete qualification">
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            >
              Delete
            </Button>
          </Tooltip>
        </Popconfirm>
      </Space>
      
      {/* Upload date footer */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">
          Uploaded: {qualification.uploadedAt ? formatDate(qualification.uploadedAt) : 'Unknown'}
        </span>
      </div>
    </Card>
  );
};

export default QualificationCard;