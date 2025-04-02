import React, { useState, useRef, useEffect } from 'react';
import { Card, Empty, Button } from 'antd';
import { FlagOutlined, ClockCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

const ExpandableText = ({ text, maxLength = 400 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
    }
  }, []);

  // If text is shorter than max length, just return the text
  if (text.length <= maxLength) {
    return (
      <div 
        ref={textRef}
        style={{
          maxWidth: '100%',
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          whiteSpace: 'normal',
        }}
        className="debug-text-container w-full text-wrap"
      >
        {text}
      </div>
    );
  }

  // If text is longer than max length, show expandable text
  return (
    <div 
      ref={textRef}
      style={{
        maxWidth: '100%',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: 'normal',
      }}
      className="debug-text-container w-full text-wrap"
    >
      <div 
        style={{
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
        }}
      >
        {isExpanded ? text : `${text.slice(0, maxLength)}...`}
      </div>
      <Button 
        type="link" 
        onClick={() => setIsExpanded(!isExpanded)}
        className="pl-0 mt-2"
      >
        {isExpanded ? 'Show Less' : 'Show More'}
      </Button>
    </div>
  );
};

const FeedbackSection = ({ userInduction }) => {
    // Render nothing if no feedback exists
    if (!userInduction?.feedback) {
      return (
        <Card 
          title={<h2 className="text-lg font-semibold">Feedback</h2>} 
          className="shadow-md"
        >
          <Empty 
            description="No feedback provided" 
            image={Empty.PRESENTED_IMAGE_SIMPLE} 
          />
        </Card>
      );
    }
  
    const feedback = typeof userInduction.feedback === 'object' 
      ? userInduction.feedback 
      : { detailedFeedback: String(userInduction.feedback) };
  
    return (
      <Card>
          <div className="space-y-6">
            {/* Overall Rating */}
            {feedback.overallRating && (
              <div>
                <p className="font-medium block mb-2 text-gray-800 text-base">Overall Experience Rating:</p>
                <div className="ml-2">
                  {feedback.overallRating === 1 && (
                    <div className="flex items-center">
                      <FlagOutlined className="text-red-500 text-xl mr-2" />
                      <p className="text-red-500">😞 Not Satisfied</p>
                    </div>
                  )}
                  {feedback.overallRating === 2 && (
                    <div className="flex items-center">
                      <ClockCircleOutlined className="text-yellow-500 text-xl mr-2" />
                      <p className="text-yellow-500">😐 Neutral</p>
                    </div>
                  )}
                  {feedback.overallRating === 3 && (
                    <div className="flex items-center">
                      <CheckCircleOutlined className="text-green-500 text-xl mr-2" />
                      <p className="text-green-500">😊 Satisfied</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Website Usability */}
            {feedback.websiteUsability && (
              <div>
                <p className="font-medium block mb-2 text-gray-800 text-base">Website Usability:</p>
                <div className="ml-2">
                  {(() => {
                    switch(feedback.websiteUsability) {
                      case 'veryEasy':
                        return <p className="text-green-600">Very easy - Had no issues</p>;
                      case 'easy':
                        return <p className="text-green-500">Easy - Had minor issues</p>;
                      case 'neutral':
                        return <p className="text-yellow-500">Neutral</p>;
                      case 'difficult':
                        return <p className="text-orange-500">Difficult - Had several issues</p>;
                      case 'veryDifficult':
                        return <p className="text-red-500">Very difficult - Had many issues</p>;
                      default:
                        return <p>{feedback.websiteUsability}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            
            {/* Content Clarity */}
            {feedback.contentClarity && (
              <div>
                <p className="font-medium block mb-2 text-gray-800 text-base">Content Clarity:</p>
                <div className="ml-2">
                  {(() => {
                    switch(feedback.contentClarity) {
                      case 'veryClear':
                        return <p className="text-green-600">Very clear and helpful</p>;
                      case 'mostlyClear':
                        return <p className="text-green-500">Mostly clear and helpful</p>;
                      case 'somewhatClear':
                        return <p className="text-yellow-500">Somewhat clear and helpful</p>;
                      case 'notClear':
                        return <p className="text-red-500">Not clear or helpful</p>;
                      default:
                        return <p>{feedback.contentClarity}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            
            {/* Detailed Feedback */}
            {feedback.detailedFeedback && (
              <div>
                <p className="font-medium block mb-2 text-gray-800 text-base">Additional Feedback:</p>
                <div className="ml-2">
                  <ExpandableText text={feedback.detailedFeedback} />
                </div>
              </div>
            )}
          </div>
      </Card>
    );
  };

export default FeedbackSection;