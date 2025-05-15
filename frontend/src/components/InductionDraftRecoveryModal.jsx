import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Modal, Progress, Button, Space, Divider } from 'antd';
import { 
  CheckCircleOutlined, 
  ReloadOutlined, 
  ArrowRightOutlined,
  EditOutlined,
  SaveOutlined
} from '@ant-design/icons';

/**
 * Modal that prompts users to recover saved draft when returning to an induction creation/edit page
 * Updated to be more consistent with other recovery modals in the system
 */
const InductionDraftRecoveryModal = ({
  isVisible,
  onRecover,
  onStartFresh,
  savedDraft,
  mode = "edit" // "edit" or "create"
}) => {
  // Auto-recovery timer (10 seconds)
  const [countdown, setCountdown] = useState(10);
  
  // Check if there's actual draft data to recover
  const hasDraftData = savedDraft && 
                      (savedDraft.questions?.length > 0 || 
                      savedDraft.name || 
                      savedDraft.description);
  
  // Reset countdown and start timer when modal becomes visible
  useEffect(() => {
    let timer;
    
    if (isVisible && hasDraftData) {
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
    
    // Cleanup function
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isVisible, onRecover, hasDraftData]);
  
  // More user-friendly date display
  const formatDate = (dateValue) => {
    if (!dateValue) return 'recently';
    
    try {
      // Convert to Date object if it's a string
      const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
      
      // Check if it's a valid date
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
  
  // If there's no draft data to recover or modal is not visible, return null
  if (!isVisible || !hasDraftData) {
    return null;
  }
  const lastSavedTime = formatDate(savedDraft.lastUpdated);
  const action = mode === "edit" ? "editing" : "creating";
  const questionCount = savedDraft?.questions?.length || 0;
  const inductionName = savedDraft?.name || 'Unnamed Induction';
  
  return (
    <Modal
      open={isVisible}
      title={
        <div className="flex items-center">
          <SaveOutlined style={{ color: '#1890ff', marginRight: 8 }} />
          <span>Resume Your {mode === "edit" ? "Editing" : "Creation"} Progress</span>
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
          We've found your unsaved changes from <strong>{lastSavedTime}</strong> when you were {action} this induction.
          <br /> 
          Would you like to recover these changes, or start with the latest saved version?
        </p>
        
        <Divider style={{ margin: '16px 0' }} />
        
        {/* Draft information */}
        <div className="mb-4">
          <h5 style={{ marginBottom: '12px' }}>Draft Information</h5>
          
          <div className="flex items-center mb-3">
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            <p className="mb-0">Last edited {lastSavedTime}</p>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mb-3">
            <div className="text-sm text-gray-700">
              <p className="mb-2">
                <span className="font-medium">Name:</span> {inductionName}
              </p>
              
              <p className="mb-0">
                <span className="font-medium">Questions:</span> {questionCount} {questionCount === 1 ? 'question' : 'questions'}
              </p>
              
              {savedDraft.department && (
                <p className="mb-0">
                  <span className="font-medium">Department:</span> {savedDraft.department}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {/* Auto-recovery explanation */}
        <div className="my-4 mt-5 text-center text-gray-500 text-xs">
          <Space align="center">
            <p>
              Your changes will be automatically recovered in <strong style={{ color: '#fa8c16' }}>{countdown}</strong> seconds
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
            Recover Changes
          </Button>
          
          <Button
            block
            onClick={onStartFresh}
            icon={<ReloadOutlined />}
          >
            {mode === "edit" ? "Load Saved Version" : "Start Fresh"}
          </Button>
          
          {/* Optional note if applicable */}
          <div className="mt-1 text-center">
            <p style={{ fontSize: '13px', color: 'rgba(0, 0, 0, 0.45)' }}>
              <EditOutlined style={{ marginRight: 4 }} />
              Note: Any image uploads were not saved and will need to be re-uploaded when you resume.
            </p>
          </div>
        </Space>
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
    lastUpdated: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.instanceOf(Date)
    ])
  }),
  mode: PropTypes.oneOf(['edit', 'create'])
};

export default InductionDraftRecoveryModal;