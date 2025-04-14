import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  message, 
  Skeleton, 
  Typography, 
  Divider, 
  Menu,
  Layout,
  Grid,
  Tabs,
  Select,
  Upload,
  Modal,
  Empty,
  Image
} from 'antd';
import { 
  SaveOutlined, 
  ReloadOutlined, 
  InfoCircleOutlined, 
  EditOutlined,
  HomeOutlined,
  PhoneOutlined,
  PictureOutlined,
  DeleteOutlined,
  PlusOutlined,
  InboxOutlined,
  FileOutlined,
  FilePdfOutlined,
  FileImageOutlined
} from '@ant-design/icons';
import { getWebsiteContent, updateWebsiteContent } from '../../api/ContentApi';
import ContentRichEditor from '../ContentRichEditor';

const { Text } = Typography;
const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;
const { TabPane } = Tabs;
const { Dragger } = Upload;

const ManageContent = () => {
  const [content, setContent] = useState({
    about: { text: '' },
    contact: { text: '' },
    'contact-page-content': { text: '' },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentSection, setCurrentSection] = useState('overview');
  const [editStatus, setEditStatus] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now());
  
  // For image management
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  
  // Mock data for header images (TODO: Replace with live images)
  const [headerImages, setHeaderImages] = useState([
    { uid: '1', name: 'new-header-bg-1.jpg', status: 'done', url: '/images/new-header-bg-1.jpg' },
    { uid: '2', name: 'new-header-bg-2.jpg', status: 'done', url: '/images/new-header-bg-2.jpg' },
    { uid: '3', name: 'new-header-bg-3.jpg', status: 'done', url: '/images/new-header-bg-3.jpg' },
    { uid: '4', name: 'new-header-bg-4.jpg', status: 'done', url: '/images/new-header-bg-4.jpg' },
    { uid: '5', name: 'new-header-bg-5.jpg', status: 'done', url: '/images/new-header-bg-5.jpg' },
    { uid: '6', name: 'new-header-bg-6.jpg', status: 'done', url: '/images/new-header-bg-6.jpg' },
    { uid: '7', name: 'new-header-bg-7.jpg', status: 'done', url: '/images/new-header-bg-7.jpg' },
    { uid: '8', name: 'WG_OUTSIDE_AUT.webp', status: 'done', url: '/images/WG_OUTSIDE_AUT.webp' },
  ]);
  
  // Mock data for background images (TODO: Replace with live images)
  const [bgImages, setBgImages] = useState({
    homeBg: { url: '/images/WG_OUTSIDE_AUT.webp', name: 'WG_OUTSIDE_AUT.webp', type: 'image/webp', size: 250000 },
    authBg: { url: '/images/WG_OUTSIDE_AUT.webp', name: 'WG_OUTSIDE_AUT.webp', type: 'image/webp', size: 250000 },
    aboutBg: { url: '/images/AUTEventsStaff.jpg', name: 'AUTEventsStaff.jpg', type: 'image/jpeg', size: 215000 }
  });
  
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  
  // For mobile navigation options
  const [activeTab, setActiveTab] = useState('home-page');

  useEffect(() => {
    fetchContent();
  }, []);

  useEffect(() => {
    // Auto-collapse sidebar on mobile
    if (isMobile) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [isMobile]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const data = await getWebsiteContent();
      
      // Make sure all required sections exist in the content
      const updatedData = {
        ...data,
        'about': data.about || { text: '' },
        'contact': data.contact || { text: '' },
        'contact-page-content': data['contact-page-content'] || { text: '' }
      };
      
      setContent(updatedData);
      
      // Initialise edit status for all sections
      const initialEditStatus = {};
      Object.keys(updatedData).forEach(section => {
        initialEditStatus[section] = false;
      });
      setEditStatus(initialEditStatus);
      
    } catch (error) {
      message.error('Failed to fetch website content');
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async (section) => {
    try {
      setSaving(true);
      await updateWebsiteContent(section, content[section].text);
      message.success(`${section.charAt(0).toUpperCase() + section.slice(1)} content updated successfully`);
      setEditStatus(prev => ({...prev, [section]: false}));
    } catch (error) {
      message.error(`Failed to update ${section} content`);
      console.error('Error updating content:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleContentChange = (section, value) => {
    setContent(prev => ({
      ...prev,
      [section]: { text: value }
    }));
    setEditStatus(prev => ({...prev, [section]: true}));
  };

  const handleMenuClick = ({ key }) => {
    setCurrentSection(key);
    // Generate a new key to force the editor to re-render
    setEditorKey(Date.now());
  };
  
  // Handle mobile tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };
  
  const handleSelectChange = (value) => {
    setCurrentSection(value);
    // Generate a new key to force the editor to re-render
    setEditorKey(Date.now());
  };

  // Helper function to convert file to base64 for preview
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  // Image preview handlers
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    
    setPreviewImage(file.url || file.preview);
    setPreviewVisible(true);
    setPreviewTitle(file.name || file.url?.substring(file.url.lastIndexOf('/') + 1));
  };
  
  const handleCancel = () => setPreviewVisible(false);
  
  // Placeholder for image upload functionality (TODO: Implement actual upload)
  const handleImageUpload = ({ file, onSuccess }) => {
    setTimeout(() => {
      message.info("Image upload functionality will be implemented soon");
      onSuccess("ok");
    }, 1000);
  };

  // Placeholder for image delete functionality (TODO: Implement actual delete)
  const handleImageDelete = (imageId) => {
    message.info("Image delete functionality will be implemented soon");
  };

  // Placeholder for background image change (TODO: Implement actual change)
  const handleBgImageChange = (type, info) => {
    message.info(`Background image ${type} change functionality will be implemented soon`);
  };
  
  // Function to get the appropriate icon based on file type
  const getFileIcon = (fileType) => {
    if (!fileType) return <FileOutlined />;
    
    if (fileType.startsWith('image/')) return <FileImageOutlined style={{ color: '#1890ff' }} />;
    if (fileType.includes('pdf')) return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
    
    return <FileOutlined />;
  };

  const renderOverviewPage = () => {
    return (
      <div className="space-y-6">
        <Card className="rounded-lg shadow-sm">
          <div className="text-center mb-6">
            <h2 className="text-blue-700 text-xl">Manage Content across the portal</h2>
          </div>
          
          <Divider className="my-6" />
          
          <h4 className="mb-4">Quick Start Guide</h4>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-blue-50 border border-blue-100">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mb-3">1</div>
                <h5>Choose a Section</h5>
              </div>
              <p className="text-gray-600">
                Select which part of your website you want to edit from the sidebar menu or dropdown on mobile.
              </p>
            </Card>
            
            <Card className="bg-blue-50 border border-blue-100">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mb-3">2</div>
                <h5>Edit Content</h5>
              </div>
              <p className="text-gray-600">
                Use the text editor to make changes to your content. Add formatting, links, and more.
              </p>
            </Card>
            
            <Card className="bg-blue-50 border border-blue-100">
              <div className="text-center mb-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 text-xl font-bold mb-3">3</div>
                <h5>Save Changes</h5>
              </div>
              <p className="text-gray-600">
                Click the Save button when you're done. Your changes will go live immediately on your website.
              </p>
            </Card>
          </div>
          
          <Divider className="my-6" />
          
          <h4 className="mb-4">Available Content Sections</h4>
          
          <div className="grid md:grid-cols-2 gap-6">
            <Card 
              hoverable 
              className="border border-gray-200"
              onClick={() => handleMenuClick({ key: 'about' })}
            >
              <div className="flex items-start">
                <HomeOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <h5 className="mb-2">About Us Section</h5>
                  <p className="text-gray-600 mb-2">
                    Edit the main About Us content on the homepage.
                  </p>
                  <Button type="primary" size="small">
                    Edit Section
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card 
              hoverable 
              className="border border-gray-200"
              onClick={() => handleMenuClick({ key: 'contact' })}
            >
              <div className="flex items-start">
                <HomeOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <h5 className="mb-2">Contact Us Section</h5>
                  <p className="text-gray-600 mb-2">
                    Update the Contact Us section on the homepage.
                  </p>
                  <Button type="primary" size="small">
                    Edit Section
                  </Button>
                </div>
              </div>
            </Card>
            
            <Card 
              hoverable 
              className="border border-gray-200"
              onClick={() => handleMenuClick({ key: 'contact-page-content' })}
            >
              <div className="flex items-start">
                <PhoneOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <h5 className="mb-2">Contact Page</h5>
                  <p className="text-gray-600 mb-2">
                    Edit the main title text on the Contact page.
                  </p>
                  <Button type="primary" size="small">
                    Edit Section
                  </Button>
                </div>
              </div>
            </Card>

            <Card 
              hoverable 
              className="border border-gray-200"
              onClick={() => handleMenuClick({ key: 'header-images' })}
            >
              <div className="flex items-start">
                <PictureOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <h5 className="mb-2">Header Images</h5>
                  <p className="text-gray-600 mb-2">
                    Manage the rotating header images displayed across the site.
                  </p>
                  <Button type="primary" size="small">
                    Manage Images
                  </Button>
                </div>
              </div>
            </Card>

            <Card 
              hoverable 
              className="border border-gray-200"
              onClick={() => handleMenuClick({ key: 'background-images' })}
            >
              <div className="flex items-start">
                <PictureOutlined className="text-2xl text-blue-500 mr-4 mt-1" />
                <div>
                  <h5 className="mb-2">Background Images</h5>
                  <p className="text-gray-600 mb-2">
                    Change the background images used on key pages.
                  </p>
                  <Button type="primary" size="small">
                    Manage Backgrounds
                  </Button>
                </div>
              </div>
            </Card>
          </div>        
        </Card>
      </div>
    );
  };

  const renderEditor = (section) => {
    // Only render for sections we actually have data for
    if (!content[section]) return null;
    
    let capitalisedSection = section;
    
    // Handle hyphenated section names
    if (section.includes('-')) {
      capitalisedSection = section
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    } else {
      capitalisedSection = section.charAt(0).toUpperCase() + section.slice(1);
    }
    
    let description = '';
    if (section === 'about') {
      description = 'This content appears in the About Us section on the homepage.';
    } else if (section === 'contact') {
      description = 'This content appears in the Contact Us section on the homepage.';
    } else if (section === 'contact-page-content') {
      description = 'This content appears at the top of the Contact page form.';
    }
    
    return (
      <div className="mb-6">
        <Card 
          className="rounded-lg shadow-sm"
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <EditOutlined className="mr-2 text-blue-500" />
                <span>{capitalisedSection} Section</span>
              </div>
              {editStatus[section] && (
                <Text type="warning" className="text-sm"> Unsaved changes </Text>
              )}
            </div>
          }
        >
          <div className="p-3 mb-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
            <InfoCircleOutlined className="text-blue-500 mt-1 mr-2" />
            <Text className="text-blue-800">{description}</Text>
          </div>
          
          <ContentRichEditor 
            key={`editor-${section}-${editorKey}`}
            content={content[section].text}
            onChange={(value) => handleContentChange(section, value)}
          />
          
          <div className="flex justify-end mt-6 space-x-3">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={() => fetchContent()}
              disabled={saving}
            >Reset All Changes
            </Button>
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={() => handleSaveContent(section)}
              loading={saving}
              disabled={!editStatus[section]}
            >Save Changes
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderHeaderImageManager = () => {
    // Define accepted file types for header images
    const acceptedFileTypes = '.jpg,.jpeg,.png,.webp';
    
    return (
      <div className="mb-6">
        <Card 
          className="rounded-lg shadow-sm"
          title={
            <div className="flex items-center">
              <PictureOutlined className="mr-2 text-blue-500" />
              <span>Header Images</span>
            </div>
          }
        >
          <div className="p-3 mb-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
            <InfoCircleOutlined className="text-blue-500 mt-1 mr-2" />
            <Text className="text-blue-800">
              Manage the images that randomly display in the header across your website. 
              Recommended size is 1920x500 pixels with a 16:9 aspect ratio.
            </Text>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md mb-4 border border-yellow-100">
            <Text type="warning">
              <strong>Note:</strong> Image upload, delete and change functionality is yet to be implemented. Coming soon - Stay tuned!
            </Text>
          </div>
          
          {/* Image Grid */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-4">Current Header Images</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {headerImages.map((image, index) => (
                <div key={image.uid} className="border border-gray-200 rounded-md overflow-hidden">
                  <div 
                    className="h-40 bg-gray-100 overflow-hidden cursor-pointer"
                    onClick={() => handlePreview(image)}
                  >
                    <img 
                      src={image.url} 
                      alt={`Header ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-3">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium">Header Image {index + 1}</p>
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleImageDelete(image.uid)}
                        size="small"
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Click image to preview
                    </p>
                  </div>
                </div>
              ))}
              
              {/* Add new image square */}
              <div className="border border-dashed border-gray-300 rounded-md h-64 flex flex-col items-center justify-center">
                <Upload
                  accept={acceptedFileTypes}
                  showUploadList={false}
                  customRequest={handleImageUpload}
                >
                  <div className="text-center p-6">
                    <PlusOutlined className="text-2xl text-gray-400 mb-2" />
                    <p className="text-gray-500">Add new header image</p>
                  </div>
                </Upload>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <Button 
              icon={<SaveOutlined />} 
              type="primary"
              onClick={() => message.info("Save functionality will be implemented soon")}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderBackgroundImageManager = () => {
    return (
      <div className="mb-6">
        <Card 
          className="rounded-lg shadow-sm"
          title={
            <div className="flex items-center">
              <PictureOutlined className="mr-2 text-blue-500" />
              <span>Background Images</span>
            </div>
          }
        >
          <div className="p-3 mb-4 bg-blue-50 rounded-md border border-blue-100 flex items-start">
            <InfoCircleOutlined className="text-blue-500 mt-1 mr-2" />
            <p className="text-blue-800">
              Manage the background images used on key pages. 
              Recommended size is 1920x1080 pixels with a 16:9 aspect ratio.
            </p>
          </div>
          
          <div className="bg-yellow-50 p-3 rounded-md mb-4 border border-yellow-100">
            <Text type="warning">
            <strong>Note:</strong> Image upload, delete and change functionality is yet to be implemented. Coming soon - Stay tuned!
            </Text>
          </div>
          
          <div className="space-y-6">
            {/* Home Page Background */}
            <Card title="Home Page Hero Background" bordered={false} className="bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/2">
                  <div 
                    className="border border-gray-200 rounded-md overflow-hidden cursor-pointer"
                    onClick={() => handlePreview(bgImages.homeBg)}
                    style={{ height: '200px' }}
                  >
                    <img 
                      src={bgImages.homeBg.url} 
                      alt="Home background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-1/2">
                  <div className="p-4 border border-gray-200 rounded-md bg-white mb-4">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(bgImages.homeBg.type)}
                      <div>
                        <p className="text-sm font-medium">{bgImages.homeBg.name}</p>
                        <p className="text-xs text-gray-500">
                          {(bgImages.homeBg.size / 1024).toFixed(2)} KB · {bgImages.homeBg.type || 'Image'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Dragger
                    name="home-bg"
                    multiple={false}
                    accept=".jpg,.jpeg,.png,.webp"
                    beforeUpload={() => false} // Disable upload
                    onChange={(info) => handleBgImageChange('home', info)}
                    showUploadList={false}
                    className="bg-white"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#8c8c8c' }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to replace image</p>
                    <p className="ant-upload-hint text-xs text-gray-500">
                      Recommended size: 1920x1080px (16:9)
                    </p>
                  </Dragger>
                </div>
              </div>
            </Card>
            
            {/* Auth Page Background */}
            <Card title="Authentication Pages Background" bordered={false} className="bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/2">
                  <div 
                    className="border border-gray-200 rounded-md overflow-hidden cursor-pointer"
                    onClick={() => handlePreview(bgImages.authBg)}
                    style={{ height: '200px' }}
                  >
                    <img 
                      src={bgImages.authBg.url} 
                      alt="Auth background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-1/2">
                  <div className="p-4 border border-gray-200 rounded-md bg-white mb-4">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(bgImages.authBg.type)}
                      <div>
                        <p className="text-sm font-medium">{bgImages.authBg.name}</p>
                        <p className="text-xs text-gray-500">
                          {(bgImages.authBg.size / 1024).toFixed(2)} KB · {bgImages.authBg.type || 'Image'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Dragger
                    name="auth-bg"
                    multiple={false}
                    accept=".jpg,.jpeg,.png,.webp"
                    beforeUpload={() => false} // Disable upload
                    onChange={(info) => handleBgImageChange('auth', info)}
                    showUploadList={false}
                    className="bg-white"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#8c8c8c' }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to replace image</p>
                    <p className="ant-upload-hint text-xs text-gray-500">
                      Recommended size: 1920x1080px (16:9)
                    </p>
                  </Dragger>
                </div>
              </div>
            </Card>
            
            {/* About Section Background */}
            <Card title="About Section Background" bordered={false} className="bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                <div className="md:w-1/2">
                  <div 
                    className="border border-gray-200 rounded-md overflow-hidden cursor-pointer"
                    onClick={() => handlePreview(bgImages.aboutBg)}
                    style={{ height: '200px' }}
                  >
                    <img 
                      src={bgImages.aboutBg.url} 
                      alt="About background"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <div className="md:w-1/2">
                  <div className="p-4 border border-gray-200 rounded-md bg-white mb-4">
                    <div className="flex items-start space-x-3">
                      {getFileIcon(bgImages.aboutBg.type)}
                      <div>
                        <p className="text-sm font-medium">{bgImages.aboutBg.name}</p>
                        <p className="text-xs text-gray-500">
                          {(bgImages.aboutBg.size / 1024).toFixed(2)} KB · {bgImages.aboutBg.type || 'Image'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <Dragger
                    name="about-bg"
                    multiple={false}
                    accept=".jpg,.jpeg,.png,.webp"
                    beforeUpload={() => false} // Disable upload
                    onChange={(info) => handleBgImageChange('about', info)}
                    showUploadList={false}
                    className="bg-white"
                  >
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined style={{ color: '#8c8c8c' }} />
                    </p>
                    <p className="ant-upload-text">Click or drag file to replace image</p>
                    <p className="ant-upload-hint text-xs text-gray-500">
                      Recommended size: 1920x1080px (16:9)
                    </p>
                  </Dragger>
                </div>
              </div>
            </Card>
          </div>
          
          <div className="flex justify-end mt-6 space-x-3">
            <Button 
              icon={<SaveOutlined />} 
              type="primary"
              onClick={() => message.info("Save functionality will be implemented soon")}
            >
              Save Changes
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderComingSoonMessage = () => {
    return (
      <div className="py-12 text-center bg-gray-50 rounded-lg my-6">
        <InfoCircleOutlined style={{ fontSize: '48px' }} className="text-gray-300" />
        <h2 className="text-black mt-4 text-xl">This section is coming soon</h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Content management for this page or section is not yet implemented.
        </p>
      </div>
    );
  };

  // Menu items for the content sections
  const menuItems = [
    {
      key: 'overview',
      icon: <InfoCircleOutlined />,
      label: 'Overview'
    },
    {
      key: 'home-page',
      icon: <HomeOutlined />,
      label: 'Home Page',
      children: [
        {
          key: 'about',
          label: 'About Us Section'
        },
        {
          key: 'contact',
          label: 'Contact Us Section'
        }
      ]
    },
    {
      key: 'contact-page',
      icon: <PhoneOutlined />,
      label: 'Contact Page',
      children: [
        {
          key: 'contact-page-content',
          label: 'Contact Text'
        }
      ]
    },
    {
      key: 'images',
      icon: <PictureOutlined />,
      label: 'Images',
      children: [
        {
          key: 'header-images',
          label: 'Header Images'
        },
        {
          key: 'background-images',
          label: 'Background Images'
        }
      ]
    }
  ];

  const renderSection = () => {
    if (currentSection === 'overview') {
      return renderOverviewPage();
    } else if (currentSection === 'about') {
      return renderEditor('about');
    } else if (currentSection === 'contact') {
      return renderEditor('contact');
    } else if (currentSection === 'contact-page-content') {
      return renderEditor('contact-page-content');
    } else if (currentSection === 'header-images') {
      return renderHeaderImageManager();
    } else if (currentSection === 'background-images') {
      return renderBackgroundImageManager();
    } else {
      return renderComingSoonMessage();
    }
  };

  const getSectionTitle = () => {
    if (currentSection === 'overview') {
      return 'Content Management Overview';
    } else if (currentSection === 'about') {
      return 'About Us Section';
    } else if (currentSection === 'contact') {
      return 'Contact Us Section';
    } else if (currentSection === 'contact-page-content') {
      return 'Contact Page Content';
    } else if (currentSection === 'header-images') {
      return 'Header Images';
    } else if (currentSection === 'background-images') {
      return 'Background Images';
    } else {
      return 'Coming Soon';
    }
  };

  // Generate options for the mobile select dropdown
  const generateSelectOptions = () => {
    const options = [];
    
    menuItems.forEach(item => {
      if (item.children) {
        const group = {
          label: item.label,
          options: item.children.map(child => ({
            value: child.key,
            label: (
              <span>
                {item.icon} {child.label}
              </span>
            )
          }))
        };
        options.push(group);
      } else {
        options.push({
          value: item.key,
          label: (
            <span>
              {item.icon} {item.label}
            </span>
          )
        });
      }
    });
    
    return options;
  };

  return (
    <Layout className="bg-white">
      {/* Mobile Navigation - Dropdown */}
      {isMobile && (
        <div className="mb-4 sticky top-0 bg-white z-10 pb-2 border-b">
          <Select
            style={{ width: '100%' }}
            placeholder="Select Page Section"
            onChange={handleSelectChange}
            value={currentSection}
            options={generateSelectOptions()}
            optionLabelProp="label"
            size="large"
          />
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          width={240}
          theme="light"
          className="border-r border-gray-200"
          style={{ 
            height: 'calc(100vh - 80px)', 
            position: 'sticky', 
            top: '2rem',
            zIndex: 10 
          }}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
        >
          <Menu
            mode="inline"
            selectedKeys={[currentSection]}
            defaultOpenKeys={['home-page', 'contact-page', 'images']}
            onClick={handleMenuClick}
            style={{ borderRight: 0 }}
            items={menuItems}
          />
        </Sider>
      )}

      <Content className="p-6">
        <div className="mb-6">
          <h3 className="text-gray-700">{getSectionTitle()}</h3>
          <Divider className="mt-2 mb-6" />
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        ) : (
          <>
            {renderSection()}
            
            {/* Content Creation Tips - Only show on content editing pages, not on overview or image management */}
            {currentSection !== 'overview' && 
             !currentSection.includes('images') && (
              <Card className="mt-8 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="mb-2">
                  <h4 className="text-blue-700 flex items-center">
                    <InfoCircleOutlined className="mr-2" /> 
                    Tips for Creating Great Content
                  </h4>
                  <Divider className="my-3" />
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="font-bold text-blue-800">Content Structure</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Use headings (H1, H2, H3) to create a clear hierarchy</li>
                      <li>Keep paragraphs short and focused on one main idea</li>
                      <li>Use bullet points for lists of information</li>
                      <li>Include a clear call-to-action where appropriate</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-bold text-blue-800">Design & Formatting</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800">
                      <li>Use text alignment to create visual hierarchy</li>
                      <li>Add links to relevant resources or additional information</li>
                      <li>Use bold or italics to emphasise important points</li>
                      <li>Preview your content after saving to ensure it looks good</li>
                    </ul>
                  </div>
                </div>
              </Card>
            )}

          </>
        )}
      </Content>

      {/* Image Preview Modal */}
      <Modal
        visible={previewVisible}
        title={previewTitle}
        footer={null}
        onCancel={handleCancel}
      >
        <img alt="preview" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </Layout>
  );

}

export default ManageContent;