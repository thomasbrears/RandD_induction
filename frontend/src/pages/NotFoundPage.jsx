import React from 'react';
import Button from '../components/Button';
import '../style/NotFoundPage.css';

const NotFoundPage = () => {
    return (
        <div className="not-found-container">
            <h1>404</h1>
            <p>Sorry, the page you're looking for cannot be found. <br />It might have been removed, had its name changed, or is temporarily unavailable.</p>
            <Button to="/">Go Back Home</Button>
            <Button to="/contact">Contact us</Button>

        </div>
    );
};

export default NotFoundPage;
