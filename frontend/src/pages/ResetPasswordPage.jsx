import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { auth } from '../firebaseConfig.js';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify'; // Toastify success/error/info messages
import Loading from '../components/Loading'; // Loading animation
import '../style/Auth.css';

function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();

    // Function to handle password reset email sending
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setLoadingMessage(`Sending password reset email to ${email}...`);	

            await sendPasswordResetEmail(auth, email);
            toast.success('If an account exists with that email, we have sent a password reset email.', { position: 'top-center', autoClose: 7000 });
            // Delay navigation to login page for 2 seconds to display success message
            setTimeout(() => {
                navigate("/signin");
            }, 2000); // 2 seconds
        } catch (error) {
           // Handle Firebase Auth specific error messages
            switch (error.code) {
                case 'auth/invalid-email':
                    toast.error('Invalid email format. Please check and try again.');
                    break;
                case 'auth/network-request-failed':
                    toast.error('Network error. Please check your connection and try again.');
                    break;
                default:
                    toast.error('Error sending reset email. Please try again.');
                    break;
            }
            console.error("Error sending reset email:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet><title>Reset Password | AUT Events Induction Portal</title></Helmet>
            <div 
                className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" 
                style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)' }} // Background image
            >
                {loading && <Loading message={loadingMessage} />}
                <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-lg">
                    <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Reset Password</h1>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                        Please enter your email, and we will send you a link to reset your password.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                            <input
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="Enter your email"
                            />
                        </div>

                        <button type="submit" className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                            Reset Password
                        </button>
                    </form>

                    <div className="text-center mt-4">
                        <p className="text-sm text-gray-600">
                            Remembered your password?{' '}
                            <Link to="/signin" className="font-bold text-black hover:underline">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ResetPasswordPage;
