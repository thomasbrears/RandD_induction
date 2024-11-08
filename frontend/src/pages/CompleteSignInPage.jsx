import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // Toastify success/error/info messages
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import Loading from '../components/Loading';
import '../style/Auth.css';

function CompleteSignInPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [emailPrompt, setEmailPrompt] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    // State to track if a notification has already been shown to avoid duplicates
    const [hasNotified, setHasNotified] = useState(false);

    // Function to get user role from Firebase custom claims
    const getUserRole = async (user) => {
        const tokenResult = await user.getIdTokenResult();
        return tokenResult.claims.role;  // Fetch the role from the claims
    };

    // Function to handle sign-in with email link
    const handleSignIn = async (email) => {
        setLoading(true);
        setLoadingMessage(`Signing in with ${email}...`); 
        try {
            const result = await signInWithEmailLink(auth, email, window.location.href);
            const user = result.user;

            window.localStorage.removeItem('emailForSignIn');
            localStorage.setItem('token', result.user.accessToken);
            localStorage.setItem('user', JSON.stringify(result.user));

            if (!hasNotified) {
                toast.success('Successfully signed in! Welcome!');
                setHasNotified(true);
            }
            setLoading(false);

            // Get user role from Firebase custom claims and previous URL from session storage
            const userRole = await getUserRole(user);
            const previousUrl = sessionStorage.getItem('previousUrl');

            if (!userRole) {
                console.warn('User role is undefined or null.');  // Log warning if role is missing
            }

            // Redirect to the previous URL page, otherwise redirect based on role
            if (previousUrl) {
                navigate(previousUrl); // Redirect to the previous URL
                sessionStorage.removeItem('previousUrl'); // Clear after redirect
            } else {
                // Fallback based on role
                if (userRole === 'admin' || userRole === 'manager') {
                    navigate('/management/dashboard');
                } else {
                    navigate('/inductions/my-inductions');
                }
            }
        } catch (error) {
            // Handle Firebase Auth specific error messages
            if (!hasNotified) {
                switch (error.code) {
                    case 'auth/invalid-email':
                        toast.error('Invalid email. Please check and try again.');
                        break;
                    case 'auth/expired-action-code':
                        toast.error('The sign-in link has expired. Please request a new one.');
                        break;
                    case 'auth/invalid-action-code':
                        toast.error('The sign-in link is invalid. Please check your email for a valid link.');
                        break;
                    case 'auth/user-disabled':
                        toast.error('This account has been disabled. Please contact support.');
                        break;
                    case 'auth/network-request-failed':
                        toast.error('Network error. Please check your internet connection and try again.');
                        break;
                    default:
                        toast.error('Error signing in. Please try again.');
                        break;
                }
                setHasNotified(true);
            }
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            const storedEmail = window.localStorage.getItem('emailForSignIn');
            if (storedEmail) {
                handleSignIn(storedEmail);
            } else {
                setEmailPrompt(true);
                setLoading(false);
            }
        }
    }, [auth]);

    // Function to handle form submission for email input
    const handleSubmitEmail = (e) => {
        e.preventDefault();
        handleSignIn(email);
    };

    return (
        <>
            <Helmet>
                <title>Complete Your Sign-In | AUT Events Induction Portal</title>
            </Helmet>
            <div 
                className="min-h-screen flex items-center justify-center bg-cover bg-center px-4" 
                style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)' }} // Background image
            >
                {loading && <Loading message={loadingMessage} />}
                <div className="w-full max-w-sm p-8 bg-white shadow-lg rounded-lg">
                    <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">Complete your Sign-In</h1>
    
                    {!loading && (
                        <>
                            {emailPrompt ? (
                                <div>
                                    <p className="text-sm text-gray-600 mb-4 text-center">
                                        Please confirm your email to complete the sign-in process. This is needed to verify your identity and log you in.
                                    </p>
                                    <form onSubmit={handleSubmitEmail} className="space-y-4">
                                        <input
                                            className="block w-full px-3 py-2 border border-gray-300 rounded-sm shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                            type="email"
                                            placeholder="Enter your email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center">
                                            Complete Sign-in
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <>
                                    <p className="text-sm text-gray-600 text-center mb-4">
                                        We emailed you a link to sign in to your account. Please click the link on this device to complete the sign-in.
                                    </p>
                                    <button className="w-full bg-black text-white py-2 rounded-sm hover:bg-gray-900 text-center" onClick={() => navigate('/')}>
                                        Home
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>
        </>
    );    
}

export default CompleteSignInPage;
