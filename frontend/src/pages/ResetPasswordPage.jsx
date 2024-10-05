import React, { useState } from 'react';
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
            // Delay navigation to login page for 4 seconds to display success message
            setTimeout(() => {
                navigate("/signin");
            }, 4000); // 4 seconds
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
        <div className="center" style={{ backgroundImage: 'url(/images/WG_OUTSIDE_AUT.webp)', backgroundSize: 'cover', backgroundPosition: 'center', height: '100%', width: 'auto'}}>
            {loading && <Loading message={loadingMessage} />} {/* Loading animation */}
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

                <p className="signup-text"> Remembered your password? <Link to="/signin" className="link">Sign in</Link> </p>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
