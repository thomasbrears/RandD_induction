import React from 'react';
import { Link } from 'react-router-dom';
import '../style/Button.css';

const Button = ({ to, children }) => {
    return (
        <Link to={to} className="custom-button">
            {children}
        </Link>
    );
};

export default Button;
