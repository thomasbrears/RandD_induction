import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamically set page head for titles, SEO, etc.
import { Link, useLocation } from 'react-router-dom'; // Use Link and useLocation for navigation and accessing the current URL

const NotFoundPage = () => {
    const location = useLocation(); // Get the current location

    // Check if the URL contains "/induction/take/"
    const isInductionTake = location.pathname.startsWith('/induction/take/');

    return (
        <>
            <Helmet><title>Error 404: Page Not Found | AUT Event Inductions</title></Helmet>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h1 className="text-7xl font-bold text-gray-800">
                    {isInductionTake ? (
                        // Custom message for "/induction/take/"
                        "Induction Not Found"
                    ) : (
                        // Generic message for all other 404 errors
                        "Page Not Found"
                    )}
                </h1>
                <h2 className="text-4xl font-bold text-gray-800">Error 404</h2>
                <p className="text-gray-600 text-center mt-4 mb-8">
                    {isInductionTake ? (
                        // Custom message for "/induction/take/"
                        "Sorry, the induction you're trying to take cannot be found. It might have been removed or is unavailable. PLEASE CONTACT US TO CONFIRM YOUR INDUCTION STATUS."
                    ) : (
                        // Generic message for all other 404 errors
                        "Sorry, the page you're looking for cannot be found. It might have been removed, had its name changed, or is temporarily unavailable."
                    )}
                </p>
                <div className="flex space-x-4">

                    <button
                        onClick={() => window.history.back()} // Go back to the previous page
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md text-center"
                    >
                        Go Back
                    </button>

                    <Link 
                        to="/" 
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md text-center"
                    >
                        Home Page
                    </Link>
                    <Link 
                        to="/contact" 
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md text-center"
                    >
                        Contact Us
                    </Link>
                </div>
            </div>
        </>
    );
};

export default NotFoundPage;