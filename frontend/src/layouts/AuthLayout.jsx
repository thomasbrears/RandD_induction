import React from 'react';
import { Button, ConfigProvider } from 'antd';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import { useContextImage } from '../components/WebsiteImageProvider';

/**
 * AuthLayout - Common layout for all authentication pages
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content for the auth form
 * @param {string} props.title - Page title (for metadata)
 * @param {string} props.heading - Main heading text displayed on the page
 * @param {boolean} props.loading - Loading state
 * @param {string} props.loadingMessage - Message to display during loading
 */
function AuthLayout({ children, title, heading, loading, loadingMessage }) {
  const navigate = useNavigate();
  const { getBackgroundImage } = useContextImage();
  const bgUrl = getBackgroundImage('authBg');

  return (
    <ConfigProvider
      theme={{
        components: {
          Input: {
            colorBgContainer: '#ffffff',
            colorText: '#333333',
            colorTextPlaceholder: 'rgba(0, 0, 0, 0.45)',
            colorBorder: '#d9d9d9',
            activeBorderColor: '#0077B6',
            hoverBorderColor: '#40A9FF',
          },
          Button: {
            colorPrimary: '#0077B6',
            colorPrimaryHover: '#00568a',
            colorPrimaryActive: '#00568a',
          },
        },
      }}
    >
      <div 
        className="min-h-screen flex items-center justify-center bg-cover bg-center px-4 py-12" 
        style={{ 
          backgroundImage: `url(${bgUrl})`, 
          backgroundColor: 'rgba(0, 0, 0, 0.65)', 
          backgroundBlendMode: 'overlay' 
        }}
      >
        {loading && <Loading message={loadingMessage} />}
        
        
        
        <div className="w-full max-w-md">
          {/* Card with logo and auth form */}
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            
            {/* Auth Form */}
            <div className="p-8">
              <h1 className="text-3xl font-bold text-gray-800 text-center mb-6">{heading}</h1>
              {children}
            </div>
           
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

export default AuthLayout;