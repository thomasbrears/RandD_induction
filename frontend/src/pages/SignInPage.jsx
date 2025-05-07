import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import {
    signInWithEmailAndPassword,
    sendSignInLinkToEmail,
} from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notification, Input, Button, Divider, Form, Typography } from 'antd';
import { MailOutlined, LockOutlined, CheckCircleOutlined } from '@ant-design/icons';
import AuthLayout from '../layouts/AuthLayout';

const { Text } = Typography;

function SignInPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    useEffect(() => {
        // Check if email was passed from reset password page
        if (location.state && location.state.email) {
            setEmail(location.state.email);
            form.setFieldsValue({ email: location.state.email });
        }
    }, [location, form]);

    // Function to get user role from Firebase custom claims
    const getUserRole = async (user) => {
        const tokenResult = await user.getIdTokenResult();
        return tokenResult.claims.role;  // Fetch the role from the claims
    };

    // Handle email/password sign-in
    const handleEmailPasswordSignIn = async (values) => {
        const { email, password } = values;
        if (!email || !password) {
            notification.error({
                message: 'Error',
                description: 'Please enter both email and password.',
            });
            return;
        }
        try {
            setLoading(true);
            setLoadingMessage(`Signing in as ${email}...`);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            localStorage.setItem('token', user.accessToken);
            localStorage.setItem('user', JSON.stringify(user));
           
            notification.success({
                message: 'Success',
                description: 'Successfully signed in! Welcome!',
                icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />
            });
            
            // Get user role from Firebase custom claims
            const userRole = await getUserRole(user);

            // Check if there is a previous URL stored
            const previousUrl = sessionStorage.getItem('previousUrl');

            if (previousUrl) {
                // If there's a previous URL, redirect to it
                navigate(previousUrl);
                sessionStorage.removeItem('previousUrl'); // Clear after redirect
            } else {
                // Redirect based on role if no previous URL
                if (userRole === 'admin' || userRole === 'manager') {
                    navigate('/management/dashboard'); // Redirect for admins and managers
                } else if (userRole === 'user') {
                    navigate('/inductions/my-inductions'); // Redirect for users
                } else {
                    navigate('/'); // Redirect home for unknown roles
                }
            }
        } catch (error) {
            console.error("Error during sign-in:", error);
            switch (error.code) {
                case 'auth/user-not-found':
                    notification.error({
                        message: 'Error',
                        description: 'No user found with this email.',
                    });
                    break;
                case 'auth/wrong-password':
                    notification.error({
                        message: 'Error',
                        description: 'Incorrect password.',
                    });
                    break;
                case 'auth/invalid-email':
                    notification.error({
                        message: 'Error',
                        description: 'Invalid email format. Please enter a valid email address.',
                    });
                    break;
                case 'auth/invalid-credential':
                    notification.error({
                        message: 'Error',
                        description: 'Invalid credentials. Please try again.',
                    });
                    break;
                case 'auth/user-disabled':
                    notification.error({
                        message: 'Error',
                        description: 'Your account is disabled. Please contact your supervisor or manager for assistance.',
                    });
                    break;
                default:
                    notification.error({
                        message: 'Error',
                        description: 'Login failed. Please try again.',
                    });
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle passwordless sign-in via email link
    const handlePasswordlessSignIn = async () => {
        // Get email from form
        const formEmail = form.getFieldValue('email');
        const emailToUse = formEmail || email;
        
        if (!emailToUse) {
            notification.error({
                message: 'Error',
                description: 'Please enter your email.',
            });
            return;
        }
        
        const actionCodeSettings = {
            url: window.location.origin + '/auth/complete-signin',
            handleCodeInApp: true,
        };
        
        try {
            setLoading(true);
            setLoadingMessage(`Sending sign-in link to ${emailToUse}...`);
            await sendSignInLinkToEmail(auth, emailToUse, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', emailToUse);
           
            notification.success({
                message: 'Success',
                description: 'Sign-in link sent! Please check your email and click the link included.',
            });
            
            // Navigate to complete-signin with a flag indicating we just sent an email
            // This prevents error messages while the user waits for the email
            navigate('/auth/complete-signin', { state: { emailJustSent: true } });
        } catch (error) {
            console.error("Error sending sign-in link:", error);
            switch (error.code) {
                case 'auth/invalid-email':
                    notification.error({
                        message: 'Error',
                        description: 'Invalid email format. Please enter a valid email.',
                    });
                    break;
                case 'auth/missing-email':
                    notification.error({
                        message: 'Error',
                        description: 'Please provide an email address.',
                    });
                    break;
                case 'auth/user-not-found':
                    notification.error({
                        message: 'Error',
                        description: 'No account found with this email. Please contact us.',
                    });
                    break;
                case 'auth/network-request-failed':
                    notification.error({
                        message: 'Error',
                        description: 'Network error. Please check your connection and try again.',
                    });
                    break;
                case 'auth/too-many-requests':
                    notification.error({
                        message: 'Error',
                        description: 'Too many requests. Please wait a moment and try again.',
                    });
                    break;
                case 'auth/user-disabled':
                    notification.error({
                        message: 'Error',
                        description: 'Your account is disabled. Please contact your supervisor or manager for assistance.',
                    });
                    break;
                default:
                    notification.error({
                        message: 'Error',
                        description: 'Error sending sign-in link. Please try again.',
                    });
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Sign-In | AUT Events Induction Portal</title>
            </Helmet>
            <AuthLayout
                heading="Sign-In"
                loading={loading}
                loadingMessage={loadingMessage}
            >
                <p className="block text-gray-600 text-sm mb-6">
                    Only approved staff can access the AUT Event induction platform. If you do not have an account and you should, 
                    please <Link to="/contact" className="text-blue-600 hover:text-blue-800 transition-colors duration-200">contact us</Link>.
                </p>

                <Form
                    form={form}
                    name="signin"
                    onFinish={handleEmailPasswordSignIn}
                    layout="vertical"
                    className="space-y-4"
                    initialValues={{ email }}
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
                    <Form.Item
                        name="password"
                        label={<span className="text-gray-700">Password</span>}
                        rules={[{ required: true, message: 'Please enter your password!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="site-form-item-icon text-gray-400" />}
                            placeholder="Enter your password"
                            className="px-4 py-2 h-11 rounded-lg"
                        />
                    </Form.Item>
                    {/* Forgot password link */}
                    <div className="flex justify-end">
                        <Link
                            to="/auth/reset-password"
                            state={{ email: email }}
                            className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                        >
                            Sign In with Password
                        </Button>
                    </Form.Item>
                    
                    <Divider className="border-gray-300">
                        <span className="text-sm text-gray-500">or</span>
                    </Divider>
                    
                    <Form.Item>
                        <Button
                            onClick={handlePasswordlessSignIn}
                            className="w-full flex items-center justify-center px-4 py-3 h-11 bg-white text-gray-700 font-medium text-sm rounded-lg border border-gray-300 transition-colors duration-300 hover:bg-gray-100"
                            icon={<MailOutlined />}
                        >
                            Send Sign-in Link to Email
                        </Button>
                    </Form.Item>
                </Form>
                
                <p className="mt-8 text-sm text-center block text-gray-500">
                    If you have not set a password yet, please use the email sign-in link option above or <Link to="/auth/reset-password" state={{ email: email }} className="text-blue-600 hover:text-blue-800 transition-colors duration-200">set one here</Link>.
                </p>
            </AuthLayout>
        </>
    );
}

export default SignInPage;