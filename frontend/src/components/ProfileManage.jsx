import React, { useState, useEffect } from 'react';
import { Button, Tooltip, Modal, Form, Input, Skeleton, Divider } from 'antd';
import { EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { submitContactForm } from '../api/ContactApi';
import { notifySuccess, notifyError } from '../utils/notificationService';
import useAuth from '../hooks/useAuth';

const ProfileManage = () => {
  const { user, authToken } = useAuth();
  const [form] = Form.useForm();
  const [userProfile, setUserProfile] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user && user.uid) {
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setUserProfile({
              ...userSnap.data(),
              // Add displayName from auth user object if needed
              displayName: user.displayName || userSnap.data().displayName || userSnap.data().fullName
            });
          } else {
            console.log("No user profile data found");
            // Still set the displayName from auth
            setUserProfile({
              displayName: user.displayName || ""
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // Set fallback data
          setUserProfile({
            displayName: user.displayName || ""
          });
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  // Field definitions
  const profileFields = [
    { key: 'displayName', label: 'Name' },
    { key: 'position', label: 'Position' },
    { key: 'department', label: 'Department' }
  ];

  // Handle edit button click
  const handleEditClick = (field) => {
    setCurrentField(field);
    form.setFieldsValue({
      fieldName: field.label,
      currentValue: userProfile[field.key] || 'Not set',
      requestedValue: userProfile[field.key] || ''
    });
    setModalVisible(true);
  };

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsSubmitting(true);
    
    try {
      // Use the user's department for routing if available
      const routeDepartment = userProfile.department || 'HR';
      
      const formData = {
        fullName: user?.displayName || 'User',
        email: user?.email,
        contactType: routeDepartment,
        subject: `Profile Update Request: ${values.fieldName}`,
        message: `I would like to request an update to my profile information:\n\nField: ${values.fieldName}\nCurrent Value: ${values.currentValue}\nRequested Value: ${values.requestedValue}\n\nReason for change: ${values.reason}`,
        userId: user?.uid,
        formType: 'profileUpdate'
      };
      
      await submitContactForm(formData, authToken);
      
      notifySuccess(
        'Request Submitted', 
        `Your request to update your ${values.fieldName.toLowerCase()} has been submitted. You'll be notified when it's processed.`
      );
      
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error submitting update request:", error);
      notifyError(
        'Submission Failed', 
        'There was a problem submitting your request. Please try again later.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-3 px-4 border border-gray-300 rounded-lg shadow bg-white w-full">
      {isLoading ? (
        <div className="flex items-center space-x-4">
          <Skeleton.Avatar active size={64} shape="circle" />
          <div className="flex-1">
            <Skeleton.Input active block style={{ height: 28, marginBottom: 8 }} />
            <Skeleton.Input active block style={{ height: 20, width: '60%' }} />
          </div>
        </div>
      ) : (
        <div className="flex items-center">
          <div className="flex-shrink-0 flex justify-center items-center h-16 w-16 rounded-full bg-blue-50 text-blue-600 text-2xl font-semibold">
            {userProfile.displayName ? userProfile.displayName.charAt(0).toUpperCase() : "U"}
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex items-center">
              <h3 className="text-lg font-semibold m-0">{userProfile.displayName || 'Name not set'}</h3>
              <Tooltip title="Request name update">
                <Button 
                  icon={<EditOutlined />} 
                  type="text"
                  onClick={() => handleEditClick(profileFields[0])}
                  className="text-blue-500 ml-2"
                  size="small"
                />
              </Tooltip>
            </div>
            
            <div className="flex mt-1 text-sm text-gray-600">
              <div className="flex items-center mr-6">
                <p><span>Position: </span><b>{userProfile.position || 'Position not set'}</b></p>
                <Tooltip title="Request position update">
                  <Button 
                    icon={<EditOutlined />} 
                    type="text"
                    onClick={() => handleEditClick(profileFields[1])}
                    className="text-blue-500 ml-1"
                    size="small"
                  />
                </Tooltip>
              </div>
              
              <div className="flex items-center">
              <p><span>Department: </span><b>{userProfile.department || 'Department not set'}</b></p>
                <Tooltip title="Request department update">
                  <Button 
                    icon={<EditOutlined />} 
                    type="text"
                    onClick={() => handleEditClick(profileFields[2])}
                    className="text-blue-500 ml-1"
                    size="small"
                  />
                </Tooltip>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <Tooltip title="You cannot directly edit your name, position or department. Please Submit a change request for review if you would like to update this information.">
              <InfoCircleOutlined className="text-blue-500" />
            </Tooltip>
          </div>
        </div>
      )}
      
      {/* Change Request Modal */}
      <Modal
        title={`Request ${currentField?.label} Update`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={400}
      >
        <Divider />
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-800">
            <InfoCircleOutlined className="mr-2" />
            You cannot directly edit your profile information. This request will be sent to your department for approval.
          </p>
        </div>
        
        <Form 
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item name="fieldName" hidden>
            <Input />
          </Form.Item>
          
          <Form.Item label="Current Value" name="currentValue">
            <Input disabled />
          </Form.Item>
          
          <Form.Item 
            label="Requested Value" 
            name="requestedValue"
            rules={[{ required: true, message: 'Please enter the updated value' }]}
          >
            <Input placeholder="Enter the new value" />
          </Form.Item>
          
          <Form.Item 
            label="Reason for Change" 
            name="reason"
            rules={[{ required: true, message: 'Please provide a reason for this change' }]}
          >
            <Input.TextArea 
              placeholder="Briefly explain why you need this information updated" 
              rows={3} 
            />
          </Form.Item>
          
          <Form.Item className="mb-0 flex justify-end">
            <Button onClick={() => setModalVisible(false)} className="mr-2">
              Cancel
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isSubmitting}
              className="bg-gray-800 hover:bg-gray-900 text-white"
            >
              Submit Request
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfileManage;