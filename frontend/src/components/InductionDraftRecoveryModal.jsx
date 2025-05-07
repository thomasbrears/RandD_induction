import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';

/**
 * Modal that prompts users to recover saved draft when returning to an induction creation/edit page
 */
const InductionDraftRecoveryModal = ({
  isVisible,
  onRecover,
  onStartFresh, // Renamed internally but kept for interface compatibility
  savedDraft,
  mode = "edit" // "edit" or "create"
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
  
  const lastSavedTime = savedDraft?.lastUpdated ? formatDate(savedDraft.lastUpdated) : 'recently';
  const action = mode === "edit" ? "editing" : "creating";
  const questionCount = savedDraft?.questions?.length || 0;
  const inductionName = savedDraft?.name || 'Unnamed Induction';
  
  return (
    <Modal
      title={
        <div className="flex items-center text-amber-600">
          <InfoCircleOutlined className="mr-2" />
          <span>Unsaved Changes Found</span>
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
            We found unsaved changes from {lastSavedTime} when you were {action} this induction. Would you like to recover these changes?
          </p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
          {/* Draft information - simplified */}
          <div className="flex items-center mb-3">
            <CheckCircleOutlined className="text-green-500 mr-2" />
            <span className="font-medium">Local changes available</span>
          </div>
          
          <div className="text-sm text-gray-700">
            <p className="mb-2">
              <span className="font-medium">Name:</span> {inductionName}
            </p>
            
            <p className="mb-0">
              <span className="font-medium">Questions:</span> {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </p>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-6">
          Auto-recovering in <span className="font-bold text-amber-600">{countdown}</span> seconds...
        </p>
        
        <div className="flex justify-between space-x-4">
          <Button
            type="default"
            onClick={onStartFresh}
            className="w-1/2"
          >
            {mode === "edit" ? "Load Saved Version" : "Start New"}
          </Button>
          
          <Button
            type="primary"
            onClick={onRecover}
            className="w-1/2"
          >Recover Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

InductionDraftRecoveryModal.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onRecover: PropTypes.func.isRequired,
  onStartFresh: PropTypes.func.isRequired,
  savedDraft: PropTypes.shape({
    name: PropTypes.string,
    department: PropTypes.string,
    description: PropTypes.string,
    questions: PropTypes.array,
    lastUpdated: PropTypes.string
  }),
  mode: PropTypes.oneOf(['edit', 'create'])
};

export default InductionDraftRecoveryModal;