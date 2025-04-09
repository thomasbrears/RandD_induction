import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Rate, Input, Radio, Button, Form, Divider } from 'antd';
import { SmileOutlined, MehOutlined, FrownOutlined, LoadingOutlined } from '@ant-design/icons';
import { submitFeedback } from '../api/FeedbackApi';
import { getUser } from '../api/UserApi';
import { updateUserInduction } from '../api/UserInductionApi';
import useAuth from '../hooks/useAuth';
import { notifyError, notifySuccess } from '../utils/notificationService';

const { Text } = Typography;
const { TextArea } = Input;

const InductionFeedbackModal = ({ visible, onClose, inductionId, inductionName = '', userInductionId = null }) => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [needsDetailedFeedback, setNeedsDetailedFeedback] = useState(false);
  const [userDetails, setUserDetails] = useState({ fullName: '', email: '', department: null });
  const [formIsValid, setFormIsValid] = useState(false);
 
  // Use the auth hook instead of direct Firebase auth
  const { user, loading } = useAuth();

  // Get user information from the useAuth hook
  useEffect(() => {
    const fetchUserDetails = async () => {
      // Only proceed if user is authenticated and not loading
      if (user && !loading) {
        // Initialize user info with email from auth
        const userInfo = {
          email: user.email || '',
          department: user.role || null
        };
       
        try {
          // If user has additional details from auth hook already
          if (user.displayName) {
            userInfo.fullName = user.displayName;
          }
         
          // Try to get additional user info from the API
          const userProfile = await getUser(user, user.uid);
         
          if (userProfile) {
            // Set full name from profile or fallback to what we already have
            if (userProfile.fullName) {
              userInfo.fullName = userProfile.fullName;
            } else if (userProfile.name) {
              userInfo.fullName = userProfile.name;
            }
           
            // Get user's department if available
            if (userProfile.department) {
              userInfo.department = userProfile.department;
            } else if (userProfile.departments) {
              userInfo.department = userProfile.departments;
            }
          }
        } catch (error) {
          console.error('Error fetching additional user details:', error);
          // We already have basic user info from useAuth, so we can continue
        }
       
        setUserDetails(userInfo);
      }
    };
   
    fetchUserDetails();
  }, [user, loading]);

  // Monitor form values and check if all required fields are filled
  useEffect(() => {
    const validateForm = () => {
      try {
        // Get current form values without validation
        const values = form.getFieldsValue();
       
        // Check if all required fields are filled
        const overallRatingFilled = !!values.overallRating;
        const websiteUsabilityFilled = !!values.websiteUsability;
        const contentClarityFilled = !!values.contentClarity;
       
        // If detailed feedback is required, check if it's filled
        const detailedFeedbackRequired = needsDetailedFeedback;
        const detailedFeedbackFilled = !!values.detailedFeedback;
       
        // Set form validity
        const isValid = overallRatingFilled &&
                        websiteUsabilityFilled &&
                        contentClarityFilled &&
                        (!detailedFeedbackRequired || detailedFeedbackFilled);
       
        setFormIsValid(isValid);
      } catch (error) {
        console.error('Error checking form validity:', error);
        setFormIsValid(false);
      }
    };
   
    validateForm();

    // Set up a listener for form value changes
    const unsubscribe = form.getFieldsValue();
    
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [form, needsDetailedFeedback]);

  // Update form validity when field values change
  const handleFieldsChange = () => {
    try {
      const values = form.getFieldsValue();
     
      // Check if all required fields are filled
      const overallRatingFilled = !!values.overallRating;
      const websiteUsabilityFilled = !!values.websiteUsability;
      const contentClarityFilled = !!values.contentClarity;
     
      // If detailed feedback is required, check if it's filled
      const detailedFeedbackRequired = needsDetailedFeedback;
      const detailedFeedbackFilled = !!values.detailedFeedback;
     
      // Set form validity
      const isValid = overallRatingFilled &&
                      websiteUsabilityFilled &&
                      contentClarityFilled &&
                      (!detailedFeedbackRequired || detailedFeedbackFilled);
     
      setFormIsValid(isValid);
    } catch (error) {
      console.error('Error checking form validity on field change:', error);
      setFormIsValid(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Validate form fields
      const values = await form.validateFields();
     
      // Set submitting state
      setSubmitting(true);
     
      // Add induction ID if available
      if (inductionId) {
        values.inductionId = inductionId;
      }
     
      // Add induction name if available
      if (inductionName) {
        values.inductionName = inductionName;
      }
     
      // Add metadata about the feedback
      values.feedbackType = 'induction';
      values.submittedAt = new Date().toISOString();
     
      // If user is logged in, add their details to the submission
      if (user) {
        // Add user ID from authentication
        values.userId = user.uid;
       
        // Add user details from the retrieved profile
        values.fullName = userDetails.fullName || '';
        values.email = userDetails.email || user.email || '';
       
        // Use the user's department from their profile
        if (userDetails.department) {
          // Handle both string and array department formats
          if (Array.isArray(userDetails.department)) {
            values.department = userDetails.department[0] || '';
            values.departments = userDetails.department;
          } else {
            values.department = userDetails.department;
          }
        }
       
        // Add user role if available
        if (user.role) {
          values.role = user.role;
        }
       
        // If we have the token from useAuth, include it
        if (user.token) {
          values.authToken = user.token;
        }
      }
      
      // Create a consolidated feedback object that can be stored in the userInduction record
      const feedbackSummary = {
        overallRating: values.overallRating,
        websiteUsability: values.websiteUsability,
        contentClarity: values.contentClarity,
        detailedFeedback: values.detailedFeedback || '',
        submittedAt: values.submittedAt
      };
      
      // Submit feedback through the feedback API
      // Update the userInduction record with the feedback
      const operations = [
        submitFeedback(values)
      ];
      
      // If we have a userInductionId, also update the userInduction record
      if (user && userInductionId) {
        operations.push(
          updateUserInduction(user, userInductionId, {
            feedback: feedbackSummary
          })
        );
      }
      
      // Execute both operations
      await Promise.all(operations);
     
      // Display success notification
      notifySuccess('Thank you for your feedback!');
     
      // Reset the form
      form.resetFields();
      setSelectedRating(null);
      setNeedsDetailedFeedback(false);
      setFormIsValid(false);
     
      // Close the modal
      onClose();
    } catch (error) {
      // Log any errors that occur
      console.error('Feedback submission error:', error);
     
      // Show error notification
      notifyError('There was a problem submitting your feedback. Please try again.');
    } finally {
      // Reset submitting state
      setSubmitting(false);
    }
  };

  // Check for poor ratings to trigger detailed feedback
  const checkForDetailedFeedback = (value) => {
    setSelectedRating(value);
    // If rating is Frown (1) or Meh (2), we need detailed feedback
    setNeedsDetailedFeedback(value < 3);
   
    // Update form values and trigger validation
    form.setFieldsValue({ overallRating: value });
    handleFieldsChange();
  };

  // Custom icons with dynamic sizing for selected rating
  const customIcons = {
    1: <FrownOutlined className={`text-red-500 ${selectedRating === 1 ? 'text-4xl' : 'text-2xl'} transition-all duration-200`} />,
    2: <MehOutlined className={`text-yellow-500 ${selectedRating === 2 ? 'text-4xl' : 'text-2xl'} transition-all duration-200`} />,
    3: <SmileOutlined className={`text-green-500 ${selectedRating === 3 ? 'text-4xl' : 'text-2xl'} transition-all duration-200`} />
  };

  return (
    <Modal
      title={
        <div>
          <h1 className="mb-0 text-xl">How was your induction experience?</h1>
        </div>
      }
      open={visible}
      width={600}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!formIsValid || submitting}
          icon={submitting ? <LoadingOutlined /> : null}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      ]}
    >
      <Space direction="vertical" size="large" className="w-full">
        <div>
          <p className="text-gray-600 text-sm">
            Your feedback helps us improve the induction process and is much appreciated.
          </p>
        </div>
        <Form
          form={form}
          layout="vertical"
          onFieldsChange={handleFieldsChange}
        >
          {/* Overall Rating Section */}
          <Form.Item
            name="overallRating"
            label="How would you rate your overall induction experience?"
            rules={[{ required: true, message: 'Please rate your experience' }]}
          >
            <Rate
              className="text-3xl"
              value={selectedRating}
              onChange={checkForDetailedFeedback}
              character={({ index }) => customIcons[index + 1]}
              count={3}
            />
          </Form.Item>
          <Divider />
          {/* Website Usability Section */}
          <Form.Item
            name="websiteUsability"
            label="How easy was it to complete the induction using our website?"
            rules={[{ required: true, message: 'Please rate the website usability' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="veryEasy">Very easy - I had no issues</Radio>
                <Radio value="easy">Easy - I had minor issues</Radio>
                <Radio value="neutral">Neutral</Radio>
                <Radio value="difficult">Difficult - I had several issues</Radio>
                <Radio value="veryDifficult">Very difficult - I had many issues</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Divider />
          {/* Content Clarity Section */}
          <Form.Item
            name="contentClarity"
            label="How clear and helpful was the induction content?"
            rules={[{ required: true, message: 'Please rate the content clarity' }]}
          >
            <Radio.Group>
              <Space direction="vertical">
                <Radio value="veryClear">Very clear and helpful</Radio>
                <Radio value="mostlyClear">Mostly clear and helpful</Radio>
                <Radio value="somewhatClear">Somewhat clear and helpful</Radio>
                <Radio value="notClear">Not clear or helpful</Radio>
              </Space>
            </Radio.Group>
          </Form.Item>
          <Divider />
          {/* Conditional Detailed Feedback Section */}
          {needsDetailedFeedback && (
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200 mb-4">
              <Text className="text-amber-800">
                We noticed you didn't have the best experience. Please tell us what went wrong and how we can improve.
              </Text>
            </div>
          )}
         
          <Form.Item
            name="detailedFeedback"
            label="Do you have any specific feedback or suggestions for improvement?"
            rules={needsDetailedFeedback ? [{ required: true, message: 'Please provide your feedback for improvement' }] : []}
          >
            <TextArea
              rows={4}
              placeholder={needsDetailedFeedback ?
                "Please tell us what issues you encountered and how we can improve..." :
                "Please share your thoughts, suggestions, or any issues you encountered..."}
            />
          </Form.Item>
        </Form>
      </Space>
    </Modal>
  );
};

export default InductionFeedbackModal;