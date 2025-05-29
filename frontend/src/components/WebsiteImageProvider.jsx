import React, { createContext, useContext, useEffect, useState } from 'react';
import { getBackgroundImages, getHeaderImages } from '../api/ContentApi';

const BACKGROUND_KEYS = ['homeBg', 'aboutBg', 'authBg'];
const WebsiteImageContext = createContext();

export const WebsiteImageProvider = ({ children }) => {
  const [backgroundImages, setBackgroundImages] = useState({});
  const [headerImages, setHeaderImages] = useState([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [criticalImagesPreloaded, setCriticalImagesPreloaded] = useState(false);

  // Function to preload an image
  const preloadImage = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
  };

  // Function to preload multiple images
  const preloadImages = async (urls) => {
    try {
      await Promise.all(urls.map(url => preloadImage(url)));
      return true;
    } catch (error) {
      console.warn('Some images failed to preload:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchImages = async () => {
      try {
        // Try to get cached data first
        const cachedBgData = localStorage.getItem('website_background_images');
        const cachedHeaderData = localStorage.getItem('website_header_images');
        const cacheTimestamp = localStorage.getItem('website_images_cache_time');
        
        // Check if cache is still valid (24 hours)
        const isCacheValid = cacheTimestamp && 
          (Date.now() - parseInt(cacheTimestamp)) < 24 * 60 * 60 * 1000;

        let bgData, headerData;

        if (isCacheValid && cachedBgData && cachedHeaderData) {
          // Use cached data
          bgData = JSON.parse(cachedBgData);
          headerData = JSON.parse(cachedHeaderData);
        } else {
          // Fetch fresh data
          [bgData, headerData] = await Promise.all([
            getBackgroundImages(),
            getHeaderImages()
          ]);

          // Cache the data
          localStorage.setItem('website_background_images', JSON.stringify(bgData));
          localStorage.setItem('website_header_images', JSON.stringify(headerData));
          localStorage.setItem('website_images_cache_time', Date.now().toString());
        }

        // Process background images
        if (bgData) {
          const filtered = {};
          for (const key of BACKGROUND_KEYS) {
            if (bgData[key]) filtered[key] = bgData[key];
          }
          setBackgroundImages(filtered);

          // Preload critical images (homeBg is most important)
          const criticalUrls = [];
          if (filtered.homeBg?.url) criticalUrls.push(filtered.homeBg.url);
          if (filtered.aboutBg?.url) criticalUrls.push(filtered.aboutBg.url);

          if (criticalUrls.length > 0) {
            preloadImages(criticalUrls).then(() => {
              setCriticalImagesPreloaded(true);
            });
          }
        }

        // Process header images
        if (Array.isArray(headerData.images)) {
          setHeaderImages(headerData.images);
        }

        setImagesLoaded(true);

      } catch (err) {
        console.error('Failed to fetch images:', err);
        setImagesLoaded(true);
      }
    };

    fetchImages();
  }, []);

  const getBackgroundImage = (key) => {
    return backgroundImages[key]?.url || null;
  };

  const allHeaderImageUrls = headerImages.length > 0 ? headerImages.map((img) => img.url) : [];

  return (
    <WebsiteImageContext.Provider value={{ 
      getBackgroundImage, 
      allHeaderImageUrls,
      imagesLoaded,
      criticalImagesPreloaded
    }}>
      {children}
    </WebsiteImageContext.Provider>
  );
};

export const useContextImage = () => useContext(WebsiteImageContext);