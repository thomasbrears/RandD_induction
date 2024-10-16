import React, { useEffect, useState } from 'react';

// Array of the background images
const backgrounds = [
    '/images/header-bg-1.jpg',
    '/images/header-bg-2.jpg',
    '/images/header-bg-3.jpg',
    '/images/header-bg-4.jpg',
    '/images/header-bg-5.jpg',
    '/images/header-bg-6.jpg',
    '/images/WG_OUTSIDE_AUT.jpg',
];

const PageHeader = ({ title, subtext }) => {
  const [backgroundImage, setBackgroundImage] = useState('');

  // Select a random background image on component mount
  useEffect(() => {
    const randomImage = backgrounds[Math.floor(Math.random() * backgrounds.length)];
    setBackgroundImage(randomImage);
  }, []);

  return (
    <div
      className="relative bg-cover bg-center py-16"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div> {/* Dark overlay for text readability */}
      <div className="relative z-10 text-center text-white"> {/* Text content */}
        <h1 className="text-4xl font-bold">{title}</h1> {/* Page title */}
        <p className="mt-4 text-lg">{subtext}</p> {/* Page subtext */}
      </div>
    </div>
  );
};

export default PageHeader;