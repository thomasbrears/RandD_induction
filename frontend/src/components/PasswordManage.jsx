import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Progress } from 'antd';
import { 
  getAuth, 
  updatePassword, 
  EmailAuthProvider,
  reauthenticateWithCredential,
  linkWithCredential
} from 'firebase/auth';
import { notifyError, notifyPromise, notifyWarning } from '../utils/notificationService';

const PasswordManage = () => {
  const auth = getAuth();
  const [form] = Form.useForm();
  const [passwordMode, setPasswordMode] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [hasPasswordProvider, setHasPasswordProvider] = useState(false);

  const TESTING_MODE = true; 

  // Determine if user needs to set password or change password
  useEffect(() => {
    if (auth.currentUser) {
      // Check if they have a password provider
      const hasProvider = auth.currentUser.providerData.some(
        provider => provider.providerId === 'password'
      );
      
      setHasPasswordProvider(hasProvider);
      
      // Set the mode based on whether they have a password already
      setPasswordMode(hasProvider ? 'change' : 'set');
    }
  }, [auth.currentUser]);

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    
    // Basic criteria for password strength
    const lengthScore = Math.min(password.length * 5, 30); // Up to 30 points for length
    const hasUppercase = /[A-Z]/.test(password) ? 20 : 0;
    const hasLowercase = /[a-z]/.test(password) ? 20 : 0;
    const hasNumber = /[0-9]/.test(password) ? 20 : 0;
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password) ? 20 : 0;
    
    // Calculate total score (max 100)
    const totalScore = Math.min(lengthScore + hasUppercase + hasLowercase + hasNumber + hasSpecialChar, 100);
    
    return totalScore;
  };

  // Update strength when form field changes
  const handleValuesChange = (changedValues) => {
    if (changedValues.newPassword !== undefined) {
      setPasswordStrength(calculatePasswordStrength(changedValues.newPassword));
    }
  };

  const handleToggleMode = (newMode) => {
    // Check if trying to use 'set' mode but already has password
    if (newMode === 'set' && hasPasswordProvider) {
      notifyWarning(
        'Password Already Set', 
        'It appears you already have a password for this account. Please use the "Change Password" option instead.'
      );
      setPasswordMode('change');
    } else {
      setPasswordMode(newMode);
    }
    
    form.resetFields();
    setPasswordStrength(0);
  };

  const handlePasswordAction = async (values) => {
    setIsLoading(true);

    // Double-check if trying to set password but already has one
    if (passwordMode === 'set' && hasPasswordProvider) {
      notifyWarning(
        'Password Already Set', 
        'It appears you already have a password for this account. Please use the "Change Password" option instead.'
      );
      setPasswordMode('change');
      setIsLoading(false);
      return;
    }

    // Validation checks
    if (passwordMode === 'change' && !values.currentPassword) {
      notifyError('Validation Error', 'Current password is required.');
      setIsLoading(false);
      return;
    }

    if (!values.newPassword || !values.confirmPassword) {
      notifyError('Validation Error', 'All password fields are required.');
      setIsLoading(false);
      return;
    }

    if (values.newPassword.length < 8) {
      notifyError('Validation Error', 'Password must be at least 8 characters long.');
      setIsLoading(false);
      return;
    }

    if (values.newPassword !== values.confirmPassword) {
      notifyError('Validation Error', 'New passwords do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // If setting a new password (user doesn't have one yet)
      if (passwordMode === 'set') {
        try {
          // Create credential for the password provider
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            values.newPassword
          );
          
          // Start the notification process
          await notifyPromise(
            linkWithCredential(auth.currentUser, credential), 
            {
              pending: 'Setting up your password...',
              success: 'Your password has been set. You can now use it to sign in.',
              error: (err) => {
                if (err.code === 'auth/provider-already-linked') {
                  // If this happens, update UI state to reflect reality
                  setHasPasswordProvider(true);
                  setPasswordMode('change');
                  return 'You already have a password set for this account. Please use the "Change Password" option instead.';
                } else if (err.code === 'auth/email-already-in-use') {
                  return 'This email is already associated with another account.';
                }
                return err.message || 'An unknown error occurred';
              }
            }
          );
          
          // Only executed if successful
          form.resetFields();
          setPasswordStrength(0);
          setHasPasswordProvider(true);
          setPasswordMode('change');
        } catch (error) {
          console.error("Set password error:", error);
        }
      } 
      // If changing an existing password
      else {
        try {
          // Create credential for reauthentication
          const credential = EmailAuthProvider.credential(
            auth.currentUser.email,
            values.currentPassword
          );
          
          // Reauthenticate
          await reauthenticateWithCredential(auth.currentUser, credential);
          
          // Then update password with notification
          await notifyPromise(
            updatePassword(auth.currentUser, values.newPassword),
            {
              pending: 'Updating your password...',
              success: 'Your password has been successfully updated.',
              error: (err) => {
                if (err.code === 'auth/requires-recent-login') {
                  return 'For security reasons, you need to log out and log back in before changing your password.';
                }
                return err.message || 'An unknown error occurred';
              }
            }
          );
          
          // Only executed if successful
          form.resetFields();
          setPasswordStrength(0);
        } catch (error) {
          // Handle reauthentication errors separately
          if (error.code === 'auth/wrong-password') {
            notifyError('Authentication Error', 'The current password you entered is incorrect.');
          } else {
            notifyError('Error', error.message || 'An unknown error occurred');
          }
        }
      }
    } catch (error) {
      console.error("Password operation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 40) return 'exception';
    if (passwordStrength < 70) return 'warning';
    return 'success';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 40) return 'Weak';
    if (passwordStrength < 70) return 'Medium';
    return 'Strong';
  };

  // Show loading state while determining password mode
  if (passwordMode === null) {
    return (
      <div className="p-6 border border-gray-300 rounded-lg shadow bg-white w-full flex justify-center items-center">
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading account settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-300 rounded-lg shadow bg-white w-full">
      {/* Password mode title */}
      <h2 className="text-xl font-semibold mb-4">
        {passwordMode === 'set' ? 'Set a New Password' : 'Change Your Password'}
      </h2>
      
      {/* Mode toggle link - only show the "Set Password" option if they don't have a password provider */}
      <div className="mb-6">
        {passwordMode === 'change' && !hasPasswordProvider && (
          <p className="text-sm text-gray-600">
            Haven't set a password yet?{' '}
            <Button 
              type="link"
              onClick={() => handleToggleMode('set')}
              className="p-0 text-blue-600 hover:text-blue-800"
            >
              Set one now
            </Button>
          </p>
        )}
        {passwordMode === 'set' && (
          <p className="text-sm text-gray-600">
            Already have a password?{' '}
            <Button 
              type="link"
              onClick={() => handleToggleMode('change')}
              className="p-0 text-blue-600 hover:text-blue-800"
            >
              Change it here
            </Button>
          </p>
        )}
      </div>

      {passwordMode === 'set' && !hasPasswordProvider && (
        <Alert
          message="Have you set a password?"
          description="It looks like you've been using email link sign-in and may not have set a password. Set a password here to enable traditional email and password login."
          type="info"
          showIcon
          className="mb-4"
        />
      )}

      {passwordMode === 'set' && hasPasswordProvider && (
        <Alert
          message="Password Already Set"
          description="It looks like you may already have a password set for this account. Please use the 'Change Password' option instead or reset it from the sign-in page."
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handlePasswordAction}
        onValuesChange={handleValuesChange}
      >
        {/* Only show current password field if changing password */}
        {passwordMode === 'change' && (
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[{ required: true, message: 'Please input your current password!' }]}
          >
            <Input.Password 
              placeholder="Enter your current password" 
              className="border p-2 w-full rounded-md"
            />
          </Form.Item>
        )}

        <Form.Item
          label="New Password"
          name="newPassword"
          rules={[
            { required: true, message: 'Please input your new password!' },
            { min: 8, message: 'Password must be at least 8 characters long!' }
          ]}
        >
          <Input.Password 
            placeholder="Enter your new password" 
            className="border p-2 w-full rounded-md"
          />
        </Form.Item>
        
        {passwordStrength > 0 && (
          <div className="mb-4">
            <Progress
              percent={passwordStrength}
              status={getPasswordStrengthColor()}
              showInfo={false}
            />
            <div className="flex justify-between text-xs mt-1">
              <span>{getPasswordStrengthText()}</span>
              {passwordStrength < 70 && (
                <span className="text-gray-500">
                  Try adding uppercase letters, numbers, and special characters
                </span>
              )}
            </div>
          </div>
        )}

        <Form.Item
          label="Confirm New Password"
          name="confirmPassword"
          dependencies={['newPassword']}
          rules={[
            { required: true, message: 'Please confirm your new password!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two passwords do not match!'));
              },
            }),
          ]}
        >
          <Input.Password 
            placeholder="Confirm your new password" 
            className="border p-2 w-full rounded-md"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            disabled={passwordMode === 'set' && hasPasswordProvider}
            className={`p-2 w-full rounded-md text-white ${
              isLoading || (passwordMode === 'set' && hasPasswordProvider)
                ? 'bg-gray-300 cursor-not-allowed' 
                : 'bg-gray-800 hover:bg-gray-900'
            }`}
          >
            {isLoading 
              ? 'Processing...' 
              : (passwordMode === 'set' ? 'Set Password' : 'Update Password')
            }
          </Button>
          {passwordMode === 'set' && hasPasswordProvider && (
            <p className="text-sm text-red-500 mt-2">
              You already have a password. Please use the "Change Password" option.
            </p>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default PasswordManage;