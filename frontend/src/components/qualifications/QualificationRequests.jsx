import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Tag,
  Popconfirm,
  Tooltip,
  Empty
} from 'antd';
import { 
  PlusOutlined, 
  SendOutlined, 
  ReloadOutlined, 
  DeleteOutlined,
  UserOutlined,
  CalendarOutlined 
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import { 
  getQualificationRequests, 
  requestQualificationFromUser 
} from '../../api/UserQualificationApi';
import { getAllUsers } from '../../api/UserApi';
import { formatDate } from '../../utils/dateUtils';
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notificationService';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

// Common qualification types for requests
const QUALIFICATION_TYPES = [
  'Duty Manager Certificate',
  'First Aid Certificate',
  'Food Safety Certificate',
  'Health and Safety Certificate',
  'Security Certificate',
  'Driver License',
  'Passport',
  'Work Visa',
  'Other'
];

const QualificationRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  // Fetch requests and users
  const fetchRequests = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await getQualificationRequests(user);
      setRequests(response.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      notifyError('Failed to load requests', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!user) return;
    
    try {
      const usersData = await getAllUsers(user);
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
}
  };

  useEffect(() => {
    fetchRequests();
    fetchUsers();
  }, [user]);

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
      await fetchRequests();
    } catch (error) {
      console.error('Error sending request:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // Get status tag for request
  const getStatusTag = (status) => {
    const statusConfig = {
      pending: { color: 'orange', text: 'Pending' },
      completed: { color: 'green', text: 'Completed' },
      ignored: { color: 'red', text: 'Ignored' }
    };
    
    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Check if request is overdue
  const isRequestOverdue = (request) => {
    if (!request.dueDate || request.status !== 'pending') return false;
    return new Date(request.dueDate) < new Date();
  };

  // Table columns
  const columns = [
    {
      title: 'Requested User',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.userDisplayName}</div>
          <div className="text-xs text-gray-500">{record.userEmail}</div>
        </div>
      ),
      sorter: (a, b) => (a.userDisplayName || '').localeCompare(b.userDisplayName || ''),
    },
    {
      title: 'Qualification Type',
      dataIndex: 'qualificationType',
      key: 'qualificationType',
      width: 180,
      render: (type) => (
        <Tag color="blue">{type}</Tag>
      ),
      sorter: (a, b) => (a.qualificationType || '').localeCompare(b.qualificationType || ''),
    },
    {
      title: 'Requested By',
      key: 'requester',
      width: 150,
      render: (_, record) => (
        <div>
          <div className="text-sm">{record.requesterDisplayName}</div>
          <div className="text-xs text-gray-500">{record.requesterEmail}</div>
        </div>
      ),
      sorter: (a, b) => (a.requesterDisplayName || '').localeCompare(b.requesterDisplayName || ''),
    },
    {
      title: 'Message',
      dataIndex: 'message',
      key: 'message',
      width: 250,
      render: (message) => (
        <span className="text-sm" title={message}>
          {message && message.length > 50 ? `${message.substring(0, 50)}...` : message}
        </span>
      ),
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 120,
      render: (date, record) => {
        if (!date) return <span className="text-gray-500">No deadline</span>;
        
        const isOverdue = isRequestOverdue(record);
        return (
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            {formatDate(date)}
            {isOverdue && <div className="text-xs text-red-600">Overdue</div>}
          </span>
        );
      },
      sorter: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      },
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => getStatusTag(status),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Completed', value: 'completed' },
        { text: 'Ignored', value: 'ignored' }
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Requested',
      dataIndex: 'requestedAt',
      key: 'requestedAt',
      width: 120,
      render: (date) => (
        <span className="text-sm">{formatDate(date)}</span>
      ),
      sorter: (a, b) => new Date(a.requestedAt) - new Date(b.requestedAt),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <Popconfirm
              title="Cancel Request"
              description="Are you sure you want to cancel this request?"
              onConfirm={() => handleCancelRequest(record)}
              okText="Cancel Request"
              cancelText="Keep Request"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Cancel request">
                <Button 
                  size="small" 
                  danger 
                  icon={<DeleteOutlined />}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Handle cancel request
  const handleCancelRequest = async (request) => {
    notifyError('Feature not implemented', 'Request cancellation will be available in a future update');
  };

  // Get filtered users (exclude those who already have pending requests for the same type)
  const getAvailableUsers = (qualificationType) => {
    if (!qualificationType) return users;
    
    const pendingRequestUserIds = requests
      .filter(req => req.status === 'pending' && req.qualificationType === qualificationType)
      .map(req => req.userId);
    
    return users.filter(user => !pendingRequestUserIds.includes(user.uid));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Qualification Requests</h3>
          <p className="text-gray-600 text-sm">Request specific qualifications from staff members</p>
        </div>
        <Space>
          <Button 
            onClick={fetchRequests} 
            icon={<ReloadOutlined />}
            loading={loading}
          >
            Refresh
          </Button>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => setRequestModalOpen(true)}
          >
            New Request
          </Button>
        </Space>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
          <div className="text-orange-800 font-semibold">
            {requests.filter(r => r.status === 'pending').length} Pending
          </div>
          <div className="text-orange-600 text-sm">Awaiting response</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="text-green-800 font-semibold">
            {requests.filter(r => r.status === 'completed').length} Completed
          </div>
          <div className="text-green-600 text-sm">Successfully submitted</div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="text-red-800 font-semibold">
            {requests.filter(r => isRequestOverdue(r)).length} Overdue
          </div>
          <div className="text-red-600 text-sm">Past due date</div>
        </div>
      </div>

      {/* Requests Table */}
      <Table
        dataSource={requests}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 15,
          showSizeChanger: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} requests`,
        }}
        scroll={{ x: 1000 }}
        size="small"
        className="bg-white shadow-sm rounded-lg"
        locale={{
          emptyText: (
            <Empty 
              description="No qualification requests yet"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            >
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => setRequestModalOpen(true)}
              >
                Send First Request
              </Button>
            </Empty>
          )
        }}
      />

      {/* New Request Modal */}
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
            >
              {QUALIFICATION_TYPES.map(type => (
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
              {getAvailableUsers(form.getFieldValue('qualificationType')).map(user => (
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

export default QualificationRequests;