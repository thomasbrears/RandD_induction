import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useAuth from '../hooks/useAuth';
import { getUserInductions } from '../api/UserInductionApi';
import { notification, Button } from 'antd'; 
import { WarningOutlined } from '@ant-design/icons';
import DynamicContent from '../components/DynamicContent.jsx';
import { useContextImage } from '../components/WebsiteImageProvider.jsx';

const HomePage = () => {
    const { user } = useAuth();
    const [inductionsCount, setInductionsCount] = useState(0); // induction count
    const [overdueInductionsCount, setOverdueInductionsCount] = useState(0); // Overdue inductions count
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isAuthenticated = !!user;
    const userRole = user?.role; 
    const { getBackgroundImage } = useContextImage();
    const homeBgUrl = getBackgroundImage('homeBg');
    const aboutBgUrl = getBackgroundImage('aboutBg');

    // Function to calculate inductions left to complete
    const calculateInductionsToComplete = (inductions) => {
        return inductions.filter(
            (induction) => induction.status !== 'complete' // Filter out completed inductions using status
        ).length;
    };

    // Function to calculate overdue inductions
    const calculateOverdueInductions = (inductions) => {
        return inductions.filter(
            (induction) => induction.status === 'overdue' // Filter for overdue status
        ).length;
    };

    // Function to check if notification should be shown
    const shouldShowNotification = () => {
        const lastNotifiedTime = localStorage.getItem('lastOverdueNotification');
        const currentTime = Date.now();
        
        // Show notification if never shown before or last shown more than 30 minutes ago
        if (!lastNotifiedTime || currentTime - parseInt(lastNotifiedTime) > 30 * 60 * 1000) {
            localStorage.setItem('lastOverdueNotification', currentTime.toString());
            return true;
        }
        return false;
    };

    // Fetch inductions assigned to the user
    const fetchInductions = async () => {
        if (user) {
            setLoading(true);
            try {
                // Use the new getUserInductions API instead of getAssignedInductions
                const assignedInductions = await getUserInductions(user, user.uid);
                
                const incompleteInductions = calculateInductionsToComplete(assignedInductions);
                const overdueInductions = calculateOverdueInductions(assignedInductions);

                // Set induction counts
                setInductionsCount(incompleteInductions);
                setOverdueInductionsCount(overdueInductions); 

                // Show a notification with a button if there are overdue inductions and notification hasn't been shown recently
                if (overdueInductions > 0 && shouldShowNotification()) {
                    const key = `overdue-${Date.now()}`;
                    const notificationTitle = overdueInductions === 1 ? 'Overdue Induction' : 'Overdue Inductions';
                    
                    notification.warning({
                        message: notificationTitle,
                        description: (
                            <div>
                                <p>
                                    You have {overdueInductions} overdue 
                                    {overdueInductions === 1 ? ' induction' : ' inductions'}. 
                                    Please complete 
                                    {overdueInductions === 1 ? ' it' : ' them'} as soon as possible.
                                </p>
                                <Button 
                                    type="primary" 
                                    size="small" 
                                    style={{ marginTop: '8px' }}
                                    onClick={() => {
                                        // Just navigate without closing the notification
                                        window.location.href = '/inductions/my-inductions';
                                    }}
                                >
                                    View Inductions
                                </Button>
                            </div>
                        ),
                        icon: <WarningOutlined style={{ color: '#faad14' }} />,
                        key,
                        placement: 'bottomRight',
                        duration: 0, // Don't auto-close
                        style: { minWidth: '320px', maxWidth: '450px' } // Wider notification
                    });
                }

            } catch (error) {
                setError('Failed to fetch inductions');
                console.error('Error fetching inductions:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    // Fetch inductions when the component mounts
    useEffect(() => {
        if (isAuthenticated) {
            fetchInductions();
        }
    }, [isAuthenticated, user]);

    return (
        <>
            <Helmet>
                <title>Home | AUT Events Induction Portal</title>
            </Helmet>

            {/* Background Image Section */}
            <div className="bg-cover bg-center h-[500px] flex justify-center items-center text-center text-white px-4 mb-12" style={{ backgroundImage: `url(${homeBgUrl})` }}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold">Welcome to the AUT Events<br />Induction Portal!</h1>
            </div>

            {/* Let's Get Started Section */}
            <div className="bg-white py-8 mb-8">
                {!isAuthenticated ? (
                    <>
                        {/* Not logged in content */}
                        <h3 className="text-3xl text-center font-semibold mb-4">Kia ora, let's get started</h3>
                        <p className="text-lg text-center mb-6">Please sign in to view and complete your inductions.</p>
                        <div className="flex justify-center gap-6">
                            <Link to="/auth/signin" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">Sign in</Link>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Check for admin or manager role */}
                        {userRole === 'admin' || userRole === 'manager' ? (
                            <>
                                {/* Manager or Admin content */}
                                <h2 className="text-3xl text-center font-semibold mb-4">Kia ora {user.displayName ? user.displayName.split(" ")[0] : ""}</h2>
                                <p className="text-xl text-center mb-6">How should we get started today?</p>

                                {/* Show overdue inductions message if applicable */}
                                {overdueInductionsCount > 0 && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto max-w-lg mb-8 rounded-md shadow-sm">
                                        <div className="flex items-center">
                                            <WarningOutlined className="text-red-500 text-xl mr-3 flex-shrink-0" />
                                            <p className="text-red-700 font-medium">
                                                <Link to="/inductions/my-inductions" className="text-red-700 hover:text-red-900">
                                                    You have {overdueInductionsCount} overdue 
                                                    {overdueInductionsCount === 1 ? ' induction' : ' inductions'}. 
                                                    Please complete 
                                                    {overdueInductionsCount === 1 ? ' it ' : ' them '} 
                                                    as soon as possible.
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-6">
                                    <Link to="/inductions/my-inductions" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center">View My Inductions</Link>
                                    <Link to="/management/dashboard" className="text-white bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-md text-center">Management Dashboard</Link>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Standard user content */}
                                <h2 className="text-3xl text-center font-semibold mb-4">Kia ora {user.displayName ? user.displayName.split(" ")[0] : ""}</h2>
                                <p className="text-xl text-center mb-6">
                                    {loading ? "Loading your inductions..." : 
                                    (error ? `Error: ${error}` : `You currently have ${inductionsCount > 0 ? inductionsCount : "no"} induction${inductionsCount === 1 ? '' : 's'} to complete...`)}
                                </p>

                                {/* Show overdue inductions message if applicable */}
                                {overdueInductionsCount > 0 && (
                                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-auto max-w-2xl mb-8 rounded-md shadow-sm">
                                        <div className="flex items-center">
                                            <WarningOutlined className="text-red-500 text-xl mr-3 flex-shrink-0" />
                                            <p className="text-red-700 font-medium">
                                                <Link to="/inductions/my-inductions" className="text-red-700 hover:text-red-900 underline">
                                                    You have {overdueInductionsCount} overdue 
                                                    {overdueInductionsCount === 1 ? ' induction' : ' inductions'}. 
                                                    Please complete 
                                                    {overdueInductionsCount === 1 ? ' it ' : ' them '} 
                                                    as soon as possible.
                                                </Link>
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-center gap-6">
                                    <Link to="/inductions/my-inductions" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">View my Inductions</Link>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* About Section - Dynamic */}
            <div className="relative bg-cover bg-top text-white py-16 mb-16" style={{ backgroundImage: `url(${aboutBgUrl})` }}>
                <div className="absolute inset-0 bg-black opacity-70"></div> {/* Dark overlay on image */}
                <h2 className="text-2xl text-center font-semibold mb-4 relative z-10">About Us</h2>
                <div className="max-w-3xl mx-auto text-center relative z-10 leading-relaxed space-y-4">
                    <DynamicContent 
                        section="about" 
                        fallbackText="We cater anywhere for anyone. Is it your place or ours?"
                    />
                    
                    <Link
                        to="https://www.autevents.co.nz/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md inline-block mt-4"
                    >Visit the AUT Events Website
                    </Link>
                </div>
            </div>

            {/* Feedback Section - Dynamic */}
            <div className="bg-white text-black py-16 mb-5">
                <h2 className="text-2xl text-center font-semibold mb-4">Contact us - We'd love to hear from you!</h2>
                <div className="max-w-4xl mx-auto text-center">
                    <DynamicContent 
                        section="contact" 
                        fallbackText="If you have any questions, feedback or complaints, please don't hesitate to get in touch with us using the button below or by direct email to your manager."
                    />
                    <Link to="/contact" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto mt-8 inline-block">Contact us</Link>
                </div>
            </div>
            
        </>
    );
};

export default HomePage;