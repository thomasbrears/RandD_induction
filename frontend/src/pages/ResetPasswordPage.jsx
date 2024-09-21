import React, { useState } from 'react';
import { auth } from '../firebaseConfig.js';
import { useNavigate, Link } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../style/Auth.css';
import Message from '../components/Message';

function ResetPasswordPage() {
    const [email, setEmail] = useState('');
    const [messageInfo, setMessageInfo] = useState({ message: '', type: '' });
    const navigate = useNavigate();

    // Function to handle password reset email sending
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await sendPasswordResetEmail(auth, email);
            setMessageInfo({ message: 'If an account exists with that email, we have sent a password reset email.', type: 'success' });
            // Delay navigation to login page for 3 seconds to display success message
            setTimeout(() => {
                navigate("/signin");
            }, 3000); // 3 seconds
        } catch (error) {
            setMessageInfo({ message: 'Error sending reset email. Please try again.', type: 'error' });
        }
    };

    return (
        <div className="center" style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100%', width: 'auto'}}>
            <div className="loginDetails">
                <h1>Reset Password</h1>
                <br />

                <p>Please enter your email and we will email you a link to reset your password</p>

                <div className="separator">
                        <span className="separator-text">Reset or set your password</span>
                </div>
                <form onSubmit={handleSubmit} className="loginForm">
                    <input
                        className="formInput"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />
                    <button type="submit" className="login-btn">Reset Password</button>
                </form>

                <p className="signup-text">
                    Remembered your password? <Link to="/signin" className="link">Sign in</Link>
                </p>

                {messageInfo.message && (
                    <Message key={Date.now()} message={messageInfo.message} type={messageInfo.type} />
                )}
            </div>
        </div>
    );
}

export default ResetPasswordPage;
