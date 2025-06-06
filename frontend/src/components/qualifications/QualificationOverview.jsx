import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Progress, 
  Row, 
  Col,
  List,
  Avatar,
  Empty,
  Tooltip,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Spin
} from 'antd';
import { 
  ReloadOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  TrophyOutlined,
  SendOutlined,
  PlusOutlined
} from '@ant-design/icons';
import QualificationStatusTag from './QualificationStatusTag';
import { formatDate } from '../../utils/dateUtils';
import { requestQualificationFromUser } from '../../api/UserQualificationApi';
import { getAllUsers } from '../../api/UserApi';
import { getAllCertificateTypes } from '../../api/CertificateTypeApi'; // New import
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notificationService';
import useAuth from '../../hooks/useAuth';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

const QualificationOverview = ({ qualifications, stats, onRefresh }) => {
  const { user } = useAuth();
  const [expiringQualifications, setExpiringQualifications] = useState([]);
  const [expiredQualifications, setExpiredQualifications] = useState([]);
  const [qualificationTypes, setQualificationTypes] = useState([]);
  const [userStats, setUserStats] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [users, setUsers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [certificateTypes, setCertificateTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(false);

  // Fetch certificate types from database
  const fetchCertificateTypes = async () => {
    setLoadingTypes(true);
    try {
      const types = await getAllCertificateTypes();
      const sortedTypes = types
        .map(type => type.name)
        .sort()
        .concat(['Other']);
      setCertificateTypes(sortedTypes);
    } catch (error) {
      console.error('Error fetching certificate types:', error);
      // Fallback to basic types if database fetch fails
      setCertificateTypes([
        'Duty Manager Certificate',
        'First Aid Certificate',
        'Food Safety Certificate',
        'Health and Safety Certificate',
        'Security Certificate',
        'Driver License',
        'Passport',
        'Work Visa',
        'Other'
      ]);
    } finally {
      setLoadingTypes(false);
    }
  };

  useEffect(() => {
    if (!qualifications) return;

    const now = new Date();
    const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));

    // Filter expired qualifications
    const expired = qualifications.filter(qual => 
      qual.expiryDate && new Date(qual.expiryDate) < now
    ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    // Filter expiring qualifications
    const expiring = qualifications.filter(qual => 
      qual.expiryDate && 
      new Date(qual.expiryDate) >= now && 
      new Date(qual.expiryDate) < twoMonths
    ).sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    setExpiredQualifications(expired);
    setExpiringQualifications(expiring);

    // Calculate qualification types distribution
    const typeCounts = {};
    qualifications.forEach(qual => {
      const type = qual.qualificationType || 'Unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const typeData = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count, percentage: (count / qualifications.length * 100).toFixed(1) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 types

    setQualificationTypes(typeData);

    // Calculate user statistics
    const userQualCounts = {};
    qualifications.forEach(qual => {
      const userId = qual.userId;
      const userName = qual.userDisplayName || 'Unknown User';
      const userEmail = qual.userEmail || 'Unknown';
      
      if (!userQualCounts[userId]) {
        userQualCounts[userId] = {
          userId,
          userName,
          userEmail,
          total: 0,
          active: 0,
          expired: 0,
          expiring: 0
        };
      }
      
      userQualCounts[userId].total++;
      
      if (qual.expiryDate) {
        const expiryDate = new Date(qual.expiryDate);
        if (expiryDate < now) {
          userQualCounts[userId].expired++;
        } else if (expiryDate < twoMonths) {
          userQualCounts[userId].expiring++;
        } else {
          userQualCounts[userId].active++;
        }
      } else {
        userQualCounts[userId].active++;
      }
    });

    const userData = Object.values(userQualCounts)
      .sort((a, b) => (b.expired + b.expiring) - (a.expired + a.expiring))
      .slice(0, 10); // Top 10 users with most urgent qualifications

    setUserStats(userData);
  }, [qualifications]);

  // Fetch users when modal opens
  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      const usersData = await getAllUsers(user);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      notifyError('Failed to load users', 'Please try again later');
    }
  };

  const handleOpenRequestModal = () => {
    setRequestModalOpen(true);
    fetchUsers();
    fetchCertificateTypes(); // Fetch certificate types when modal opens
  };

  // Handle send request
  const handleSendRequest = async (values) => {
    setSubmitting(true);
    try {
      const requestData = {
        userId: values.userId,
        qualificationType: values.qualificationType,
        message: values.message,
        dueDate: values.dueDate ? values.dueDate.toISOString() : null
      };
      
      const sendPromise = requestQualificationFromUser(user, requestData);
      
      notifyPromise(sendPromise, {
        pending: 'Sending qualification request...',
        success: 'Request sent successfully!',
        error: 'Failed to send request'
      });
      
      await sendPromise;
      form.resetFields();
      setRequestModalOpen(false);
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const urgentColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.userDisplayName}</div>
          <div className="text-xs text-gray-500">{record.userEmail}</div>
        </div>
      ),
    },
    {
      title: 'Qualification',
      key: 'qualification',
      render: (_, record) => (
        <div>
          <div className="font-medium">{record.qualificationName}</div>
          <div className="text-xs text-gray-500">{record.qualificationType}</div>
        </div>
      ),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      render: (date) => (
        <span className="text-red-600 font-medium">
          {formatDate(date)}
        </span>
      ),
      sorter: (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate),
    },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <QualificationStatusTag 
          status={record.status} 
          expiryDate={record.expiryDate} 
        />
      ),
    },
    {
      title: 'Days Overdue',
      key: 'daysOverdue',
      render: (_, record) => {
        if (!record.expiryDate) return '-';
        const now = new Date();
        const expiry = new Date(record.expiryDate);
        const diffTime = now - expiry;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
          return <Tag color="red">{diffDays} days</Tag>;
        } else {
          return <Tag color="orange">{Math.abs(diffDays)} days left</Tag>;
        }
      },
      sorter: (a, b) => {
        const getDaysOverdue = (record) => {
          if (!record.expiryDate) return -999;
          const now = new Date();
          const expiry = new Date(record.expiryDate);
          return Math.ceil((now - expiry) / (1000 * 60 * 60 * 24));
        };
        return getDaysOverdue(b) - getDaysOverdue(a);
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Qualification Overview</h3>
        <Space>
          <Button 
            type="primary"
            icon={<PlusOutlined />} 
            onClick={handleOpenRequestModal}
          >
            Request Qualification
          </Button>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={onRefresh}
          >
            Refresh Data
          </Button>
        </Space>
      </div>

      {/* Quick Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
              <div className="text-gray-600">Expired</div>
              <CloseCircleOutlined className="text-red-600 text-xl mt-2" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
              <div className="text-gray-600">Expiring Soon</div>
              <WarningOutlined className="text-orange-600 text-xl mt-2" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-gray-600">Total Qualifications</div>
              <TrophyOutlined className="text-blue-600 text-xl mt-2" />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.users}</div>
              <div className="text-gray-600">Staff Members</div>
              <UserOutlined className="text-purple-600 text-xl mt-2" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Urgent Qualifications Table */}
      <Card 
        title={
          <span>
            <CloseCircleOutlined className="text-red-600 mr-2" />
            Urgent: Expired & Expiring Qualifications
          </span>
        }
      >
        {[...expiredQualifications, ...expiringQualifications].length === 0 ? (
          <Empty 
            description="No urgent qualifications to review" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            dataSource={[...expiredQualifications, ...expiringQualifications]}
            columns={urgentColumns}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
            scroll={{ x: 800 }}
          />
        )}
      </Card>

      <Row gutter={[16, 16]}>
        {/* Qualification Types Distribution */}
        <Col xs={24} lg={12}>
          <Card title="Qualification Types Distribution">
            {qualificationTypes.length === 0 ? (
              <Empty description="No qualification data available" />
            ) : (
              <div className="space-y-3">
                {qualificationTypes.map((type, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{type.type}</span>
                      <span className="text-sm text-gray-500">
                        {type.count} ({type.percentage}%)
                      </span>
                    </div>
                    <Progress 
                      percent={parseFloat(type.percentage)} 
                      showInfo={false}
                      size="small"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </Col>

        {/* Users with Most Urgent Qualifications */}
        <Col xs={24} lg={12}>
          <Card title="Staff Requiring Attention">
            {userStats.length === 0 ? (
              <Empty description="No users need attention" />
            ) : (
              <List
                dataSource={userStats.filter(user => user.expired > 0 || user.expiring > 0)}
                pagination={{
                  pageSize: 5,
                  size: 'small',
                  showSizeChanger: false,
                  showQuickJumper: false,
                  showTotal: (total, range) => 
                    `${range[0]}-${range[1]} of ${total} staff members`,
                }}
                renderItem={(user) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<Avatar icon={<UserOutlined />} />}
                      title={
                        <div>
                          <span className="font-medium">{user.userName}</span>
                          <div className="text-xs text-gray-500">{user.userEmail}</div>
                        </div>
                      }
                      description={
                        <Space>
                          <Tooltip title="Total qualifications">
                            <Tag color="blue">{user.total} total</Tag>
                          </Tooltip>
                          {user.expired > 0 && (
                            <Tooltip title="Expired qualifications">
                              <Tag color="red">{user.expired} expired</Tag>
                            </Tooltip>
                          )}
                          {user.expiring > 0 && (
                            <Tooltip title="Expiring soon">
                              <Tag color="orange">{user.expiring} expiring</Tag>
                            </Tooltip>
                          )}
                        </Space>
                      }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Request Qualification Modal */}
      <Modal
        title="Request Qualification from User"
        open={requestModalOpen}
        onCancel={() => {
          setRequestModalOpen(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSendRequest}
          requiredMark="optional"
        >
          <Form.Item
            name="qualificationType"
            label="Qualification Type"
            rules={[{ required: true, message: 'Please select the qualification type' }]}
          >
            <Select 
              placeholder="Select qualification type"
              showSearch
              optionFilterProp="children"
              loading={loadingTypes}
              notFoundContent={loadingTypes ? <Spin size="small" /> : 'No types found'}
            >
              {certificateTypes.map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="userId"
            label="Request From User"
            rules={[{ required: true, message: 'Please select a user' }]}
          >
            <Select 
              placeholder="Select user"
              showSearch
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {users.map(user => (
                <Option key={user.uid} value={user.uid}>
                  <div>
                    <div>{user.firstName} {user.lastName}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true, message: 'Please enter a message' }]}
            initialValue="Kia ora, Could you please upload your qualification/certificate to our induction portal? This helps us with compliance, tracking and expiry notification. Thank you"
          >
            <TextArea 
              placeholder="Please upload your qualification certificate..."
              rows={3}
              maxLength={500}
              showCount
            />
          </Form.Item>

          <Form.Item
            name="dueDate"
            label="Due Date (Optional)"
          >
            <DatePicker 
              placeholder="Select due date"
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().endOf('day')}
            />
          </Form.Item>

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setRequestModalOpen(false);
                form.resetFields();
              }}>
                Cancel
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={submitting}
                icon={<SendOutlined />}
              >
                Send Request
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QualificationOverview;