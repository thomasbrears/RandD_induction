import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
//import getBackgroundImages from '../utils/getBackgroundImages'; // your DB fetcher

const BackgroundImageContext = createContext();

export const BackgroundImageProvider = ({ user, children }) => {
  const [images, setImages] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      //getBackgroundImages(user).then(setImages);
    }
  }, [user]);

  const getImageForRoute = (pathname) => {
    // Map routes to image names or indexes (customize this)
    const routeMap = {
      '/': 'new-header-bg-1.jpg',
      '/contact': 'new-header-bg-2.jpg',
      '/auth/signin': 'new-header-bg-3.jpg',
      '/management/dashboard': 'WG_OUTSIDE_AUT.webp',
    };

    const imageName = routeMap[pathname];
    const match = images.find(img => img.name === imageName);
    return match?.url || null;
  };

  const currentBackground = getImageForRoute(location.pathname);

  return (
    <BackgroundImageContext.Provider value={{ currentBackground }}>
      {children}
    </BackgroundImageContext.Provider>
  );
};

export const useBackgroundImage = () => useContext(BackgroundImageContext);