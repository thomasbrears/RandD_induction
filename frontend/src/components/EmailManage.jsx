import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, Skeleton } from 'antd';
import { 
  getAuth, 
  EmailAuthProvider,
  reauthenticateWithCredential,
  verifyBeforeUpdateEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; 
import { 
  notifySuccess, 
  notifyError, 
  notifyInfo, 
  notifyPromise 
} from '../utils/notificationService';

const EmailManage = () => {
  const auth = getAuth();
  const [form] = Form.useForm();
  const [currentEmail, setCurrentEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmailChange, setPendingEmailChange] = useState(null);
  const [pendingEmailExpiration, setPendingEmailExpiration] = useState(null);
  const [checkingVerification, setCheckingVerification] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    if (auth.currentUser) {
      setCurrentEmail(auth.currentUser.email);
      setInitialLoading(false);
    }
  }, [auth.currentUser]);

  // Check for pending email change in localStorage on mount
  useEffect(() => {
    const pendingChangeStr = localStorage.getItem('pendingEmailChange');
    if (pendingChangeStr) {
      try {
        const pendingChange = JSON.parse(pendingChangeStr);
        if (pendingChange.expiresAt > Date.now()) {
          setPendingEmailChange(pendingChange.email);
          setPendingEmailExpiration(new Date(pendingChange.expiresAt).toLocaleString());
        } else {
          // Clear expired pending change
          localStorage.removeItem('pendingEmailChange');
        }
      } catch (error) {
        console.error("Error parsing pending email change:", error);
        localStorage.removeItem('pendingEmailChange');
      }
    }
  }, []);

  // Check verification status when component mounts and when user returns to the page
  useEffect(() => {
    if (!pendingEmailChange) return;
    
    const checkVerification = async () => {
      try {
        setCheckingVerification(true);
        // Reload user to get latest verification status
        await auth.currentUser.reload();
        const freshUser = auth.currentUser;
        
        // If the email is verified and matches the pending email
        if (freshUser.emailVerified && freshUser.email === pendingEmailChange) {
          // Update in Firestore if needed
          try {
            const userDocRef = doc(db, 'users', freshUser.uid);
            await updateDoc(userDocRef, {
              email: freshUser.email
            });
          } catch (error) {
            console.error("Error updating Firestore:", error);
            // Continue even if Firestore update fails
          }
          
          // Clear pending email change
          localStorage.removeItem('pendingEmailChange');
          setPendingEmailChange(null);
          setPendingEmailExpiration(null);
          
          notifySuccess('Email Updated', 'Your email has been successfully updated and verified!');
        }
      } catch (error) {
        console.error("Error checking verification status:", error);
      } finally {
        setCheckingVerification(false);
      }
    };
    
    // Run check once when component mounts
    checkVerification();
    
    // Also check when component becomes visible again (user returns to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkVerification();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pendingEmailChange]);

  const checkVerificationStatus = async () => {
    try {
      setCheckingVerification(true);
      await auth.currentUser.reload();
      const freshUser = auth.currentUser;
      
      if (pendingEmailChange) {
        if (freshUser.emailVerified && freshUser.email === pendingEmailChange) {
          // Email has been changed and verified
          try {
            const userDocRef = doc(db, 'users', freshUser.uid);
            await updateDoc(userDocRef, {
              email: freshUser.email
            });
          } catch (error) {
            console.error("Error updating Firestore:", error);
            // Continue even if Firestore update fails
          }
          
          localStorage.removeItem('pendingEmailChange');
          setPendingEmailChange(null);
          setPendingEmailExpiration(null);
          
          notifySuccess('Email Updated', 'Your email has been successfully updated and verified!');
          
        } else if (freshUser.email !== pendingEmailChange) {
          notifyInfo('Verification Pending', 'You haven\'t verified your new email address yet. Please check your inbox and click the verification link.');
        } else if (freshUser.email === pendingEmailChange && !freshUser.emailVerified) {
          notifyInfo('Verification Pending', 'Your new email address has been set, but not verified yet. Please check your inbox and click the verification link.');
        }
      } else if (freshUser.emailVerified) {
        notifyInfo('Email Status', 'Your email is verified.');
      } else {
        notifyInfo('Email Status', 'Your email is not verified yet. Please check your inbox for the verification link.');
      }
    } catch (error) {
      console.error("Error checking verification status:", error);
      notifyError('Verification Check Failed', 'An error occurred while checking verification status.');
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleEmailChange = async (values) => {
    setIsLoading(true);

    if (!values.currentPassword) {
      notifyError('Validation Error', 'Password is required to change email.');
      setIsLoading(false);
      return;
    }

    if (!values.newEmail || !values.confirmEmail) {
      notifyError('Validation Error', 'All email fields are required.');
      setIsLoading(false);
      return;
    }

    if (values.newEmail !== values.confirmEmail) {
      notifyError('Validation Error', 'Emails do not match.');
      setIsLoading(false);
      return;
    }

    try {
      // Re-authenticate before changing email
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        values.currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      await verifyBeforeUpdateEmail(auth.currentUser, values.newEmail);

      // Store pending email change in localStorage with expiration (24 hours)
      const pendingChange = {
        email: values.newEmail,
        expiresAt: Date.now() + (24 * 60 * 60 * 1000)
      };
      localStorage.setItem('pendingEmailChange', JSON.stringify(pendingChange));
      setPendingEmailChange(values.newEmail);
      setPendingEmailExpiration(new Date(pendingChange.expiresAt).toLocaleString());

      // Reset form fields
      form.resetFields();

      notifySuccess(
        'Verification Email Sent', 
        'Please check your inbox to verify your new email address. After clicking the verification link, return to this page and click "Check Verification Status" to complete the process.'
      );
      
      // Note about signing in again
      setTimeout(() => {
        notifyInfo(
          'Important Note', 
          'After verifying your new email, your current session will expire and you will need to sign in again using your new email address.'
        );
      }, 1500); // Short delay so notifications don't overlap
    } catch (error) {
      console.error('Email update error:', error);
      
      if (error.code === 'auth/wrong-password') {
        notifyError('Authentication Error', 'The current password you entered is incorrect.');
      } else if (error.code === 'auth/requires-recent-login') {
        notifyError('Authentication Error', 'For security reasons, you need to log out and log back in before changing your email.');
      } else if (error.code === 'auth/email-already-in-use') {
        notifyError('Email Error', 'This email is already associated with another account.');
      } else {
        notifyError('Error', error.message || 'An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    notifyPromise(
      sendEmailVerification(auth.currentUser),
      {
        pending: 'Sending verification email...',
        success: 'Verification email sent! Please check your inbox.',
        error: (err) => `Failed to send verification email: ${err.message || 'Unknown error'}`
      }
    );
  };

  // Show skeleton loading state
  if (initialLoading) {
    return (
      <div className="p-6 border border-gray-300 rounded-lg shadow bg-white w-full">
        <Skeleton active paragraph={{ rows: 6 }} title={{ width: '40%' }} />
      </div>
    );
  }

  return (
    <div className="p-6 border border-gray-300 rounded-lg shadow bg-white w-full">
      <h2 className="text-xl font-semibold mb-4">Change Email</h2>
      <p className="text-sm text-gray-600 mb-4">Current Email: <b>{currentEmail}</b>
        {auth.currentUser?.emailVerified ? (
          <span className="ml-2 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Verified</span>
        ) : (
          <Button 
            type="primary"
            size="small"
            onClick={handleSendVerificationEmail}
            loading={checkingVerification}
          >
            Verify Email
          </Button>
        )}
      </p>

      {/* Pending Email Change Alert */}
      {pendingEmailChange && (
        <div className="mb-6">
          <Alert
            message="Email Change Pending"
            description={
              <>
                <p>You have requested to change your email to: <b>{pendingEmailChange}</b></p>
                <p>Please check your inbox and verify this email within the next 24 hours, before <b>{pendingEmailExpiration}.</b></p>
                <p className="mt-2 mb-4 text-sm">After clicking the verification link in your email, return here and click the button below to complete the process:</p>
                <Button 
                  type="primary"
                  onClick={checkVerificationStatus}
                  loading={checkingVerification}
                >
                  {checkingVerification ? 'Checking...' : 'Check Verification Status'}
                </Button>
                <p className="mt-4 text-sm text-yellow-600">
                  <b>Note:</b> After verifying your new email, your current session will expire and you will need to sign in again using your new email address.
                </p>
              </>
            }
            type="info"
            showIcon
          />
        </div>
      )}

      <Form 
        form={form} 
        layout="vertical" 
        onFinish={handleEmailChange}
      >
        <Form.Item
          label="Current Password"
          name="currentPassword"
          rules={[{ required: true, message: 'Please input your current password to authenticate the request!' }]}
        >
          <Input.Password 
            placeholder="Enter your current password to authenticate the request" 
            className="border p-2 w-full rounded-md"
          />
        </Form.Item>

        <Form.Item
          label="New Email"
          name="newEmail"
          rules={[
            { required: true, message: 'Please input your new email!' },
            { type: 'email', message: 'Please enter a valid email address!' }
          ]}
        >
          <Input 
            placeholder="Enter your new email" 
            className="border p-2 w-full rounded-md"
          />
        </Form.Item>

        <Form.Item
          label="Confirm New Email"
          name="confirmEmail"
          dependencies={['newEmail']}
          rules={[
            { required: true, message: 'Please confirm your new email!' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newEmail') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('The two emails do not match!'));
              },
            }),
          ]}
        >
          <Input 
            placeholder="Confirm your new email" 
            className="border p-2 w-full rounded-md"
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={isLoading}
            disabled={isLoading || !auth.currentUser?.emailVerified}
          >
            {isLoading ? 'Processing...' : 'Update Email'}
          </Button>
          
          {!auth.currentUser?.emailVerified && (
            <p className="text-sm text-yellow-600 mt-2">
              You must verify your current email before you can change to a new one.
            </p>
          )}
        </Form.Item>
      </Form>
    </div>
  );
};

export default EmailManage;