import React, { useState, useEffect } from 'react';
import { Skeleton } from 'antd';
import { getWebsiteContent } from '../api/ContentApi';

const DynamicContent = ({ section, fallbackText }) => {
  const [content, setContent] = useState(fallbackText || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        const data = await getWebsiteContent();
        
        if (data && data[section] && data[section].text) {
          setContent(data[section].text);
        } else {
          setContent(fallbackText || '');
        }
      } catch (error) {
        console.error(`Error fetching ${section} content:`, error);
        setContent(fallbackText || '');
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, [section, fallbackText]);

  if (loading) {
    return <Skeleton active paragraph={{ rows: 3 }} />;
  }

  // If the content contains HTML (from rich text editor), render it safely
  return (
    <div 
      className="dynamic-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

export default DynamicContent;