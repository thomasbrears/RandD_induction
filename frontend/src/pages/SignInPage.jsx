import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
//import '../style/Auth.css';
import { signInWithEmailAndPassword, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Toastify success/error/info messages
import Loading from '../components/Loading'; // Loading animation

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPasswordField, setShowPasswordField] = useState(false); // To toggle password field visibility
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const navigate = useNavigate();

    // Function to get user role from Firebase custom claims
    const getUserRole = async (user) => {
        const tokenResult = await user.getIdTokenResult();
        return tokenResult.claims.role;  // Fetch the role from the claims
    };

    // Function for email and password sign-in
    const handleEmailPasswordSignIn = async (e) => {
        e.preventDefault();

        // Check if email and password are entered
        if (!email) {
            toast.error('Please enter your email.');
            return;
        }
        if (!password) {
            toast.error('Please enter your password.');
            return;
        }

        try {
            setLoading(true);
            setLoadingMessage(`Signing in as ${email}...`);

            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            localStorage.setItem('token', user.accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            toast.success('Signed in successfully!', { position: 'top-right', autoClose: 3000 });

            // Get user role from Firebase custom claims
            const userRole = await getUserRole(user);

            if (!userRole) {
                console.warn('User role is undefined or null.');  // Log warning if role is missing
            }

            // Check if there is a previous URL stored
            const previousUrl = sessionStorage.getItem('previousUrl');

            if (previousUrl) {
                // If there's a previous URL, redirect to it
                navigate(previousUrl); // Redirect to the previous URL
                sessionStorage.removeItem('previousUrl'); // Clear after redirect
            } else {
                // Redirect based on role if no previous URL
                if (userRole === 'admin' || userRole === 'manager') {
                    navigate('/management/dashboard'); // Redirect to for admins and managers
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
                    toast.error('No user found with this email.');
                    break;
                case 'auth/wrong-password':
                    toast.error('Incorrect password. Please try again.');
                    break;
                case 'auth/invalid-email':
                    toast.error('Invalid email format, Please enter a valid email address.');
                    break;
                case 'auth/invalid-credential':
                    toast.error('Invalid credentials. Please try again.');
                    break;
                default:
                    toast.error('Login failed. Please try again.');
                    break;
            }
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    // Function for passwordless sign-in using email link
    const handlePasswordlessSignIn = async (e) => {
        e.preventDefault();

        // Check if email is entered
        if (!email) {
            toast.error('Please enter your email.');
            return;
        }

        const actionCodeSettings = {
            url: 'http://localhost:3000/auth/complete-signin',
            handleCodeInApp: true,
        };

        try {
            setLoading(true);
            setLoadingMessage(`Sending sign-in link to ${email}...`);	

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            toast.success('Sign-in link sent! Please check your email and click the link included.', { autoClose: 7000 });
            navigate('/auth/complete-signin'); // Redirect to complete sign-in page
        } catch (error) {
            // Handle Firebase Auth specific error messages
            console.error("Error sending sign-in link:", error);

            switch (error.code) {
                case 'auth/invalid-email':
                    toast.error('Invalid email format. Please enter a valid email.');
                    break;
                case 'auth/missing-email':
                    toast.error('Please provide an email address.');
                    break;
                case 'auth/user-not-found':
                    toast.error('No account found with this email. Please sign up or use a different email.');
                    break;
                case 'auth/network-request-failed':
                    toast.error('Network error. Please check your connection and try again.');
                    break;
                case 'auth/too-many-requests':
                    toast.error('Too many requests. Please wait a moment and try again.');
                    break;
                default:
                    toast.error('Error sending sign-in link. Please try again.');
                    break;
            }
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <>
            <Helmet> <title>Sign-in | AUT Events Induction Portal</title> </Helmet>
            <div 
                className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" 
                style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)' }} // Background image
            >
                {loading && <Loading message={loadingMessage} />}
                <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-lg">
                    <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Sign in</h1>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                        Only approved staff can access the AUT Event induction platform. If you do not have an account and you should, or if you face any issues, please{' '}
                        <Link to="/contact" className="font-bold text-black hover:underline">contact us.</Link>
                    </p>
                    <p className="text-sm text-gray-600 mb-4 text-center">
                        If you have not set a password, please enter your email and click the "email me a sign-in link" option below or{' '}
                        <Link to="/auth/reset-password" className="font-bold text-black hover:underline">set your password here.</Link>
                    </p>
    
                    <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
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
    
                        {showPasswordField && (
                            <>
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                                    <input
                                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                    />
                                </div>
    
                                <div className="text-left">
                                    <Link to="/auth/reset-password" className="text-sm font-bold text-black hover:underline">Forgot password?</Link>
                                </div>
    
                                <button type="submit" className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                                    Sign in with Password
                                </button>
    
                                <div className="flex items-center justify-between mt-4">
                                    <hr className="flex-1 border-t border-gray-300" />
                                    <span className="mx-2 text-sm text-gray-500">or</span>
                                    <hr className="flex-1 border-t border-gray-300" />
                                </div>
    
                                <button type="button" onClick={handlePasswordlessSignIn} className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                                    Send me a Sign-in Link
                                </button>
                            </>
                        )}
    
                        {!showPasswordField && (
                            <>
                                <button type="button" onClick={handlePasswordlessSignIn} className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                                    Email me a Sign-in Link (Recommended)
                                </button>
    
                                <div className="flex items-center justify-between mt-4">
                                    <hr className="flex-1 border-t border-gray-300" />
                                    <span className="mx-2 text-sm text-gray-500">or</span>
                                    <hr className="flex-1 border-t border-gray-300" />
                                </div>
    
                                <button type="button" onClick={() => setShowPasswordField(true)} className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                                    Sign in with Password
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </>
    );       
}

export default LoginPage;