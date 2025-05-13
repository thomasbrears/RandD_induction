import React from 'react';
import { Spin, Progress, Card } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

const InductionLoader = () => {
  const antIcon = <LoadingOutlined style={{ fontSize: 48 }} spin />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card 
        bordered={false} 
        className="shadow-md text-center" 
        style={{ 
          maxWidth: '420px', 
          width: '100%',
          borderRadius: '8px',
          padding: '16px'
        }}
      >
        <div className="mb-6">
          <Spin indicator={antIcon} />
        </div>
        
        <h3 style={{ marginBottom: '8px' }}>
          Loading Your Induction Module
        </h3>
        
        <p style={{ display: 'block', marginBottom: '24px', color: 'rgba(0, 0, 0, 0.45)' }}>
          Please wait while we prepare your induction module...
        </p>
        
        <p style={{ fontSize: '12px', marginTop: '12px', display: 'block', color: 'rgba(0, 0, 0, 0.45)' }}>
          This may take a moment
        </p>
      </Card>
    </div>
  );
};

export default InductionLoader;