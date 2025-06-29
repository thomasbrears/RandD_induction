import React from 'react';
import { Tag } from 'antd';
import { 
  CheckCircleOutlined, 
  WarningOutlined, 
  CloseCircleOutlined,
  ClockCircleOutlined 
} from '@ant-design/icons';

const QualificationStatusTag = ({ status, expiryDate, trustDatabase = false }) => {
  // Calculate status based on expiry date
  const calculateStatus = () => {
    if (!expiryDate) return 'active'; // No expiry date means always active
    
    const now = new Date();
    const expiry = new Date(expiryDate);
    const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    if (expiry < now) return 'expired';
    if (expiry < twoMonths) return 'expiring_soon';
    return 'active';
  };
  
  const actualStatus = trustDatabase ? (status || calculateStatus()) : calculateStatus();
  
  const statusConfig = {
    active: {
      color: 'green',
      text: 'Active',
      icon: <CheckCircleOutlined />
    },
    expiring_soon: {
      color: 'orange',
      text: 'Expiring Soon',
      icon: <WarningOutlined />
    },
    expired: {
      color: 'red',
      text: 'Expired',
      icon: <CloseCircleOutlined />
    },
    pending: {
      color: 'blue',
      text: 'Pending',
      icon: <ClockCircleOutlined />
    }
  };
  
  const config = statusConfig[actualStatus] || statusConfig.active;
  
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.text}
    </Tag>
  );
};

export default QualificationStatusTag;