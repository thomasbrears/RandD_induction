import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Space, 
  Input, 
  Select, 
  Popconfirm,
  Tooltip,
  Modal,
  List,
  Avatar
} from 'antd';
import { 
  FilterOutlined, 
  EyeOutlined, 
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  ExportOutlined,
  EditOutlined,
  UserAddOutlined,
  UserOutlined
} from '@ant-design/icons';
import QualificationStatusTag from '../qualifications/QualificationStatusTag';
import QualificationViewModal from '../qualifications/QualificationViewModal';
import QualificationModal from '../qualifications/QualificationModal';
import useAuth from '../../hooks/useAuth';
import { deleteUserQualification, updateUserQualification, uploadUserQualification } from '../../api/UserQualificationApi';
import { getAllUsers } from '../../api/UserApi';
import { downloadFile } from '../../api/FileApi';
import { formatDate } from '../../utils/dateUtils';
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notificationService';

const { Search } = Input;
const { Option } = Select;

const QualificationManagement = ({ qualifications = [], onRefresh }) => {
  const { user } = useAuth();
  const [filteredQualifications, setFilteredQualifications] = useState([]);
  const [selectedQualification, setSelectedQualification] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQualification, setEditQualification] = useState(null);
  const [addForUserModalOpen, setAddForUserModalOpen] = useState(false);
  const [userSelectionModalOpen, setUserSelectionModalOpen] = useState(false);
  const [selectedUserForAdd, setSelectedUserForAdd] = useState(null);
  const [users, setUsers] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');

  // Update filtered qualifications when qualifications prop changes
  useEffect(() => {
    setFilteredQualifications(qualifications);
  }, [qualifications]);

  // Apply filters
  useEffect(() => {
    let filtered = [...qualifications];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(qual => 
        qual.qualificationName?.toLowerCase().includes(term) ||
        qual.qualificationType?.toLowerCase().includes(term) ||
        qual.issuer?.toLowerCase().includes(term) ||
        qual.userDisplayName?.toLowerCase().includes(term) ||
        qual.userEmail?.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(qual => {
        const now = new Date();
        const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
        
        if (statusFilter === 'expired') {
          return qual.expiryDate && new Date(qual.expiryDate) < now;
        } else if (statusFilter === 'expiring_soon') {
          return qual.expiryDate && 
                 new Date(qual.expiryDate) >= now && 
                 new Date(qual.expiryDate) < twoMonths;
        } else if (statusFilter === 'active') {
          return !qual.expiryDate || new Date(qual.expiryDate) >= now;
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(qual => qual.qualificationType === typeFilter);
    }

    // User filter
    if (userFilter !== 'all') {
      filtered = filtered.filter(qual => qual.userId === userFilter);
    }

    setFilteredQualifications(filtered);
  }, [qualifications, searchTerm, statusFilter, typeFilter, userFilter]);

  // Fetch users when needed
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

  // Get unique values for filters
  const getUniqueTypes = () => {
    const types = [...new Set(qualifications.map(qual => qual.qualificationType))].filter(Boolean);
    return types.sort();
  };

  const getUniqueUsers = () => {
    const userMap = new Map();
    qualifications.forEach(qual => {
      if (qual.userId && !userMap.has(qual.userId)) {
        userMap.set(qual.userId, {
          userId: qual.userId,
          displayName: qual.userDisplayName || 'Unknown User',
          email: qual.userEmail || 'Unknown'
        });
      }
    });
    return Array.from(userMap.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  };

  // Handle view qualification
  const handleViewQualification = (qualification) => {
    setSelectedQualification(qualification);
    setViewModalOpen(true);
  };

  // Handle edit qualification
  const handleEditQualification = (qualification) => {
    setViewModalOpen(false); // Close view modal if open
    setEditQualification(qualification); // Set separate edit state
    setEditModalOpen(true); // Open immediately
  };

  // Handle edit submission
  const handleEditSubmission = async (qualificationData, file) => {
    if (!editQualification) return;
    
    setModalLoading(true);
    try {
      const updatePromise = updateUserQualification(user, editQualification.id, qualificationData, file);
      
      notifyPromise(updatePromise, {
        pending: 'Updating qualification...',
        success: 'Qualification updated successfully!',
        error: 'Failed to update qualification'
      });
      
      await updatePromise;
      if (onRefresh) onRefresh(); // Refresh the data
      setEditModalOpen(false);
      setEditQualification(null); // Clear edit state
    } catch (error) {
      console.error('Error updating qualification:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle user selection for adding qualification
  const handleOpenUserSelectionModal = () => {
    setUserSelectionModalOpen(true);
    fetchUsers();
  };

  const handleUserSelected = (selectedUser) => {
    setSelectedUserForAdd(selectedUser);
    setUserSelectionModalOpen(false);
    setAddForUserModalOpen(true);
  };

  // Handle add qualification for user
  const handleAddQualificationForUser = async (qualificationData, file) => {
    if (!selectedUserForAdd) return;
    
    setModalLoading(true);
    try {
      const dataToSubmit = {
        ...qualificationData,
        userId: selectedUserForAdd.uid
      };
      
      const addPromise = uploadUserQualification(user, file, dataToSubmit);
      
      notifyPromise(addPromise, {
        pending: 'Adding qualification...',
        success: 'Qualification added successfully!',
        error: 'Failed to add qualification'
      });
      
      await addPromise;
      setAddForUserModalOpen(false);
      setSelectedUserForAdd(null);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error adding qualification for user:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle download qualification
  const handleDownloadQualification = async (qualification) => {
    try {
      const file = await downloadFile(user, qualification.gcsFileName);
      
      // Create download link
      const url = window.URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = qualification.fileName || 'qualification.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      notifySuccess('File downloaded successfully');
    } catch (error) {
      console.error('Error downloading file:', error);
      notifyError('Failed to download file', 'Please try again later');
    }
  };

  // Handle delete qualification
  const handleDeleteQualification = async (qualification) => {
    try {
      const deletePromise = deleteUserQualification(user, qualification.id);
      
      notifyPromise(deletePromise, {
        pending: 'Deleting qualification...',
        success: 'Qualification deleted successfully!',
        error: 'Failed to delete qualification'
      });
      
      await deletePromise;
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error deleting qualification:', error);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setTypeFilter('all');
    setUserFilter('all');
  };

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'User Name',
      'User Email',
      'Qualification Name',
      'Type',
      'Issuer',
      'Issue Date',
      'Expiry Date',
      'Status',
      'Uploaded Date'
    ];

    const csvData = filteredQualifications.map(qual => [
      qual.userDisplayName || '',
      qual.userEmail || '',
      qual.qualificationName || '',
      qual.qualificationType || '',
      qual.issuer || '',
      qual.issueDate ? formatDate(qual.issueDate) : '',
      qual.expiryDate ? formatDate(qual.expiryDate) : '',
      qual.status || 'active',
      qual.uploadedAt ? formatDate(qual.uploadedAt) : ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qualifications-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    notifySuccess('Qualifications exported to CSV');
  };

  // Table columns
  const columns = [
    {
      title: 'User',
      key: 'user',
      width: 200,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.userDisplayName}</div>
          <div className="text-xs text-gray-500 truncate">{record.userEmail}</div>
        </div>
      ),
      sorter: (a, b) => (a.userDisplayName || '').localeCompare(b.userDisplayName || ''),
    },
    {
      title: 'Qualification',
      key: 'qualification',
      width: 250,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm" title={record.qualificationName}>
            {record.qualificationName}
          </div>
          <div className="text-xs text-gray-500">{record.qualificationType}</div>
        </div>
      ),
      sorter: (a, b) => (a.qualificationName || '').localeCompare(b.qualificationName || ''),
    },
    {
      title: 'Issuer',
      dataIndex: 'issuer',
      key: 'issuer',
      width: 150,
      render: (issuer) => (
        <span className="text-sm" title={issuer}>
          {issuer || 'Not specified'}
        </span>
      ),
      sorter: (a, b) => (a.issuer || '').localeCompare(b.issuer || ''),
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      key: 'expiryDate',
      width: 120,
      render: (date) => {
        if (!date) return <span className="text-gray-500">No expiry</span>;
        
        const now = new Date();
        const expiry = new Date(date);
        const isExpired = expiry < now;
        const isExpiringSoon = expiry < new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
        
        return (
          <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
            {formatDate(date)}
          </span>
        );
      },
      sorter: (a, b) => {
        if (!a.expiryDate && !b.expiryDate) return 0;
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate) - new Date(b.expiryDate);
      },
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_, record) => (
        <QualificationStatusTag 
          status={record.status} 
          expiryDate={record.expiryDate} 
        />
      ),
      filters: [
        { text: 'Active', value: 'active' },
        { text: 'Expiring Soon', value: 'expiring_soon' },
        { text: 'Expired', value: 'expired' }
      ],
      onFilter: (value, record) => {
        const now = new Date();
        const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
        
        if (value === 'expired') {
          return record.expiryDate && new Date(record.expiryDate) < now;
        } else if (value === 'expiring_soon') {
          return record.expiryDate && 
                 new Date(record.expiryDate) >= now && 
                 new Date(record.expiryDate) < twoMonths;
        } else if (value === 'active') {
          return !record.expiryDate || new Date(record.expiryDate) >= now;
        }
        return true;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View details">
            <Button 
              size="small" 
              icon={<EyeOutlined />} 
              onClick={() => handleViewQualification(record)}
            />
          </Tooltip>

          <Tooltip title="Edit qualification">
            <Button 
              size="small" 
              icon={<EditOutlined />} 
              onClick={() => handleEditQualification(record)}
            />
          </Tooltip>
          
          <Tooltip title="Download file">
            <Button 
              size="small" 
              icon={<DownloadOutlined />} 
              onClick={() => handleDownloadQualification(record)}
            />
          </Tooltip>
          
          <Popconfirm
            title="Delete Qualification"
            description="Are you sure you want to delete this qualification? This action cannot be undone."
            onConfirm={() => handleDeleteQualification(record)}
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete qualification">
              <Button 
                size="small" 
                danger 
                icon={<DeleteOutlined />}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search</label>
            <Search
              placeholder="Search qualifications, users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Statuses</Option>
              <Option value="active">Active</Option>
              <Option value="expiring_soon">Expiring Soon</Option>
              <Option value="expired">Expired</Option>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Types</Option>
              {getUniqueTypes().map(type => (
                <Option key={type} value={type}>{type}</Option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">User</label>
            <Select
              value={userFilter}
              onChange={setUserFilter}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="children"
            >
              <Option value="all">All Users</Option>
              {getUniqueUsers().map(user => (
                <Option key={user.userId} value={user.userId}>
                  {user.displayName}
                </Option>
              ))}
            </Select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Showing {filteredQualifications.length} of {qualifications.length} qualifications
          </span>
          <Space>
            <Button 
              type="primary"
              icon={<UserAddOutlined />} 
              onClick={handleOpenUserSelectionModal}
            >
              Add on Behalf
            </Button>
            <Button onClick={resetFilters} icon={<FilterOutlined />}>
              Clear Filters
            </Button>
            <Button onClick={exportToCSV} icon={<ExportOutlined />}>
              Export CSV
            </Button>
            <Button 
              onClick={onRefresh} 
              icon={<ReloadOutlined />}
            >
              Refresh
            </Button>
          </Space>
        </div>
      </div>

      {/* Table */}
      <Table
        dataSource={filteredQualifications}
        columns={columns}
        rowKey="id"
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} of ${total} qualifications`,
        }}
        scroll={{ x: 1200 }}
        size="small"
        className="bg-white shadow-sm rounded-lg"
      />

      {/* User Selection Modal */}
      <Modal
        title="Select User to Add Qualification For"
        open={userSelectionModalOpen}
        onCancel={() => setUserSelectionModalOpen(false)}
        footer={null}
        width={600}
        destroyOnClose
      >
        <div className="mb-4">
          <Input.Search
            placeholder="Search users by name or email..."
            style={{ marginBottom: 16 }}
          />
        </div>
        
        <List
          dataSource={users}
          pagination={{
            pageSize: 8,
            size: 'small',
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} users`,
          }}
          renderItem={(user) => (
            <List.Item
              actions={[
                <Button 
                  type="primary" 
                  size="small"
                  onClick={() => handleUserSelected(user)}
                >
                  Select
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={`${user.firstName} ${user.lastName}`}
                description={user.email}
              />
            </List.Item>
          )}
        />
      </Modal>

      {/* Add Qualification for User Modal */}
      <QualificationModal
        open={addForUserModalOpen}
        onClose={() => {
          setAddForUserModalOpen(false);
          setSelectedUserForAdd(null);
        }}
        onSubmit={handleAddQualificationForUser}
        qualification={selectedUserForAdd ? {
          userDisplayName: `${selectedUserForAdd.firstName} ${selectedUserForAdd.lastName}`,
          userEmail: selectedUserForAdd.email
        } : null}
        loading={modalLoading}
        title={`Add Qualification for ${selectedUserForAdd ? `${selectedUserForAdd.firstName} ${selectedUserForAdd.lastName}` : 'User'}`}
      />

      {/* View Qualification Modal */}
      <QualificationViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedQualification(null);
        }}
        qualification={selectedQualification}
        onEdit={handleEditQualification}
        onDelete={handleDeleteQualification}
        onDownload={handleDownloadQualification}
        showActions={true}
      />

      {/* Edit Qualification Modal */}
      <QualificationModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditQualification(null);
        }}
        onSubmit={handleEditSubmission}
        qualification={editQualification}
        loading={modalLoading}
        title="Edit User Qualification"
      />
    </div>
  );
};

export default QualificationManagement;