import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import useAuth from '../hooks/useAuth';
import { getAssignedInductions } from '../api/InductionApi';
import { toast } from 'react-toastify'; // Toastify success/error/info messages

const HomePage = () => {
    const { user } = useAuth();
    const [inductionsCount, setInductionsCount] = useState(0); // indcution count
    const [overdueInductionsCount, setOverdueInductionsCount] = useState(0); // Overdue inductions count
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const isAuthenticated = !!user;
    const userRole = user?.role; 

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

    // Fetch inductions assigned to the user
    const fetchInductions = async () => {
        if (user) {
            setLoading(true);
            try {
                const response = await getAssignedInductions(user, user.uid);
                const assignedInductions = response.assignedInductions || [];
                const incompleteInductions = calculateInductionsToComplete(assignedInductions);
                const overdueInductions = calculateOverdueInductions(assignedInductions);

                // Set induction counts
                setInductionsCount(incompleteInductions);
                setOverdueInductionsCount(overdueInductions); 

                // Show a toast with a link if there are overdue inductions
                if (overdueInductions > 0) {
                    toast.warning(
                        <div>
                            <span>
                                You have {overdueInductions} overdue induction{overdueInductions > 1 ? 's' : ''}. Please complete {overdueInductionsCount > 1 ? 'them' : 'it'} as soon as possible.
                                <br />
                                <Link
                                    to="/inductions/my-inductions"
                                    className="text-blue-500"
                                    onClick={() => toast.dismiss()}
                                >
                                    View inductions
                                </Link>{' '}
                                
                            </span>
                        </div>,
                        {
                            position: 'bottom-right',
                            autoClose: 120000,
                            hideProgressBar: true,
                            closeOnClick: true,
                            draggable: true,
                            progress: undefined,
                        }
                    );
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
            <div className="bg-cover bg-center h-[500px] flex justify-center items-center text-center text-white px-4 mb-12" style={{ backgroundImage: `url(/images/WG_OUTSIDE_AUT.webp)` }}>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold">Welcome to the AUT Events<br />Induction Portal!</h1>
            </div>

            {/* Let's Get Started Section */}
            <div className="bg-white py-8 mb-8">
                {!isAuthenticated ? (
                    <>
                        {/* Not loged in content */}
                        <h3 className="text-3xl text-center font-semibold mb-4">Let's get started</h3>
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
                                <h2 className="text-3xl text-center font-semibold mb-4">Hi {user.displayName ? user.displayName.split(" ")[0] : ""}, Let's get started</h2>
                                <p className="text-xl text-center mb-6">How should we get started today?</p>

                                {/* Show overdue inductions message if applicable */}
                                {overdueInductionsCount > 0 && (
                                    <p className="text-red-500 text-center mb-6">
                                        <Link to="/inductions/my-inductions" >You have {overdueInductionsCount} overdue induction{overdueInductionsCount > 1 ? 's' : ''}. Please complete {overdueInductionsCount > 1 ? 'them' : 'it'} as soon as possible.</Link>  {/* Message with cases for 1 or muiltiple overdue inductions and a link to the inductions page */}
                                    </p>
                                )}

                                <div className="flex justify-center gap-6">
                                    <Link to="/management/dashboard" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">Management Dashboard</Link>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Standard user content */}
                                <h2 className="text-3xl text-center font-semibold mb-4">Hi {user.displayName ? user.displayName.split(" ")[0] : ""}, Let's get started</h2>
                                <p className="text-xl text-center mb-2">
                                    {loading ? "Loading your inductions..." : 
                                    (error ? `Error: ${error}` : `You currently have ${inductionsCount > 0 ? inductionsCount : "no"} inductions to complete...`)}
                                </p>

                                {/* Show overdue inductions message if applicable */}
                                {overdueInductionsCount > 0 && (
                                    <p className="text-red-500 text-center mb-6">
                                        You have {overdueInductionsCount} overdue induction{overdueInductionsCount > 1 ? 's' : ''}. Please complete {overdueInductionsCount > 1 ? 'them' : 'it'} as soon as possible. {/* Message with cases for 1 or muiltiple overdue inductions */}
                                    </p>
                                )}
                                <div className="flex justify-center gap-6">
                                    <Link to="/inductions/my-inductions" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">View my Inductions</Link>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>

            {/* About Section */}
            <div className="relative bg-cover bg-top text-white py-16 mb-16" style={{ backgroundImage: `url(/images/AUTEventsStaff.jpg)` }}>
                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black opacity-70"></div> {/* Dark overlay on image */}
                <h2 className="text-2xl text-center font-semibold mb-4 relative z-10">About Us</h2>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <p className="text-lg mb-4">We cater anywhere for anyone. Is it your place or ours? 
                    <br /> Offering end-to-end management service from venue selection, catering and audio-visual solutions to your event and conference needs, our team of experts will work with you to design your event from inception to completion, customising each element to suit all budgets.
                    <br /> Our menu, lovingly crafted by our Group Chef, offers a tantalising selection made from local produce and sustainable sources.
                    <br />Available at our award-winning spaces in Auckland CBD and at some of the most iconic venues in town, our dedicated events team will work with you to create an impressive experience be it a day workshop, cocktail party or your all-important gala dinner.
                    <br />Let us organise and manage your event so you can focus on your guests!</p>
                    <Link to="https://www.autevents.co.nz/" target="_blank" rel="noopener noreferrer" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">Visit the AUT Events Website</Link>
                </div>
            </div>

            {/* Feedback Section */}
            <div className="bg-white text-black py-16 mb-5">
                <h2 className="text-2xl text-center font-semibold mb-4">Contact us - We’d love to hear from you!</h2>
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-lg mb-4">If you have any questions, feedback or complaints, please don't hesitate to get in touch with us using the button below or by direct email to your manager.</p>
                    <Link to="/contact" className="text-white bg-gray-800 hover:bg-gray-900 px-6 py-3 rounded-md text-center w-auto mx-auto">Contact us</Link>
                </div>
            </div>
            
        </>
    );
};

export default HomePage;
