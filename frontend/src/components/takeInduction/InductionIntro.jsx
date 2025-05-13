import React from 'react';
import PropTypes from 'prop-types';
import { calculateEstimatedTime, formatTimeRange } from '../../utils/inductionHelpers';
import FormattedDescription from './FormattedDescription';
import { Result, Button, Card, Statistic, Row, Col } from 'antd';

/**
 * Component for displaying the induction introduction screen
 */
const InductionIntro = ({ induction, onStart }) => {
  // Safety check for null/undefined induction data
  if (!induction) {
    return (
      <Card bordered={false} className="shadow-md">
        <Result
          status="warning"
          title="Induction Not Found"
          subTitle="We couldn't find the requested induction. It may have been deleted, or you may not have permission to access it."
          extra={[
            <Button 
              type="primary" 
              size="large"
              onClick={() => window.location.href = '/inductions/my-inductions'}
              key="return"
            >
              Return to My Inductions
            </Button>
          ]}
        />
      </Card>
    );
  }
  
  const estimatedTimeRange = formatTimeRange(calculateEstimatedTime(induction?.questions));
  
  return (
    <Card bordered={false} className="shadow-md" style={{ borderRadius: '8px' }}>
      <div className="mb-4">
        <h2 style={{ wordBreak: 'break-word' }}>{induction.name}</h2>
      </div>
      
      <div className="mb-6">
        <Card 
          bordered={false} 
          className="bg-gray-50"
          style={{ borderRadius: '8px' }}
        >
          <FormattedDescription 
            description={induction.description || ' '} 
            initiallyExpanded={true}
          />
        </Card>
        
        <Row gutter={16} className="mt-4">
          <Col xs={24} md={12}>
            <Card 
              bordered={false}
              className="bg-blue-50"
              style={{ borderRadius: '8px' }}
            >
              <Statistic
                title="Question Count"
                value={induction.questions?.length || 0}
                suffix="questions"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          
          <Col xs={24} md={12}>
            <Card 
              bordered={false}
              className="bg-green-50"
              style={{ borderRadius: '8px' }}
            >
              <Statistic
                title="Estimated Time"
                value={estimatedTimeRange}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
        </Row>
      </div>
      
      <Button 
        type="primary" 
        size="large"
        onClick={onStart}
        style={{ 
          backgroundColor: '#1f2937',
          borderColor: '#1f2937', 
          width: '100%',
          height: '48px',
          fontSize: '16px'
        }}
        className="hover:bg-gray-700"
      >
        Start Induction
      </Button>
    </Card>
  );
};

InductionIntro.propTypes = {
  induction: PropTypes.shape({
    name: PropTypes.string,
    description: PropTypes.string,
    questions: PropTypes.array
  }),
  onStart: PropTypes.func.isRequired
};

export default InductionIntro;