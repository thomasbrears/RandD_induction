import React from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { Link } from 'react-router-dom'; // Use Link for navigation

const NotFoundPage = () => {
    return (
        <>
            <Helmet><title>404: Page Not Found | AUT Event Inductions</title></Helmet>
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h1 className="text-7xl font-bold text-gray-800">Page not found</h1>
                <h2 className="text-4xl font-bold text-gray-800">Error 404</h2>
                <p className="text-gray-600 text-center mt-4 mb-8">
                    Sorry, the page you're looking for cannot be found. <br />
                    It might have been removed, had its name changed, or is temporarily unavailable.
                </p>
                <div className="flex space-x-4">
                    <Link 
                        to="/" 
                        className="text-white bg-gray-800 hover:bg-gray-900 px-4 py-2 rounded-md text-center"
                    >
                        Go Back Home
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