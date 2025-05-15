import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Button, Space, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  ReloadOutlined, 
  ArrowRightOutlined,
  UploadOutlined,
  SaveOutlined
} from '@ant-design/icons';

const SaveRecoveryModal = ({ isVisible, onRecover, onStartFresh, savedProgress }) => {
  // Auto-recovery timer (10 seconds)
  const [countdown, setCountdown] = useState(10);
  
  // Use a ref to track if we've already handled the "no progress" case
  const handledNoProgress = useRef(false);
  
  // Check if theres actual progress to recover
  const hasProgress = savedProgress && 
                      savedProgress.answeredQuestions && 
                      Object.keys(savedProgress.answeredQuestions).length > 0;
  
  // Reset countdown and start timer when modal becomes visible
  useEffect(() => {
    let timer;
    
    if (isVisible && hasProgress) {
      // Reset countdown to 10 when modal becomes visible
      setCountdown(10);
      
      // Set up the countdown timer
      timer = setInterval(() => {
        setCountdown(prevCount => {
          const newCount = prevCount - 1;
          if (newCount <= 0) {
            // When countdown reaches 0, trigger recovery and clear interval
            clearInterval(timer);
            onRecover();
            return 0;
          }
          return newCount;
        });
      }, 1000);
    }
    
    // Handle the "no progress" case
    if (isVisible && !hasProgress && !handledNoProgress.current) {
      handledNoProgress.current = true;
      onStartFresh();
    }
    
    // Reset the ref when modal is closed
    if (!isVisible) {
      handledNoProgress.current = false;
    }
    
    // Cleanup function
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isVisible, onRecover, hasProgress, onStartFresh]);
  
  // More user-friendly date display
  const formatDate = (dateValue) => {
    if (!dateValue) return 'recently';
    
    try {
      // Convert to Date object if its a string
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Check if its a valid date
      if (isNaN(date.getTime())) {
        console.error('Invalid date:', dateValue);
        return 'recently';
      }
      
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      // Format based on how long ago
      if (diffMins < 1) {
        return 'just now';
      } else if (diffMins < 60) {
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
      return 'recently';
    }
  };
  
  // Calculate completion percentage
  const calculateCompletion = () => {
    if (!savedProgress || !savedProgress.answeredQuestions) return 0;
    
    const answered = Object.keys(savedProgress.answeredQuestions).length;
    const total = savedProgress.totalQuestions || 1;
    
    return Math.round((answered / total) * 100);
  };
  
  const completionPercentage = calculateCompletion();
  
  // Get the lastUpdated value, handling both string and Date object formats
  const lastUpdated = savedProgress?.lastUpdated || null;
  const lastSavedTime = formatDate(lastUpdated);
  
  // If theres no progress to recover or modal is not visible, return null
  if (!isVisible || !hasProgress) {
    return null;
  }
  
  return (
    <Modal
      open={isVisible}
      title={
        <div className="flex items-center">
          <SaveOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <span>Resume Your Induction Progress</span>
        </div>
      }
      footer={null}
      closable={false}
      maskClosable={false}
      centered
      width={420}
      bodyStyle={{ padding: '16px' }}
    >
      <div className="px-1">
        {/* Intro text */}
        <p>
          We've found your saved induction progress from <strong>{lastSavedTime}</strong>.
          <br /> 
          Would you like to continue where you left off, or start a new attempt?
        </p>
        
        <Divider style={{ margin: '16px 0' }} />
        
        {/* Progress information */}
        <div className="mb-4">
          <h5 style={{ marginBottom: '12px' }}>Your Progress</h5>
          
          <div className="flex justify-between items-center mb-2">
            <p>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              Last saved {lastSavedTime}
            </p>
            <p><strong>{completionPercentage}% Complete</strong></p>
          </div>
          
          <Progress 
            percent={completionPercentage} 
            size="small" 
            status="active" 
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#52c41a',
            }}
            style={{ marginBottom: '12px' }}
          />
          
          <div className="my-3">
            <p>
              You've completed <strong>{Object.keys(savedProgress?.answeredQuestions || {}).length}</strong> of{' '}
              <strong>{savedProgress?.totalQuestions || 0}</strong> questions in this induction.
            </p>
          </div>
        </div>
        
        {/* Auto-resume explanation */}
        <div className="my-4 mt-5 text-center text-gray-500 text-xs">
          <Space align="center">
            <p>
              Your progress will be automatically restored in <strong style={{ color: '#fa8c16' }}>{countdown}</strong> seconds
            </p>
          </Space>
        </div>

        
        {/* Action buttons */}
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Button
            block
            type="primary"
            onClick={onRecover}
            icon={<ArrowRightOutlined />}
            size="large"
          >
            Resume
          </Button>
          
          <Button
            block
            onClick={onStartFresh}
            icon={<ReloadOutlined />}
          >
            Start From Beginning (Clear Progress)
          </Button>
          
          {/* Subtle file upload warning */}
          <div className="mt-1 text-center">
            <p style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.45)' }}>
              <UploadOutlined style={{ marginRight: 4 }} />
              Note: Any file uploads were not saved and will need to be re-uploaded when you resume.
            </p>
          </div>
        </Space>
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
    lastUpdated: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ]),
    currentQuestionIndex: PropTypes.number
  })
};

export default SaveRecoveryModal;