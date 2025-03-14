import React, { useState } from 'react';
import { Button, Card, Typography, Space } from 'antd';
import InductionFeedbackModal from '../components/InductionFeedbackModal';

const { Title, Paragraph } = Typography;

const FeedbackTestPage = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  // Simulating an induction ID that would come from the induction completion
  const sampleInductionId = "induction-thomas-test-123";

  const showFeedbackModal = () => {
    setIsModalVisible(true);
  };

  const hideFeedbackModal = () => {
    setIsModalVisible(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
          
          <div className="text-center">
            <Button 
              type="primary" 
              size="large" 
              onClick={showFeedbackModal}
              className="px-8"
            >
              Provide Feedback
            </Button>
          </div>
      
      {/* Render the feedback modal */}
      <InductionFeedbackModal 
        visible={isModalVisible} 
        onClose={hideFeedbackModal} 
      />
    </div>
  );
};

export default FeedbackTestPage;