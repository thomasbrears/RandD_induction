import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Result, Button, Space, Typography, Card } from 'antd';
import { ArrowLeftOutlined, ReloadOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

const InductionError = ({ message, onReturnClick }) => {
  const navigate = useNavigate();
  
  const handleReturn = () => {
    if (onReturnClick) {
      onReturnClick();
    } else {
      navigate('/inductions/my-inductions');
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Card
        bordered={false}
        className="shadow-lg"
        style={{ 
          maxWidth: '500px', 
          width: '100%',
          borderRadius: '8px'
        }}
      >
        <Result
          status="error"
          title="Something Went Wrong"
          subTitle={message || "We couldn't load the requested induction. Please try again later."}
          extra={
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button 
                type="primary" 
                icon={<ArrowLeftOutlined />} 
                onClick={handleReturn}
                size="large"
                style={{ width: '100%' }}
              >
                Return to My Inductions
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={() => window.location.reload()}
                size="large"
                style={{ width: '100%' }}
              >
                Try Again
              </Button>
            </Space>
          }
        />
        <div className="pt-1">
          <Paragraph type="secondary" style={{ textAlign: 'center' }}>
            If this problem persists, please contact your manager for assistance.
          </Paragraph>
        </div>
      </Card>
    </div>
  );
};

InductionError.propTypes = {
  message: PropTypes.string,
  onReturnClick: PropTypes.func
};

export default InductionError;