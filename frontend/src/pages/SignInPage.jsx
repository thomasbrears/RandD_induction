import React, { useState } from 'react';
import '../style/Auth.css';
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
                    navigate('/admin/dashboard'); // Redirect to for admins or managers
                } else if (userRole === 'user') {
                    navigate('/inductions'); // Redirect for users / staff
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
            url: 'http://localhost:3000/complete-signin',
            handleCodeInApp: true,
        };

        try {
            setLoading(true);
            setLoadingMessage(`Sending sign-in link to ${email}...`);	

            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            toast.success('Sign-in link sent! Please check your email and click the link included.', { autoClose: 7000 });
            navigate('/complete-signin'); // Redirect to complete sign-in page
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
        <div className="center" style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100%', width: 'auto'}}>
            {loading && <Loading message={loadingMessage} />} {/* Loading animation */}
            <div className='loginDetails'>
                <h1>Sign in</h1>
                <p className="signup-text">Only approved staff can access the AUT Event induction platform. If you do not have an account and you should or if you face any issues, please <Link to="/contact" className="link">contact us.</Link> </p>
                <p className="signup-text">If you have not set a password, please enter your email and click the "email me a sign-in link" option below or <Link to="/reset-password" className="link">set your password here.</Link></p>

                {/* Initial email input */}
                <form className="loginForm">
                    <label htmlFor="email" className="formLabel">Email Address</label>
                    <input
                        className="formInput"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />

                    {/* Show the password field only when user clicks to sign in with password */}
                    {showPasswordField && (
                        <>
                            <label htmlFor="password" className="formLabel">Password</label>
                            <input
                                className="formInput"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Enter your password"
                            />

                            {/* Forgot password link */}
                            <p className="forgot-password"> <Link to="/reset-password" className="link">Forgot password?</Link></p>

                            <br />
                            {/* Submit button for password sign-in */}
                            <button type="submit" className="login-btn" onClick={handleEmailPasswordSignIn}> Sign in with Password </button>

                            {/* Send the passwordless sign-in link */}
                            <div className="separator"> <span className="separator-text">Or use a sign-in link instead</span></div>
                            <button type="button" className="login-btn" onClick={handlePasswordlessSignIn}> Send me a Sign-in Link </button>
                        </>
                    )}

                    {/* Show options to choose sign-in method when password field is not displayed */}
                    {!showPasswordField && (
                        <>
                            {/* Sigin in with email link button */}
                            <button type="button" className="login-btn" onClick={handlePasswordlessSignIn}> Email me a Sign-in Link (Recommended) </button>

                            {/* Show password field on button click */}
                            <div className="separator"> <span className="separator-text">Or signin using a password</span></div>
                            <button type="button" className="login-btn" onClick={() => setShowPasswordField(true)}> Sign in with Password </button>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
}

export default LoginPage;