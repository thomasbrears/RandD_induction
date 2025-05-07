import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom'; 
import { Tabs, Card, Row, Col, Typography, Divider, Skeleton } from 'antd';
import { notifyError } from '../../utils/notificationService';
import { AiOutlineSetting } from 'react-icons/ai';
import { FaBuilding, FaUserTie } from 'react-icons/fa';
import { IoLocation } from "react-icons/io5";
import { EditOutlined, MailOutlined } from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import ManageDepartments from '../../components/management/ManageDepartments';
import ManageLocations from '../../components/management/ManageLocations';
import ManagePositions from '../../components/management/ManagePositions';
import ManageContent from '../../components/management/ManageContent';
import ManageEmailSettings from '../../components/management/ManageEmailSettings';

const { Title, Paragraph } = Typography;
const { TabPane } = Tabs;

const Settings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      setLoading(false);
    } else if (!user && !loading) {
      notifyError('Authentication required', 'You must be logged in to access this page');
      navigate('/login');
    }
  }, [user, loading, navigate]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const settings = [
    {
      key: 'departments',
      title: 'Departments',
      description: 'View, add, and manage staff departments.',
      icon: <FaBuilding className="text-blue-500 text-3xl" />,
      tabKey: '2'
    },
    {
      key: 'positions',
      title: 'Positions',
      description: 'View, add, and manage staff positions.',
      icon: <FaUserTie className="text-green-500 text-3xl" />,
      tabKey: '3'
    },
    {
      key: 'locations',
      title: 'Locations',
      description: 'View, add, and manage staff locations.',
      icon: <IoLocation className="text-purple-500 text-3xl" />,
      tabKey: '4'
    },
    {
      key: 'email',
      title: 'Email Settings',
      description: 'Configure email addresses used for system notifications.',
      icon: <MailOutlined className="text-red-500 text-3xl" />,
      tabKey: '5'
    },
    {
      key: 'content',
      title: 'Website Content',
      description: 'Update content displayed across different pages of the portal.',
      icon: <EditOutlined className="text-orange-500 text-3xl" />,
      tabKey: '6'
    }
  ];

  // Skeleton loading screen
  const renderSkeletonLoader = () => {
    return (
      <>
        <PageHeader
          title="System Settings"
          subtext="Manage the Induction Portal"
        />
        
        <div className="flex md:px-0 bg-gray-50">
          <div>
            <ManagementSidebar />
          </div>
          
          <div className="flex-1 bg-white rounded-lg shadow-md p-6">
            <Skeleton active paragraph={{ rows: 2 }} className="mb-6" />
            
            <Row gutter={[16, 16]}>
              {[1, 2, 3, 4].map(item => (
                <Col xs={24} sm={12} lg={6} key={item}>
                  <Card className="h-full">
                    <Skeleton active paragraph={{ rows: 3 }} avatar={{ shape: 'circle' }} />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </>
    );
  };

  // Loading state
  if (loading) {
    return renderSkeletonLoader();
  }

  return (
    <>
      <Helmet>
        <title>System Settings | AUT Events Induction Portal</title>
      </Helmet>

      {/* Page Header */}
      <PageHeader
        title="System Settings"
        subtext="Manage the Induction Portal"
      />

      {/* Main container */}
      <div className="flex md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 bg-white rounded-lg shadow-md overflow-x-auto">
          <Tabs 
            activeKey={activeTab}
            onChange={handleTabChange}
            type="card"
            className="px-4"
          >
            {/* Overview Tab */}
            <TabPane
              tab={
                <span>
                  <AiOutlineSetting className="inline-block mr-2" />
                  Overview
                </span>
              }
              key="1"
            >
              <div className="p-6">
                <div className="mb-6">
                  <h1 className="text-gray-800 text-2xl">Welcome to System Settings</h1>
                  <p className="text-gray-600 mt-2 max-w-3xl">
                    Here administrators can manage key settings and options of the Induction Portal.
                    Select any card below or use the tabs above to navigate to different sections.
                  </p>
                  <Divider className="my-6" />
                </div>

                <Row gutter={[16, 16]}>
                  {settings.map(setting => (
                    <Col xs={24} sm={12} lg={6} key={setting.key}>
                      <Card
                        hoverable
                        className="h-full shadow-sm transition-all duration-300 hover:shadow-md"
                        onClick={() => setActiveTab(setting.tabKey)}
                      >
                        <div className="flex flex-col items-center text-center h-full">
                          <div className="mb-4 p-4 rounded-full bg-gray-50 flex items-center justify-center">
                            {setting.icon}
                          </div>
                          <h1 className="mb-2 text-gray-800">{setting.title}</h1>
                          <p className="text-gray-600">{setting.description}</p>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </div>
            </TabPane>

            {/* Manage Departments Tab */}
            <TabPane
              tab={
                <span>
                  <FaBuilding className="inline-block mr-2" />
                  Manage Departments
                </span>
              }
              key="2"
            >
              <ManageDepartments />
            </TabPane>

            {/* Manage Positions Tab */}
            <TabPane
              tab={
                <span>
                  <FaUserTie className="inline-block mr-2" />
                  Manage Positions
                </span>
              }
              key="3"
            >
              <ManagePositions />
            </TabPane>

            {/* Manage Locations Tab */}
            <TabPane
              tab={
                <span>
                  <IoLocation className="inline-block mr-2" />
                  Manage Locations
                </span>
              }
              key="4"
            >
              <ManageLocations />
            </TabPane>

            {/* Manage defult Email Settings Tab */}
            <TabPane
              tab={
                <span>
                  <MailOutlined className="inline-block mr-2" />
                  Email Settings
                </span>
              }
              key="5"
            >
              <ManageEmailSettings />
            </TabPane>

            {/* Manage Content Tab */}
            <TabPane
              tab={
                <span>
                  <EditOutlined className="inline-block mr-2" />
                  Manage Website Content
                </span>
              }
              key="6"
            >
              <ManageContent />
            </TabPane>
          </Tabs>
        </div>
      </div>
    </>
  );
};

export default Settings;