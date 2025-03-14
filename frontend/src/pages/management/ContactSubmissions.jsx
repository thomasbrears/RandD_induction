import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { getAuth } from 'firebase/auth';
import useAuth from '../../hooks/useAuth';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import { Helmet } from 'react-helmet-async';
import { 
  Table, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Modal, 
  Skeleton, 
  Card, 
  Typography, 
  Row, 
  Col, 
  Divider, 
  Layout,
  Popconfirm,
  List,
  Statistic,
  Empty
} from 'antd';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  EyeOutlined, 
  MailOutlined, 
  SearchOutlined, 
  DeleteOutlined, 
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import { getContactSubmissions, deleteContactSubmission } from '../../api/ContactApi';
import { collection, query, getDocs, getDoc, doc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
// Using window.innerWidth directly instead of react-responsive

const { Title, Text, Paragraph } = Typography;
const { Content } = Layout;

const ContactSubmissions = () => {
  // Add responsive breakpoints using useState and useEffect
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 767);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 767 && window.innerWidth <= 991);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 767);
      setIsTablet(window.innerWidth > 767 && window.innerWidth <= 991);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSubmission, setCurrentSubmission] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentMap, setDepartmentMap] = useState({});
  const auth = getAuth();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is an admin (for delete button)
  const isAdmin = user && (user.role === 'admin' || user.permission === 'admin' || user.position === 'admin');

  // Fetch contact submissions
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // First fetch departments
        try {
          const departmentsSnapshot = await getDocs(query(collection(db, 'departments')));
          const departmentList = departmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            name: doc.data().name || doc.id,
          }));
          
          setDepartments(departmentList);
          
          // Create a map of department IDs to names for easy lookup
          const deptMap = {};
          departmentList.forEach(dept => {
            deptMap[dept.id] = dept.name;
          });
          setDepartmentMap(deptMap);
        } catch (error) {
          console.error('Error fetching departments:', error);
          toast.error('Failed to load departments');
        }
        
        // Then fetch submissions
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error('You must be logged in to view submissions');
          setLoading(false);
          return;
        }
        
        const token = await currentUser.getIdToken();
        const submissionsData = await getContactSubmissions(token);
        
        // Process the submissions
        const formattedSubmissions = submissionsData.map(submission => ({
          ...submission,
          createdAt: submission.createdAt?.toDate ? 
                    submission.createdAt.toDate() : 
                    new Date(submission.createdAt?._seconds * 1000 || submission.createdAt)
        }));
        
        setSubmissions(formattedSubmissions);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load contact submissions');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [auth]);

  // Handle view submission details
  const handleViewSubmission = (submission) => {
    setCurrentSubmission(submission);
    setModalVisible(true);
  };

  // Filter submissions based on search text
  const getFilteredSubmissions = () => {
    // Trim and convert search text to lowercase
    const searchLower = (searchText || '').toLowerCase().trim();
    
    // If search is empty, return all submissions
    if (!searchLower) {
      return submissions;
    }
    
    const filtered = submissions.filter(submission => {
      // Focus search on message, subject, and users name
      const fullName = String(submission.fullName || '').toLowerCase();
      const subject = String(submission.subject || '').toLowerCase();
      const message = String(submission.message || '').toLowerCase();
      const formType = String(submission.formType || 'contact').toLowerCase();
      
      // Check if any of these fields contains the search text
      const matches = 
        fullName.includes(searchLower) ||
        subject.includes(searchLower) ||
        message.includes(searchLower) ||
        formType.includes(searchLower);
      
      return matches;
    });
    return filtered;
  };

  // Helper functions to get counts by form type
  const getFeedbackCount = () => {
    return submissions.filter(item => item.formType === 'feedback').length;
  };

  const getContactFormCount = () => {
    return submissions.filter(item => !item.formType || item.formType === 'contact').length;
  };

  // Reset search
  const resetSearch = () => {
    setSearchText('');
  };
  
  // Handle delete submission
  const handleDeleteSubmission = async (id) => {
    if (!isAdmin) {
      toast.info('Only administrators can delete submissions');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        toast.error('You must be logged in to delete submissions');
        return;
      }
      
      const token = await currentUser.getIdToken();
      await deleteContactSubmission(id, token);
      
      // Remove from local state
      setSubmissions(submissions.filter(submission => submission.id !== id));
      toast.success('Submission deleted successfully');
      
      // Close modal if the deleted submission is currently open
      if (currentSubmission && currentSubmission.id === id) {
        setModalVisible(false);
      }
    } catch (error) {
      console.error('Error deleting submission:', error);
      toast.error('Failed to delete submission');
    }
  };

  const handleViewUser = (uid) => {
    if (!uid) return;
    navigate("/management/users/edit", { state: { uid } });
  };

  // Table columns configuration
  const columns = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: date => moment(date).format('DD/MM/YYYY h:mm A'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
      responsive: ['md'],
    },
    {
      title: 'Name',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => (
        <span>
          {text}{' '}
          {(record.isLoggedIn || record.userId) && (
            <Tag color="blue">Staff</Tag>
          )}
        </span>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
    },
    {
      title: 'Type',
      dataIndex: 'formType',
      key: 'formType',
      render: (formType) => {
        if (formType === 'feedback') {
          return <Tag color="purple">Feedback</Tag>;
        }
        return <Tag color="cyan">Contact</Tag>;
      },
      filters: [
        { text: 'Contact Form', value: 'contact' },
        { text: 'Induction Feedback', value: 'feedback' },
      ],
      onFilter: (value, record) => {
        // If formType is undefined, treat it as a contact form
        const type = record.formType || 'contact';
        return type === value;
      },
      responsive: ['sm'],
      width: 100, 
    },
    {
      title: 'Department',
      dataIndex: 'contactType',
      key: 'contactType',
      render: (contactType) => {
        if (!contactType) return <Tag color="default">None</Tag>;
        return <Tag color="green">{departmentMap[contactType] || contactType}</Tag>;
      },
      filters: departments.map(dept => ({ text: dept.name, value: dept.id })),
      onFilter: (value, record) => record.contactType === value,
      responsive: ['sm'],
      width: 130, 
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true,
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="primary" 
            size="small" 
            icon={<EyeOutlined />} 
            onClick={() => handleViewSubmission(record)}
          >
            {!isMobile && 'View'}
          </Button>
          <Button 
            size="small" 
            icon={<MailOutlined />} 
            onClick={() => window.open(`mailto:${record.email}?subject=Re: ${record.subject}`)}
          >
            {!isMobile && 'Reply'}
          </Button>
        </Space>
      ),
    },
  ];

  // Skeleton for loading state
  const renderSkeleton = () => {
    if (isMobile) {
      return (
        <div>
          {[...Array(3)].map((_, index) => (
            <Card style={{ marginBottom: 16 }} key={index}>
              <Skeleton active avatar paragraph={{ rows: 3 }} />
            </Card>
          ))}
        </div>
      );
    }
    
    return (
      <div>
        {[...Array(5)].map((_, index) => (
          <div key={index}>
            <Row gutter={[16, 16]}>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
              <Col span={4}><Skeleton.Input active size="small" style={{ width: '100%' }} /></Col>
            </Row>
            <Divider style={{ margin: '16px 0' }} />
          </div>
        ))}
      </div>
    );
  };

  // Mobile card view
  const renderMobileCardView = () => {
    const filteredData = getFilteredSubmissions();
    
    return (
      <List
        itemLayout="vertical"
        dataSource={filteredData}
        pagination={{
          pageSize: 10,
          size: 'small',
        }}
        renderItem={item => (
          <Card 
            style={{ marginBottom: 16, borderRadius: 8 }}
            hoverable
            actions={[
              <Button 
                type="primary" 
                icon={<EyeOutlined />} 
                onClick={() => handleViewSubmission(item)}
                size="small"
              >
                View
              </Button>,
              <Button 
                icon={<MailOutlined />} 
                onClick={() => window.open(`mailto:${item.email}?subject=Re: ${item.subject}`)}
                size="small"
              >
                Reply
              </Button>
            ]}
          >
            <List.Item.Meta

              title={
                <div>
                  <div style={{ marginBottom: 4 }}>
                    <Text strong>{item.fullName}</Text>
                    {(item.isLoggedIn || item.userId) && (
                      <Tag color="blue" style={{ marginLeft: 8 }}>Staff</Tag>
                    )}
                  </div>
                  <Text ellipsis style={{ fontSize: 14 }}>{item.subject}</Text>
                </div>
              }
              description={
                <div style={{ fontSize: 12 }}>
                  <div>
                    <CalendarOutlined style={{ marginRight: 4 }} />
                    {moment(item.createdAt).format('DD/MM/YYYY h:mm A')}
                  </div>
                  <div>
                  {item.formType === 'feedback' ? (
                    <Tag color="purple" size="small">Feedback</Tag>
                  ) : (
                    <Tag color="cyan" size="small">Contact</Tag>
                  )}
                  {item.contactType && (
                    <span style={{ marginLeft: 4 }}>
                      Dept: {departmentMap[item.contactType] || item.contactType}
                    </span>
                  )}
                </div>
              </div>
              }
            />
          </Card>
        )}
        locale={{
          emptyText: <Empty description="No submissions found" />
        }}
      />
    );
  };

  return (
    <Layout>
      <Helmet><title>Contact Submissions | AUT Events Induction Portal</title></Helmet>
  
      {/* Page Header */}
      <PageHeader title="Contact Submissions" subtext="View and manage all contact form & feedback submissions" />
  
      {/* Main content area with sidebar and content */}
      <Layout className="site-layout-background" style={{ background: '#fff' }}>
        {/* Management Sidebar*/}
        {!isMobile && (
          <Layout.Sider 
            width={115} 
            className="hidden md:block" 
            style={{ background: '#fff' }}
          >
            <ManagementSidebar />
          </Layout.Sider>
        )}

        {/* Mobile sidebar */}
        {isMobile && (
          <Layout.Sider 
            width={6} 
            className="block md:hidden" 
            style={{ background: '#fff' }}
          >
            <ManagementSidebar />
          </Layout.Sider>
        )}
        
        {/* Main Content */}
        <Layout.Content style={{ 
          minHeight: 280,
          padding: isMobile ? '12px' : '16px 24px',
        }}>

        {/* Table section with search and statistics */}
        <Card bordered={false}>
          {/* Statistics Row */}
          <div style={{ marginBottom: 20 }}>
            <Row gutter={[16, 16]}>
              {/* Total Submissions */}
              <Col xs={24} sm={8}>
                <Card 
                  size="small" 
                  className="stat-card"
                  style={{ 
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: '100%' 
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: '14px' }}>Total Submissions</span>}
                    value={submissions.length}
                    valueStyle={{ color: '#1890ff', fontSize: isMobile ? '24px' : '28px' }}
                  />
                </Card>
              </Col>
              
              {/* Contact Forms */}
              <Col xs={12} sm={8}>
                <Card 
                  size="small" 
                  className="stat-card"
                  style={{ 
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: '100%' 
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: '14px' }}>Contact Forms</span>}
                    value={getContactFormCount()}
                    valueStyle={{ color: '#13c2c2', fontSize: isMobile ? '22px' : '28px' }}
                    suffix={
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        ({Math.round((getContactFormCount() / (submissions.length || 1)) * 100)}%)
                      </span>
                    }
                  />
                </Card>
              </Col>
              
              {/* Feedback Submissions */}
              <Col xs={12} sm={8}>
                <Card 
                  size="small" 
                  className="stat-card"
                  style={{ 
                    textAlign: 'center',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                    height: '100%' 
                  }}
                >
                  <Statistic
                    title={<span style={{ fontSize: '14px' }}>Feedback Submissions</span>}
                    value={getFeedbackCount()}
                    valueStyle={{ color: '#722ed1', fontSize: isMobile ? '22px' : '28px' }}
                    suffix={
                      <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        ({Math.round((getFeedbackCount() / (submissions.length || 1)) * 100)}%)
                      </span>
                    }
                  />
                </Card>
              </Col>
            </Row>
          </div>
          
          {/* Search Row */}
          <div style={{ marginBottom: 16 }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={16}>
                <Input 
                  placeholder={isMobile ? "Search submissions..." : "Search by name, subject, message content, or type"} 
                  value={searchText}
                  onChange={e => {
                    setSearchText(e.target.value);
                  }}
                  onPressEnter={() => {
                    // Force a re-render
                    setSubmissions([...submissions]);
                  }}
                  prefix={<SearchOutlined />}
                  allowClear
                  size={isMobile ? "middle" : "large"}
                  style={{ width: '100%' }}
                />
              </Col>
              
              <Col xs={24} md={8}>
                <div style={{ display: 'flex', justifyContent: isMobile ? 'flex-start' : 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                  <Button 
                    onClick={() => {
                      resetSearch();
                      // Force a re-render
                      setSubmissions([...submissions]);
                    }}
                    icon={<ReloadOutlined />}
                    style={{ marginRight: 10, marginBottom: isMobile ? 8 : 0 }}
                  >
                    Clear
                  </Button>
                  
                  <Text type="secondary">
                    {getFilteredSubmissions().length} of {submissions.length} submissions
                  </Text>
                </div>
              </Col>
            </Row>
          </div>

          {loading ? (
            renderSkeleton()
          ) : (
            <>
              {/* Display search text */}
              {searchText.trim() && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: '8px 12px', 
                  background: '#f0f8ff', 
                  borderRadius: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <Text strong>
                    <SearchOutlined style={{ marginRight: 8 }} />
                    Search results for: "{searchText}"
                  </Text>
                  
                  <Button 
                    type="text" 
                    size="small" 
                    onClick={() => {
                      resetSearch();
                      setSubmissions([...submissions]);
                    }}
                    icon={<ReloadOutlined />}
                  >
                    Clear
                  </Button>
                </div>
              )}
              
              {/* Switch between table and card view based on screen size */}
              {isMobile ? (
                renderMobileCardView()
              ) : (
                <Table 
                  columns={columns} 
                  dataSource={getFilteredSubmissions()} 
                  rowKey="id"
                  pagination={{ 
                    pageSize: 10,
                    showSizeChanger: true,
                    pageSizeOptions: ['10', '20', '50', '100']
                  }}
                  scroll={{ x: 900 }}
                  size="middle"
                />
              )}
            </>
          )}
        </Card>
  
          {/* Submission detail modal */}
          <Modal
            title={
              <div>
                {currentSubmission.formType === 'feedback' ? (
                  <Text strong style={{ fontSize: 18 }}>Induction Feedback Details</Text> 
                  ) : (
                  <Text strong style={{ fontSize: 18 }}>Submission Details</Text> 
                )}
              </div>
            }
            open={modalVisible}
            onCancel={() => setModalVisible(false)}
            footer={[
              <Button 
                key="close" 
                onClick={() => setModalVisible(false)}
              >
                Close
              </Button>,
              <Button 
                key="reply" 
                type="primary"
                icon={<MailOutlined />}
                onClick={() => currentSubmission && window.open(`mailto:${currentSubmission.email}?subject=Re: ${currentSubmission.subject}`)}
              >
                Reply via Email
              </Button>
            ]}
            width={isMobile ? '95%' : 700}
            destroyOnClose={true}
          >
            {currentSubmission && (
              <div>
                <Row gutter={[16, 8]}>
                  <Col xs={24} md={12}>
                    <Text type="secondary">From:</Text>
                    <Paragraph>
                      <Text strong>{currentSubmission.fullName}</Text>{' '}
                      {(currentSubmission.isLoggedIn || currentSubmission.userId) && <Tag color="blue">Staff</Tag>}
                      <br />
                      <a href={`mailto:${currentSubmission.email}`}>{currentSubmission.email}</a>
                    </Paragraph>

                    {/* View staff profile button if it was a staff submission */}
                    {currentSubmission.userId && (
                      <div>
                        <Button
                          type="link"
                          size="small"
                          style={{ padding: 4, height: 'auto', fontSize: 12, outline: 'solid 1px #d9d9d9' }}
                          onClick={() => handleViewUser(currentSubmission.userId)}
                        >
                          <UserOutlined style={{ marginRight: 4 }} />
                          View staff profile
                        </Button>
                      </div>
                    )}
                  </Col>
                  
                  <Col xs={24} md={12}>
                    <Text type="secondary">Submitted on:</Text>
                    <Paragraph>{moment(currentSubmission.createdAt).format('MMMM D, YYYY h:mm A')}</Paragraph>
                    <Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Submission ID: {currentSubmission.id}
                      </Text>
                    </Paragraph>
                  </Col>
                </Row>
  
                <Divider style={{ margin: '16px 0' }} />
  
                <div>
                  <Text type="secondary">Subject:</Text>
                  <Paragraph>
                    <Text strong>{currentSubmission.subject}</Text>
                  </Paragraph>
                </div>
  
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Message:</Text>
                  <div style={{ 
                    marginTop: 8, 
                    padding: 16, 
                    background: '#f9f9f9', 
                    border: '1px solid #eee',
                    borderRadius: 4,
                    whiteSpace: 'pre-line',
                    maxHeight: isMobile ? '150px' : '300px',
                    overflow: 'auto'
                  }}>
                    {currentSubmission.message}
                  </div>
                </div>
  
                <div style={{ marginTop: 16 }}>
                  <Text type="secondary">Routing:</Text>
                  <Paragraph>
                    {currentSubmission.contactType ? (
                      <>
                        Routed to {departmentMap[currentSubmission.contactType] || currentSubmission.contactType} department
                        {currentSubmission.forceMainContact && <Tag color="orange" style={{ marginLeft: 8 }}>Manual Override</Tag>}
                      </>
                    ) : (
                      <>Sent to main contact email</>
                    )}
                  </Paragraph>
                </div>
  
                {/* Delete submission button (only visible to admin) */}
                {isAdmin && (
                  <div style={{ textAlign: 'left', marginTop: 16 }}>
                    <Text type="secondary">Delete Submission:</Text>
                    <br />
                    <Popconfirm
                      title="Are you sure you want to DELETE this submission?"
                      description="This action cannot be undone."
                      onConfirm={() => handleDeleteSubmission(currentSubmission.id)}
                      okText="Yes, Delete"
                      cancelText="Cancel"
                      okButtonProps={{ danger: true }}
                    >
                      <Button danger icon={<DeleteOutlined />}>Delete Submission</Button>
                    </Popconfirm>
                  </div>
                )}
              </div>
            )}
          </Modal>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}

export default ContactSubmissions;