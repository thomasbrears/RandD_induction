import { notification, message } from 'antd';
import { 
  CheckCircleFilled, 
  InfoCircleFilled, 
  WarningFilled, 
  CloseCircleFilled,
  LoadingOutlined
} from '@ant-design/icons';

// Configure default notification settings
notification.config({
  placement: 'topRight',
  duration: 4,
});

// Message configuration (for smaller notifications)
message.config({
  top: 60,
  duration: 3,
  maxCount: 3,
});

// Helper functions for notifications
export const notifySuccess = (title, description = "") => {
  notification.success({
    message: title,
    description,
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  });
};

export const notifyError = (title, description = "") => {
  notification.error({
    message: title,
    description,
    icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
  });
};

export const notifyWarning = (title, description = "") => {
  notification.warning({
    message: title,
    description,
    icon: <WarningFilled style={{ color: '#faad14' }} />,
  });
};

export const notifyInfo = (title, description = "") => {
  notification.info({
    message: title,
    description,
    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
  });
};

// Smaller message notifications (toast-like)
export const messageSuccess = (content) => {
  message.success({
    content,
    icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
  });
};

export const messageError = (content) => {
  message.error({
    content,
    icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
  });
};

export const messageWarning = (content) => {
  message.warning({
    content,
    icon: <WarningFilled style={{ color: '#faad14' }} />,
  });
};

export const messageInfo = (content) => {
  message.info({
    content,
    icon: <InfoCircleFilled style={{ color: '#1890ff' }} />,
  });
};

// Promise-based notification - similar to toast.promise
export const notifyPromise = (promise, options = {}) => {
    const { pending, success, error } = options;
    let notificationKey = `notification-${Date.now()}`;
    
    // Show pending notification
    if (pending) {
      notification.info({
        key: notificationKey,
        message: typeof pending === 'string' ? pending : 'Processing...',
        description: typeof pending === 'object' ? pending.description : '',
        icon: <LoadingOutlined style={{ color: '#1890ff' }} />,
        duration: 0 // Don't auto-close while pending
      });
    }
  
    // Handle promise resolution
    promise
      .then((result) => {
        if (success) {
          notification.success({
            key: notificationKey,
            message: typeof success === 'function' ? success(result) : typeof success === 'string' ? success : 'Success',
            description: typeof success === 'object' ? success.description : '',
            icon: <CheckCircleFilled style={{ color: '#52c41a' }} />,
            duration: 4.5
          });
        }
        return result;
      })
      .catch((err) => {
        if (error) {
          notification.error({
            key: notificationKey,
            message: typeof error === 'function' ? error(err) : typeof error === 'string' ? error : 'Error',
            description: typeof error === 'object' ? error.description : '',
            icon: <CloseCircleFilled style={{ color: '#ff4d4f' }} />,
            duration: 4.5
          });
        }
        return Promise.reject(err); // Re-throw to not interrupt error chain
      });
  
    return promise; // Return the original promise to allow chaining
  };
  

// Specialized notifications for common use cases
export const notifyFormError = (errorMsg = "Please fix the errors in the form") => {
  messageError(errorMsg);
};

export const notifyDataSaved = (entityName = "Data") => {
  messageSuccess(`${entityName} saved successfully`);
};

export const notifyApiError = (error) => {
  const title = "Operation Failed";
  let description = "An unexpected error occurred.";
  
  if (error?.response?.data?.message) {
    description = error.response.data.message;
  } else if (error?.message) {
    description = error.message;
  }
  
  notifyError(title, description);
};

export default {
  notifySuccess,
  notifyError,
  notifyWarning,
  notifyInfo,
  messageSuccess,
  messageError,
  messageWarning,
  messageInfo,
  notifyPromise,
  notifyFormError,
  notifyDataSaved,
  notifyApiError,
};