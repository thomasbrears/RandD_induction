import React, { useEffect, useState } from 'react';
import '../style/Auth.css';
import Message from '../components/Message';
import { getAuth, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

function CompleteSignInPage() {
    const [messageInfo, setMessageInfo] = useState({ message: '', type: '' });
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(true);
    const [emailPrompt, setEmailPrompt] = useState(false);
    const navigate = useNavigate();
    const auth = getAuth();

    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
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
    }, [auth]);

    // Function to handle sign-in with email link
    const handleSignIn = (email) => {
        setLoading(true);
        signInWithEmailLink(auth, email, window.location.href)
            .then((result) => {
                window.localStorage.removeItem('emailForSignIn');
                localStorage.setItem('token', result.user.accessToken);
                localStorage.setItem('user', JSON.stringify(result.user));
                setMessageInfo({ message: 'Successfully signed in!', type: 'success' });
                setLoading(false);
                navigate('/');
            })
            .catch((error) => {
                console.error('Error during sign-in: ', error);
                setMessageInfo({ message: `Error signing in: ${error.message}`, type: 'error' });
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
            <div className="loginDetails">
                <h1>Complete your Sign-In</h1>

                {loading ? (
                    <p>Loading...</p>
                ) : (
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
                                    <button type="submit" className="login-btn">
                                        Complete Sign-in
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <>
                                {messageInfo.message && (
                                    <Message key={Date.now()} message={messageInfo.message} type={messageInfo.type} />
                                )}
                                <button className="login-btn" onClick={() => navigate('/')}>
                                    Go to Home
                                </button>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default CompleteSignInPage;
