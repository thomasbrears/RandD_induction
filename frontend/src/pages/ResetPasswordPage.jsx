import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { notification, Input, Button, Form, Typography } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import AuthLayout from '../layouts/AuthLayout';

const { Text } = Typography;

function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    useEffect(() => {
        // Check if email was passed in the location state (from sign-in page)
        if (location.state && location.state.email) {
            setEmail(location.state.email);
            form.setFieldsValue({ email: location.state.email });
        }
    }, [location, form]);

    const handlePasswordReset = async (values) => {
        const { email } = values;
        if (!email) {
            notification.error({
                message: 'Error',
                description: 'Please enter your email.',
            });
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage(`Sending password reset email to ${email}...`);
            await sendPasswordResetEmail(auth, email);
            
            notification.success({
                message: 'Check Your Email',
                description: 'If an account exists with that email, you should receive a password reset link shortly.',
            });
            
            // Store the email for potential use back on the sign-in page
            setTimeout(() => {
                navigate('/auth/signin', { state: { email, fromReset: true }});
            }, 1000);
        } catch (error) {
            console.error("Error sending reset email:", error);
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
                    // For security reasons, we don't reveal if an email exists or not
                    notification.info({
                        message: 'Check Your Email',
                        description: 'If an account exists with that email, you should receive a password reset link shortly.',
                    });
                    setTimeout(() => {
                        navigate('/auth/signin', { state: { email, fromReset: true }});
                    }, 1000);
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
                        description: 'Too many requests. Please wait a moment before trying again.',
                    });
                    break;
                default:
                    notification.error({
                        message: 'Error',
                        description: 'Failed to send reset email. Please try again.',
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
                <title>Reset Password | AUT Events Induction Portal</title>
            </Helmet>
            <AuthLayout
                heading="Reset Password"
                loading={loading}
                loadingMessage={loadingMessage}
            >
                <p className="block text-gray-600 text-sm mb-6">
                    Enter your email address below and we'll send you a link to reset your password.
                </p>

                <Form
                    form={form}
                    name="resetPassword"
                    onFinish={handlePasswordReset}
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
                            value={email}
                        />
                    </Form.Item>
                    
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="w-full bg-blue-600 text-white font-semibold py-3 h-11 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-300 text-center"
                        >
                            Reset Password
                        </Button>
                    </Form.Item>
                    
                    <div className="mt-6 text-center">
                        <Button 
                            type="link" 
                            icon={<ArrowLeftOutlined />}
                            onClick={() => navigate('/auth/signin', { state: { email }})}
                            className="text-blue-600 hover:text-blue-800"
                        >
                            Back to Sign In
                        </Button>
                    </div>
                </Form>
            </AuthLayout>
        </>
    );
}

export default ResetPasswordPage;