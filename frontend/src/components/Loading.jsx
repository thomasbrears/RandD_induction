import React from 'react';
import '../style/Loading.css';

const Loading = ({ message }) => {  // Destructure message prop
  return (
    <div className="loading-container">
      <div className="spinner">
      </div>
      {message && <div className="loading-message">{message}</div>} {/* Display the message */}
    </div>
  );
};

export default Loading;
