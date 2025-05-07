import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { isSignInWithEmailLink, signInWithEmailLink, fetchSignInMethodsForEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { useNavigate, useLocation } from 'react-router-dom';
import { notification, Input, Button, Form, Typography } from 'antd';
import { MailOutlined, HomeOutlined, CheckCircleOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AuthLayout from '../layouts/AuthLayout';

const { Text } = Typography;

function CompleteSignInPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [emailPrompt, setEmailPrompt] = useState(false);
    const [hasNotified, setHasNotified] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    // Store if we need to redirect to set password page after sign-in
    const [shouldSetupPassword, setShouldSetupPassword] = useState(false);

    // Function to get user role from Firebase custom claims
    const getUserRole = async (user) => {
        const tokenResult = await user.getIdTokenResult();
        return tokenResult.claims.role;  // Fetch the role from the claims
    };

    // Function to check if user has password set up
    const checkPasswordMethod = async (userEmail) => {
        try {
            const methods = await fetchSignInMethodsForEmail(auth, userEmail);
            return methods.includes('password');
        } catch (error) {
            console.error("Error checking sign-in methods:", error);
            return true; // Default to assuming they have a password to be safe
        }
    };

    useEffect(() => {
        // Check if we're coming directly from sending an email link
        const hasEmailInStorage = window.localStorage.getItem('emailForSignIn');
        const comingFromSignInPage = location.state && location.state.emailJustSent;
        
        // Check if this is a sign-in link
        if (isSignInWithEmailLink(auth, window.location.href)) {
            // Get the email from localStorage if available
            const storedEmail = window.localStorage.getItem('emailForSignIn');
            if (storedEmail) {
                setEmail(storedEmail);
                form.setFieldsValue({ email: storedEmail });
                // If we have the email, complete the sign-in automatically
                handleSignIn(storedEmail);
            } else {
                setEmailPrompt(true);
                setLoading(false);
            }
        } else if (comingFromSignInPage || hasEmailInStorage) {
            // Just came from sending an email, so show the waiting for email screen
            setEmailPrompt(false);
        } else {
            // If there's no email in storage and not a valid link, go back to sign-in
            // without showing an error (likely just navigated here directly)
            navigate('/auth/signin');
        }
    }, [auth, form, navigate, location]);

    const handleSubmitEmail = (values) => {
        handleSignIn(values.email);
    };

    const handleSignIn = async (emailToUse) => {
        if (!emailToUse) {
            notification.error({
                message: 'Email Required',
                description: 'Please enter the email address you used to request the sign-in link.',
            });
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage(`Signing in as ${emailToUse}...`);
            
            // Check if user has password set up
            const hasPassword = await checkPasswordMethod(emailToUse);
            setShouldSetupPassword(!hasPassword);
            
            // Complete the sign-in process
            const result = await signInWithEmailLink(
                auth,
                emailToUse,
                window.location.href
            );
            
            // Clear the email from localStorage
            window.localStorage.removeItem('emailForSignIn');
            
            if (result.user) {
                // Save the user's info for the app
                localStorage.setItem('token', result.user.accessToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                
                if (!hasNotified) {
                    notification.success({
                        message: 'Success',
                        description: 'Successfully signed in! Welcome!',
                        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    });
                    setHasNotified(true);
                }
                
                // Get user role from Firebase custom claims and previous URL
                const userRole = await getUserRole(result.user);
                const previousUrl = sessionStorage.getItem('previousUrl');
                
                // If the user doesn't have a password and just signed in with an email link,
                // we'll redirect them to the set password page
                if (!hasPassword) {
                        navigate('/auth/set-password');
                } else {
                    // Otherwise, redirect based on previous URL or role
                        if (previousUrl) {
                            navigate(previousUrl);
                            sessionStorage.removeItem('previousUrl'); // Clear after redirect
                        } else if (userRole === 'admin' || userRole === 'manager') {
                            navigate('/management/dashboard');
                        } else if (userRole === 'user') {
                            navigate('/inductions/my-inductions');
                        } else {
                            navigate('/');
                        }
                }
            }
        } catch (error) {
            console.error("Error completing sign-in:", error);
            
            if (!hasNotified) {
                switch (error.code) {
                    case 'auth/invalid-email':
                        notification.error({
                            message: 'Invalid Email',
                            description: 'Invalid email format. Please check and try again.'
                        });
                        break;
                    case 'auth/expired-action-code':
                        notification.error({
                            message: 'Link Expired',
                            description: 'The sign-in link has expired. Please request a new one.'
                        });
                        break;
                    case 'auth/invalid-action-code':
                        notification.error({
                            message: 'Invalid Link',
                            description: 'The sign-in link is invalid. Please check your email for a valid link.'
                        });
                        break;
                    case 'auth/user-disabled':
                        notification.error({
                            message: 'Account Disabled',
                            description: 'This account has been disabled. Please contact support.'
                        });
                        break;
                    case 'auth/network-request-failed':
                        notification.error({
                            message: 'Network Error',
                            description: 'Network error. Please check your internet connection and try again.'
                        });
                        break;
                    default:
                        notification.error({
                            message: 'Sign-in Error',
                            description: 'Error signing in. Please try again.'
                        });
                        break;
                }
                setHasNotified(true);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Complete Your Sign-In | AUT Events Induction Portal</title>
            </Helmet>
            <AuthLayout
                heading="Complete Your Sign-In"
                loading={loading}
                loadingMessage={loadingMessage}
            >
                {!loading && (
                    <>
                        {emailPrompt ? (
                            <>
                                <p className="block text-gray-600 text-sm mb-6">
                                    Please confirm your email to complete the sign-in process. This is needed to verify your identity and log you in.
                                </p>
                                <Form
                                    form={form}
                                    name="completeSignin"
                                    onFinish={handleSubmitEmail}
                                    layout="vertical"
                                    className="space-y-4"
                                >
                                    <Form.Item
                                        name="email"
                                        label={<span className="text-gray-700">Email Address</span>}
                                        rules={[
                                            {
                                                required: true,
                                                message: 'Please enter your email!',
                                                type: 'email'
                                            }
                                        ]}
                                    >
                                        <Input
                                            prefix={<MailOutlined className="site-form-item-icon text-gray-400" />}
                                            placeholder="Enter your email"
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="px-4 py-2 h-11 rounded-lg"
                                        />
                                    </Form.Item>
                                    
                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                                        >
                                            Complete Sign-in
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </>
                        ) : (
                            <>
                                <p className="block text-gray-600 text-sm mb-6 text-center">
                                    We emailed you a link to sign in to your account. Please click the link on this device to complete the sign-in.
                                </p>
                                <Button
                                    type="primary"
                                    icon={<HomeOutlined />}
                                    onClick={() => navigate('/')}
                                    className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                                >
                                    Home
                                </Button>

                                <div className="mt-4 text-center">
                                    <Button 
                                        type="link" 
                                        icon={<ArrowLeftOutlined />}
                                        onClick={() => navigate('/auth/signin', { state: { email }})}
                                        className="text-blue-600 hover:text-blue-800"
                                    >
                                        Back to Sign In
                                    </Button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </AuthLayout>
        </>
    );
}

export default CompleteSignInPage;