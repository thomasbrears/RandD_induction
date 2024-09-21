import React, { useState } from 'react';
import '../style/Auth.css';
import Message from '../components/Message';
import { getAuth, signInWithEmailAndPassword, sendSignInLinkToEmail } from 'firebase/auth';
import { auth } from '../firebaseConfig.js';
import { Link, useNavigate } from 'react-router-dom';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [messageInfo, setMessageInfo] = useState({ message: '', type: '' });
    const navigate = useNavigate();

    // Function for traditional email/password sign-in
    const handleEmailPasswordSignIn = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            localStorage.setItem('token', user.accessToken);
            localStorage.setItem('user', JSON.stringify(user));
            navigate("/inductions");
        } catch (error) {
            console.error("Error during sign-in:", error);
            switch (error.code) {
                case 'auth/user-not-found':
                    setMessageInfo({ message: 'No user found with this email.', type: 'error' });
                    break;
                case 'auth/wrong-password':
                    setMessageInfo({ message: 'Incorrect password. Please try again.', type: 'error' });
                    break;
                case 'auth/invalid-email':
                    setMessageInfo({ message: 'Invalid email format. Please enter a valid email address.', type: 'error' });
                    break;
                default:
                    setMessageInfo({ message: 'Login failed. Please try again.', type: 'error' });
                    break;
            }
        }
    };

    // Function for passwordless sign-in using email link
    const handlePasswordlessSignIn = async (e) => {
        e.preventDefault();
        const actionCodeSettings = {
            url: 'http://localhost:3000/complete-signin',
            handleCodeInApp: true,
        };

        try {
            await sendSignInLinkToEmail(auth, email, actionCodeSettings);
            window.localStorage.setItem('emailForSignIn', email);
            setMessageInfo({ message: 'Sign-in link sent! Check your email.', type: 'success' });
        } catch (error) {
            setMessageInfo({ message: `Error sending sign-in link: ${error.message}`, type: 'error' });
        }
    };

    return (
        <div className="center" style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100%', width: 'auto'}}>
            <div className='loginDetails'>
                <h1>Sign in</h1>
                <p className="signup-text">Only approved staff can access the AUT Event induction platform. If you do not have an account and you should or if you face any issues, please <Link to="/contact" className="link">contact us.</Link> </p>
                <p className="signup-text">If you have not set a password, please use the "email me a sign-in link" option below to sign-in or <Link to="/reset-password" className="link">set your password here.</Link></p>

                <form onSubmit={handleEmailPasswordSignIn} className="loginForm">
                    <div className="separator">
                        <span className="separator-text">Sign in with email</span>
                    </div>
                    <input
                        className="formInput"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />
                    <input
                        className="formInput"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                    />

                    <p className="forgot-password">
                        <Link to="/reset-password" className="link">Forgot password?</Link>
                    </p>

                    <button type="submit" className="login-btn">Sign in with password</button>
                    
                    <div className="separator">
                        <span className="separator-text">Or use a sign-in link (Recommended)</span>
                    </div>
                    <button type="button" className="login-btn" onClick={handlePasswordlessSignIn}>Email me a Sign-in Link (Recommended)</button> 
                
                </form>

                {messageInfo.message && (
                    <Message key={Date.now()} message={messageInfo.message} type={messageInfo.type} />
                )}
            </div>
        </div>
    );
}

export default LoginPage;
