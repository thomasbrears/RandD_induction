import React, { useEffect, useState } from 'react';
import { useContextImage } from './WebsiteImageProvider';

// Array of the header images
const defaultHeaders = [
    '/images/new-header-bg-1.jpg',
    '/images/new-header-bg-2.jpg',
    '/images/new-header-bg-3.jpg',
    '/images/new-header-bg-4.jpg',
    '/images/new-header-bg-5.jpg',
    '/images/new-header-bg-6.jpg',
    '/images/new-header-bg-7.jpg',
    '/images/WG_OUTSIDE_AUT.jpg',
];

const PageHeader = ({ title, subtext }) => {
  const { allHeaderImageUrls } = useContextImage();
  const [backgroundImage, setBackgroundImage] = useState('');

  const headerImages = allHeaderImageUrls.length > 0 ? allHeaderImageUrls : defaultHeaders;

  // Select a random background image on component mount
  useEffect(() => {
    const randomImage = headerImages[Math.floor(Math.random() * headerImages.length)];
    setBackgroundImage(randomImage);
  }, [headerImages]);

  return (
    <div
      className="relative bg-cover bg-center py-16 px-4"
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      <div className="absolute inset-0 bg-black opacity-50"></div> {/* Dark overlay for text readability */}
      <div className="relative z-10 text-center text-white max-w-4xl mx-auto px-4"> {/* Text content */}
        <h1 className="text-4xl font-bold break-words">{title}</h1> {/* Page title */}
        <p className="mt-4 text-lg sm:text-base md:text-lg lg:text-xl break-words max-w-3xl mx-auto"> {/* Page subtext */}
          {subtext}
        </p> 
      </div>
    </div>
  );
};

export default PageHeader;