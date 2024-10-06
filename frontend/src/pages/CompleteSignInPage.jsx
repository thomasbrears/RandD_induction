import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify'; // Toastify success/error/info messages
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import '../style/Auth.css';

function CompleteSignInPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [emailPrompt, setEmailPrompt] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        if (isSignInWithEmailLink(handleSignIn, window.location.href)) {
            // Check if the email is already in localStorage
            const storedEmail = window.localStorage.getItem('emailForSignIn');
            if (storedEmail) {
                // If email exists in local storage, proceed to sign-in
                handleSignIn(storedEmail);
            } else {
                // If email is not in local storage, ask the user for the email
                setEmailPrompt(true);
                setLoading(false);
            }
        }
    }, [handleSignIn]);

    // Function to handle sign-in with email link
    const handleSignIn = (email) => {
        setLoading(true);
        setLoadingMessage(`Signing in with ${email}...`); 
        signInWithEmailLink(auth, email, window.location.href)
            .then((result) => {
                window.localStorage.removeItem('emailForSignIn');
                localStorage.setItem('token', result.user.accessToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                toast.success('Successfully signed in! Welcome!');
                setLoading(false);
                navigate('/');
            })
            .catch((error) => {
                // Handle Firebase Auth specific error messages
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
                        toast.error('This account has been disabled. Please contact support for assistance.');
                        break;
                    case 'auth/network-request-failed':
                        toast.error('Network error. Please check your internet connection and try again.');
                        break;
                    default:
                        toast.error('Error signing in. Please try again.');
                        break;
                }
                setLoading(false);
            });
    };

    // Function to handle form submission for email input
    const handleSubmitEmail = (e) => {
        e.preventDefault();
        handleSignIn(email);
    };

    return (
        <div className="center" style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100%', width: 'auto'}}>
            {loading && <Loading message={loadingMessage} />} {/* Loading animation */}

            <div className="loginDetails">
                <h1>Complete your Sign-In</h1>

                {!loading && ( /* Ensure form is not shown while loading */
                    <>
                        {emailPrompt ? (
                            <div>
                                <p>
                                    Please confirm your email to complete the sign-in process. 
                                    This is needed to verify your identity log you in.
                                </p>
                                <form onSubmit={handleSubmitEmail} className="loginForm">
                                    <input
                                        className="formInput"
                                        type="email"
                                        placeholder="Enter your email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="login-btn"> Complete Sign-in </button>
                                </form>
                            </div>
                        ) : (
                            <>
                                <br />
                                <button className="login-btn" onClick={() => navigate('/')}> Home </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CompleteSignInPage;
