import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBackgroundImages, getHeaderImages } from '../api/ContentApi';

const BACKGROUND_KEYS = ['homeBg', 'aboutBg', 'authBg'];
const WebsiteImageContext = createContext();

export const WebsiteImageProvider = ({ children }) => {
  const [backgroundImages, setBackgroundImages] = useState({});
  const [headerImages, setHeaderImages] = useState([]);

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const bgData = await getBackgroundImages();
        const headerData = await getHeaderImages();

        if (bgData) {
          const filtered = {};
          for (const key of BACKGROUND_KEYS) {
            if (bgData[key]) filtered[key] = bgData[key];
          }
          setBackgroundImages(filtered);
        }

        if (Array.isArray(headerData.images)) {
          setHeaderImages(headerData.images);
        }

      } catch (err) {
        console.error('Failed to fetch images:', err);
      }
    };

    fetchImages();
  }, []);

  

  const getBackgroundImage = (key) => {
    return backgroundImages[key]?.url || null;
  };

  const allHeaderImageUrls = headerImages.length > 0 ? headerImages.map((img) => img.url) : [];

  return (
    <WebsiteImageContext.Provider value={{ getBackgroundImage, allHeaderImageUrls }}>
      {children}
    </WebsiteImageContext.Provider>
  );
};

export const useContextImage = () => useContext(WebsiteImageContext);