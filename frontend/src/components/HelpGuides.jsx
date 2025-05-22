import React, { useState, useEffect } from 'react';
import { Drawer, Button, Tooltip, Empty } from 'antd';
import { QuestionCircleOutlined, MessageOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Permissions from '../models/Permissions';

// Define guides data structure
// Each category has a name, access level, and an array of items (guides)
const guidesData = [
  {
    category: 'Authentication',
    accessLevel: 'public',
    items: [
      { title: 'How-to: Sign in with email & password', path: '/guides/signin-email-password.pdf' },
      { title: 'How-to: Sign in with an email link', path: '/guides/signin-email-link.pdf' },
      { title: 'How-to: Reset or set a password', path: '/guides/reset-password.pdf' },
    ]
  },
  {
    category: 'Induction assignment & management',
    accessLevel: 'manager',
    items: [
      { title: 'How to: Assign induction(s)', path: '/guides/assign-inductions.pdf' },
      { title: 'How to: View & Manage existing induction assignments', path: '/guides/manage-induction-assignments.pdf' },
    ]
  },
  {
    category: 'Taking an Induction',
    accessLevel: 'user',
    items: [
      { title: 'How to: Take an induction module', path: '/guides/take-induction-module.pdf' },
    ]
  },
  {
    category: 'User profile',
    accessLevel: 'user',
    items: [
      { title: 'How to: Update my password', path: '/guides/update-password.pdf' },
      { title: 'How to: Update my email address', path: '/guides/update-email.pdf' },
      { title: 'How to: Update my name', path: '/guides/update-name.pdf' },
    ]
  },
  {
    category: 'Creating & Editing users',
    accessLevel: 'manager',
    items: [
      { title: 'How to: Create a new user account', path: '/guides/create-user-account.pdf' },
      { title: 'How to: Edit a user\'s information', path: '/guides/edit-user-info.pdf' },
      { title: 'How to: Deactivate, Reactivate or Delete a user account', path: '/guides/manage-user-account-status.pdf' },
    ]
  },
  {
    category: 'Viewing Results',
    accessLevel: 'manager',
    items: [
      { title: 'How to: View induction result (1 Specific Induction)', path: '/guides/view-specific-induction-result.pdf' },
      { title: 'How to: View a user\'s induction results & responses', path: '/guides/view-user-induction-results.pdf' },
    ]
  },
  {
    category: 'Module Management',
    accessLevel: 'manager',
    items: [
      { title: 'How to: Create an Induction Module', path: '/guides/create-module.pdf' },
      { title: 'How to: Edit an Induction Module', path: '/guides/edit-module.pdf' },
    ]
  },
  {
    category: 'System Settings',
    accessLevel: 'admin', 
    items: [
      { title: 'System settings overview', path: '/guides/system-settings.pdf' },
    ]
  },
  {
    category: 'Contact form & submissions',
    accessLevel: 'manager',
    items: [
      { title: 'How to: View & Manage website contact submissions', path: '/guides/manage-contact-submissions.pdf' },
    ]
  },
];

// Helper function to check if a user has permission to view a guide category
const hasPermission = (accessLevel, user) => {
  // Public guides are visible to all
  if (accessLevel === 'public') return true;
  
  // User-level guides require being logged in
  if (accessLevel === 'user' && user) return true;
  
  // Manager-level guides require manager or admin role
  if (accessLevel === 'manager' && user && 
      (user.role === Permissions.MANAGER || user.role === Permissions.ADMIN)) return true;
  
  // Admin-level guides require admin role
  if (accessLevel === 'admin' && user && user.role === Permissions.ADMIN) return true;
  
  return false;
};

// Main HelpGuides component
const HelpGuides = ({ isOpen, onClose, anchorEl }) => {
  const { user } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  
  // Check screen width on mount and when window is resized
  useEffect(() => {
    // Function to determine if device is mobile based on screen width
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Set initial value
    checkIfMobile();
    
    // Event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // Function to open PDF in new tab
  const openGuide = (path) => {
    window.open(path, '_blank');
  };

  // Filter guides based on user's permissions
  const visibleGuides = guidesData.filter(category => 
    hasPermission(category.accessLevel, user)
  );

  const drawerStyles = {
    body: { 
      paddingBottom: 80,
      ...(isMobile ? {} : { maxHeight: '80vh', overflow: 'auto' })
    },
    footer: { 
      textAlign: 'center' 
    }
  };

  // Different drawer configuration based on screen size
  return (
    <Drawer
      title="Help Guides"
      placement={isMobile ? "bottom" : "left"}
      height={isMobile ? "80vh" : undefined}
      width={isMobile ? undefined : 320}
      onClose={onClose}
      open={isOpen}
      styles={drawerStyles}
      extra={
        <Link to="/contact">
          <Button type="primary" icon={<MessageOutlined />} size="small">
            Contact us
          </Button>
        </Link>
      }
      footer={!isMobile && (
        <Link to="/contact">
          <Button type="primary" icon={<MessageOutlined />} block>
            Need more help? Contact us
          </Button>
        </Link>
      )}
    >
      <HelpContent 
        visibleGuides={visibleGuides} 
        openGuide={openGuide}
      />
    </Drawer>
  );
};

// Component for the help content to avoid duplication
const HelpContent = ({ visibleGuides, openGuide }) => {
  return (
    <div className="px-2">
      {visibleGuides.length > 0 ? (
        visibleGuides.map((category, categoryIndex) => (
          <div key={categoryIndex} className="mb-5">
            <h3 className="text-base font-medium mb-2 text-gray-700">{category.category}</h3>
            {category.items && category.items.length > 0 ? (
              <ul className="pl-2 list-none">
                {category.items.map((guide, guideIndex) => (
                  <li 
                    key={guideIndex} 
                    className="mb-1 cursor-pointer hover:bg-gray-50 p-2 rounded"
                    onClick={() => openGuide(guide.path)}
                  >
                    <span className="text-sm text-gray-800 hover:text-blue-600 transition-colors">
                      {guide.title}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic pl-2 text-sm">No guides available yet</p>
            )}
          </div>
        ))
      ) : (
        <Empty 
          description="Please log in to view available help guides" 
          className="my-8"
        />
      )}
    </div>
  );
};

// Floating help button component
export const FloatingHelpButton = ({ onClick }) => {
  return (
    <Tooltip title="Help Guides">
      <div 
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg cursor-pointer transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
        onClick={onClick}
        aria-label="Open Help Guides"
        style={{ width: 45, height: 45 }}
      >
        <QuestionCircleOutlined className="text-xl" />
      </div>
    </Tooltip>
  );
};

export default HelpGuides;