import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
    updatePassword, 
    fetchSignInMethodsForEmail
} from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { useNavigate } from 'react-router-dom';
import { notification, Input, Button, Form, Typography, Alert, Progress } from 'antd';
import { LockOutlined, EyeInvisibleOutlined, EyeTwoTone, CheckCircleOutlined } from '@ant-design/icons';
import AuthLayout from '../layouts/AuthLayout';
import useAuth from '../hooks/useAuth'; // Import your useAuth hook

const { Text, Paragraph } = Typography;

function SetPasswordPage() {
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { user } = useAuth(); // Get the current user from your auth hook

    // State to track whether user has a password set already
    const [hasPassword, setHasPassword] = useState(null);
    // State for password strength
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [passwordValue, setPasswordValue] = useState('');
    // State to control when to show the confirm password field
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    useEffect(() => {
        // Check if the user already has a password set
        const checkPasswordMethod = async () => {
            // Use the current Firebase Auth user directly
            const currentUser = auth.currentUser;
            
            if (currentUser && currentUser.email) {
                try {
                    const methods = await fetchSignInMethodsForEmail(auth, currentUser.email);
                    setHasPassword(methods.includes('password'));
                } catch (error) {
                    console.error("Error checking sign-in methods:", error);
                    // Default to assuming they might have a password to be safe
                    setHasPassword(true);
                }
            } else if (!currentUser) {
                // No authenticated user, redirect to sign-in
                notification.error({
                    message: 'Authentication Required',
                    description: 'You need to be signed in to set a password.',
                });
                navigate('/auth/signin');
            }
        };
        
        checkPasswordMethod();
    }, [navigate]);

    // Calculate password strength
    const calculatePasswordStrength = (password) => {
        if (!password) return 0;
        
        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 20;
        if (password.length >= 12) strength += 10;
        
        // Complexity checks
        if (/[A-Z]/.test(password)) strength += 20; // Has uppercase
        if (/[a-z]/.test(password)) strength += 10; // Has lowercase
        if (/[0-9]/.test(password)) strength += 20; // Has number
        if (/[^A-Za-z0-9]/.test(password)) strength += 20; // Has special char
        
        return strength;
    };

    // Get strength level and color
    const getStrengthLevel = (strength) => {
        if (strength < 30) return { color: '#ff4d4f', level: 'Poor', status: 'exception' };
        if (strength < 60) return { color: '#faad14', level: 'Moderate', status: 'normal' };
        if (strength < 80) return { color: '#1890ff', level: 'Good', status: 'active' };
        return { color: '#52c41a', level: 'Strong', status: 'success' };
    };

    // Handle password input change
    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPasswordValue(value);
        setPasswordStrength(calculatePasswordStrength(value));
        
        // Show confirm password field when user starts typing a password
        if (value.length > 0 && !showConfirmPassword) {
            setShowConfirmPassword(true);
        }
    };

    const handleFormFinish = (values) => {
        // If confirm password is not showing yet, show it and prevent form submission
        if (!showConfirmPassword) {
            setShowConfirmPassword(true);
            return;
        }
        
        // Otherwise proceed with setting the password
        handleSetPassword(values);
    };

    const handleSetPassword = async (values) => {
        if (!user) {
            notification.error({
                message: 'Authentication Error',
                description: 'You must be signed in to set a password.',
            });
            navigate('/auth/signin');
            return;
        }
        
        const { password, confirmPassword } = values;
        
        if (password !== confirmPassword) {
            notification.error({
                message: 'Password Mismatch',
                description: 'The passwords you entered do not match.',
            });
            return;
        }
        
        try {
            setLoading(true);
            setLoadingMessage('Setting your password...');
            
            // Get the current Firebase Auth user directly
            const currentUser = auth.currentUser;
            
            if (!currentUser) {
                throw new Error('No authenticated user found. Please sign in again.');
            }
            
            // Update the password using the direct Firebase Auth user
            await updatePassword(currentUser, password);
            
            notification.success({
                message: 'Password Set',
                description: 'Your password has been set successfully. You can now use it to sign in.',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
                duration: 4.5,
            });
            
            // Redirect to a relevant page after setting password
            setTimeout(() => {
                navigate('/inductions/my-inductions');
            }, 1500);
            
        } catch (error) {
            console.error("Error setting password:", error);
            
            if (error.code === 'auth/requires-recent-login') {
                notification.warning({
                    message: 'Re-authentication Required',
                    description: 'For security reasons, please sign out and sign in again with an email link before setting your password.',
                    duration: 6,
                });
                
                // Store a flag in sessionStorage to redirect back after re-auth
                sessionStorage.setItem('redirectAfterAuth', '/auth/set-password');
                
                // Redirect to sign-in page
                setTimeout(() => {
                    navigate('/auth/signin');
                }, 2000);
            } else {
                notification.error({
                    message: 'Error Setting Password',
                    description: error.message || 'An error occurred while setting your password. Please try again.',
                });
            }
        } finally {
            setLoading(false);
        }
    };

    if (hasPassword === false) {
        const strengthInfo = getStrengthLevel(passwordStrength);
        
        return (
            <>
                <Helmet>
                    <title>Set Password | AUT Events Induction Portal</title>
                </Helmet>
                <AuthLayout
                    heading="Set a Password"
                    loading={loading}
                    loadingMessage={loadingMessage}
                >
                    <Alert
                        message="Create a Password for Your Account"
                        description="Setting a password allows you to sign in quicker, without your email. Alternatively, you can still use email links to sign in."
                        type="info"
                        showIcon
                        className="mb-6"
                    />
                    
                    <Form
                        form={form}
                        name="setPassword"
                        onFinish={handleFormFinish}
                        layout="vertical"
                        className="space-y-4"
                    >
                        <Form.Item
                            name="password"
                            label={<span className="text-gray-700">New Password</span>}
                            rules={[
                                { 
                                    required: true, 
                                    message: 'Please enter a password!' 
                                },
                                { 
                                    min: 8, 
                                    message: 'Password must be at least 8 characters long!' 
                                }
                            ]}
                            hasFeedback
                        >
                            <Input.Password
                                prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                                placeholder="Create a password"
                                className="px-4 py-2 h-11 rounded-lg"
                                iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                onChange={handlePasswordChange}
                                value={passwordValue}
                            />
                        </Form.Item>
                        
                        {/* Password Strength Indicator */}
                        {passwordValue && (
                            <div className="mb-4">
                                <div className="flex justify-between mb-1">
                                    <span className="text-xs">Password Strength: </span>
                                    <span className="text-xs" style={{ color: strengthInfo.color }}>{strengthInfo.level}</span>
                                </div>
                                <Progress 
                                    percent={passwordStrength} 
                                    showInfo={false} 
                                    status={strengthInfo.status}
                                    strokeColor={strengthInfo.color}
                                    size="small"
                                />
                            </div>
                        )}
                        
                        {/* Conditionally render confirm password field */}
                        {showConfirmPassword && (
                            <Form.Item
                                name="confirmPassword"
                                label={<span className="text-gray-700">Confirm Password</span>}
                                dependencies={['password']}
                                hasFeedback
                                rules={[
                                    {
                                        required: true,
                                        message: 'Please confirm your password!',
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(new Error('The two passwords do not match!'));
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                                    placeholder="Confirm your password"
                                    className="px-4 py-2 h-11 rounded-lg"
                                    iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
                                />
                            </Form.Item>
                        )}
                        
                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                            >
                                Set Password
                            </Button>
                        </Form.Item>
                        
                        <Paragraph className="text-center text-sm text-gray-500 mt-4">
                            You can skip this step and continue using email links to sign in.
                        </Paragraph>
                        
                        <div className="text-center">
                            <Button 
                                type="link" 
                                onClick={() => navigate('/inductions/my-inductions')}
                                className="text-blue-600 hover:text-blue-800"
                            >
                                Skip for now
                            </Button>
                        </div>
                    </Form>
                </AuthLayout>
            </>
        );
    } else if (hasPassword === true) {
        // User already has a password set
        return (
            <>
                <Helmet>
                    <title>Password Already Set | AUT Events Induction Portal</title>
                </Helmet>
                <AuthLayout
                    heading="Password Already Set"
                    loading={false}
                >
                    <Alert
                        message="You Already Have a Password"
                        description="Your account already has a password set. If you want to change it, you can use the reset password option."
                        type="success"
                        showIcon
                        className="mb-6"
                    />
                    
                    <div className="text-center space-y-4 mt-6">
                        <Button 
                            type="primary"
                            onClick={() => navigate('/inductions/my-inductions')}
                            className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                        >
                            Continue to Dashboard
                        </Button>
                        
                        <Button 
                            type="default"
                            onClick={() => navigate('/auth/reset-password')}
                            className="w-full"
                        >
                            Reset Password
                        </Button>
                    </div>
                </AuthLayout>
            </>
        );
    } else {
        // Loading state
        return (
            <AuthLayout
                heading="Checking Account Status"
                loading={true}
                loadingMessage="Verifying your account information..."
            />
        );
    }
}

export default SetPasswordPage;