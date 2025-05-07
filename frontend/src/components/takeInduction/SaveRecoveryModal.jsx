import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

/**
 * Modal that prompts users to recover saved progress when returning to an induction
 */
const SaveRecoveryModal = ({ 
  isVisible, 
  onRecover, 
  onStartFresh, 
  savedProgress 
}) => {
  // More user-friendly date display
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      // Format based on how long ago
      if (diffMins < 60) {
        return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      } else if (diffHours < 24) {
        return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      } else if (diffDays < 7) {
        return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
      } else {
        return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Unknown date';
    }
  };
  
  // Auto-recovery timer (10 seconds)
  const [countdown, setCountdown] = useState(10);
  
  useEffect(() => {
    let timer;
    if (isVisible && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && isVisible) {
      onRecover();
    }
    
    return () => {
      clearTimeout(timer);
    };
  }, [countdown, isVisible, onRecover]);
  
  // Reset countdown when modal opens
  useEffect(() => {
    if (isVisible) {
      setCountdown(10);
    }
  }, [isVisible]);
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!savedProgress || !savedProgress.answeredQuestions) return 0;
    
    const answered = Object.keys(savedProgress.answeredQuestions).length;
    const total = savedProgress.totalQuestions || 1;
    
    return Math.round((answered / total) * 100);
  };
  
  const completionPercentage = calculateCompletion();
  const lastSavedTime = savedProgress?.lastUpdated ? formatDate(savedProgress.lastUpdated) : 'recently';
  
  return (
    <Modal
      title={
        <div className="flex items-center text-amber-600">
          <InfoCircleOutlined className="mr-2" />
          <span>Resume Your Progress</span>
        </div>
      }
      open={isVisible}
      footer={null}
      closable={false}
      maskClosable={false}
      centered
    >
      <div className="py-2">
        <div className="mb-4">
          <p className="text-gray-700">
            We found your saved progress from {lastSavedTime}. Would you like to continue where you left off?
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
          {/* Progress information */}
          <div className="flex items-center mb-2">
            <CheckCircleOutlined className="text-green-500 mr-2" />
            <span className="font-medium">Progress saved</span>
          </div>
          
          <div className="flex justify-between mb-1">
            <span className="text-sm text-gray-600">Completion</span>
            <span className="text-sm text-gray-600">{completionPercentage}%</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
            <div 
              className="bg-blue-600 h-2.5 rounded-full" 
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          
          <div className="text-sm text-gray-500">
            You've completed{' '}
            <span className="font-medium text-gray-700">
              {Object.keys(savedProgress?.answeredQuestions || {}).length}
            </span>{' '}
            of{' '}
            <span className="font-medium text-gray-700">
              {savedProgress?.totalQuestions || 0}
            </span>{' '}
            questions
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Auto-resuming in <span className="font-bold text-amber-600">{countdown}</span> seconds...
        </p>
        
        <div className="flex justify-between space-x-4">
          <Button
            type="default"
            onClick={onStartFresh}
            className="w-1/2"
          >Start Fresh
          </Button>
          
          <Button
            type="primary"
            onClick={onRecover}
            className="w-1/2"
          >Resume Progress
          </Button>
        </div>
      </div>
    </Modal>
  );
};

SaveRecoveryModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onRecover: PropTypes.func.isRequired,
  onStartFresh: PropTypes.func.isRequired,
  savedProgress: PropTypes.shape({
    answeredQuestions: PropTypes.object,
    totalQuestions: PropTypes.number,
    lastUpdated: PropTypes.string,
    currentQuestionIndex: PropTypes.number
  })
};

export default SaveRecoveryModal;