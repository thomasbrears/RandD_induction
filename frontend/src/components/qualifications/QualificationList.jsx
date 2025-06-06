import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Empty, 
  Space, 
  Select, 
  Input, 
  Alert,
  Row,
  Col,
  Modal,
  message,
  Skeleton 
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FilterOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import QualificationCard from './QualificationCard';
import QualificationModal from './QualificationModal';
import QualificationViewModal from './QualificationViewModal';
import useAuth from '../../hooks/useAuth';
import { 
  getUserQualifications, 
  uploadUserQualification, 
  updateUserQualification, 
  deleteUserQualification 
} from '../../api/UserQualificationApi';
import { downloadFile } from '../../api/FileApi';
import { notifySuccess, notifyError, notifyPromise } from '../../utils/notificationService';
import { downloadViaUrl, triggerFileDownload } from '../../api/FileApi';

const { Option } = Select;
const { Search } = Input;

const QualificationList = ({ userId = null, showUserInfo = false, title = "My Qualifications" }) => {
  const { user } = useAuth();
  const [qualifications, setQualifications] = useState([]);
  const [filteredQualifications, setFilteredQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalLoading, setModalLoading] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedQualification, setSelectedQualification] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Get target user ID (either passed prop or current user)
  const targetUserId = userId || user?.uid;

  // Fetch qualifications
  const fetchQualifications = async () => {
    if (!user || !targetUserId) return;
    
    setLoading(true);
    try {
      const response = await getUserQualifications(user, targetUserId);
      const quals = response.qualifications || [];
      setQualifications(quals);
      setFilteredQualifications(quals);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      notifyError('Failed to load qualifications', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, [user, targetUserId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...qualifications];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(qual => {
        if (statusFilter === 'expired') {
          return qual.expiryDate && new Date(qual.expiryDate) < new Date();
        } else if (statusFilter === 'expiring_soon') {
          const now = new Date();
          const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
          return qual.expiryDate && 
                 new Date(qual.expiryDate) >= now && 
                 new Date(qual.expiryDate) < twoMonths;
        } else if (statusFilter === 'active') {
          return !qual.expiryDate || new Date(qual.expiryDate) >= new Date();
        }
        return true;
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(qual => qual.qualificationType === typeFilter);
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(qual => 
        qual.qualificationName?.toLowerCase().includes(term) ||
        qual.qualificationType?.toLowerCase().includes(term) ||
        qual.issuer?.toLowerCase().includes(term)
      );
    }

    setFilteredQualifications(filtered);
  }, [qualifications, statusFilter, typeFilter, searchTerm]);

  // Get unique qualification types for filter
  const getQualificationTypes = () => {
    const types = [...new Set(qualifications.map(qual => qual.qualificationType))].filter(Boolean);
    return types.sort();
  };

  // Get count by status
  const getStatusCounts = () => {
    const now = new Date();
    const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    return {
      total: qualifications.length,
      active: qualifications.filter(qual => !qual.expiryDate || new Date(qual.expiryDate) >= now).length,
      expiring: qualifications.filter(qual => 
        qual.expiryDate && 
        new Date(qual.expiryDate) >= now && 
        new Date(qual.expiryDate) < twoMonths
      ).length,
      expired: qualifications.filter(qual => 
        qual.expiryDate && new Date(qual.expiryDate) < now
      ).length
    };
  };

  const statusCounts = getStatusCounts();

  // Handle add qualification
  const handleAddQualification = async (qualificationData, file) => {
    setModalLoading(true);
    try {
      const dataToSubmit = {
        ...qualificationData,
        userId: targetUserId
      };
      
      const addPromise = uploadUserQualification(user, file, dataToSubmit);
      
      notifyPromise(addPromise, {
        pending: 'Uploading qualification...',
        success: 'Qualification added successfully!',
        error: 'Failed to add qualification'
      });
      
      await addPromise;
      await fetchQualifications();
      setAddModalOpen(false);
    } catch (error) {
      console.error('Error adding qualification:', error);
    } finally {
      setModalLoading(false);
    }
  };

  // Handle edit qualification
  const handleEditQualification = async (qualificationData, file) => {
    if (!selectedQualification) return;
    
    setModalLoading(true);
    try {
      const updatePromise = updateUserQualification(user, selectedQualification.id, qualificationData, file);
      
      notifyPromise(updatePromise, {
        pending: 'Updating qualification...',
        success: 'Qualification updated successfully!',
        error: 'Failed to update qualification'
      });
      
      await updatePromise;
      await fetchQualifications();
      setEditModalOpen(false);
      setSelectedQualification(null);
    } catch (error) {
      console.error('Error updating qualification:', error);
    } finally {
      setModalLoading(false);
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
      await fetchQualifications();
    } catch (error) {
      console.error('Error deleting qualification:', error);
    }
  };

  // Handle view qualification
  const handleViewQualification = (qualification) => {
    setSelectedQualification(qualification);
    setViewModalOpen(true);
  };

  // Handle edit button click
  const handleEditClick = (qualification) => {
    setSelectedQualification(qualification);
    setEditModalOpen(true);
  };

  // Handle download
  const handleDownloadQualification = async (qualification) => {
    try {
      // Method 1: Try direct download
      try {
        const file = await downloadFile(user, qualification.gcsFileName);
        const success = triggerFileDownload(file, qualification.fileName);
        
        if (success) {
          notifySuccess('File downloaded successfully');
          return;
        }
      } catch (downloadError) {
        console.warn('Direct download failed:', downloadError.message);
        
        // Method 2: Try URL-based download as fallback
        try {
          const success = await downloadViaUrl(user, qualification.gcsFileName, qualification.fileName);
          if (success) {
            notifySuccess('File download started');
            return;
          }
        } catch (urlError) {
          console.warn('URL download failed:', urlError.message);
          throw downloadError; // Throw the original error
        }
      }
      
      // If all methods fail
      throw new Error('All download methods failed');
      
    } catch (error) {
      console.error('Error downloading file:', error);
      
      // Show specific error messages
      if (error.message.includes('not found')) {
        notifyError('File not found', 'The file may have been deleted or moved');
      } else if (error.message.includes('permission') || error.message.includes('Access denied')) {
        notifyError('Access denied', 'You may not have permission to download this file');
      } else if (error.message.includes('timeout')) {
        notifyError('Download timeout', 'The file may be too large. Please try again');
      } else {
        notifyError('Download failed', 'Please try again later or contact support');
      }
    }
  };

  // Reset filters
  const resetFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="w-full">
        {/* Header Skeleton */}
        <Card className="shadow-md mb-6">
          <Skeleton active paragraph={{ rows: 3 }} />
        </Card>

        {/* Grid Skeleton */}
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card className="shadow-md">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  return (
    <div className="w-full">

      {/* Expiry Alerts */}
      {statusCounts.expired > 0 && (
        <Alert
          message="Expired Qualifications"
          description={`You have ${statusCounts.expired} expired qualification${statusCounts.expired > 1 ? 's' : ''}. Please review and update them as soon as possible or contact your manager.`}
          type="error"
          showIcon
          className="mb-4"
        />
      )}
      
      {statusCounts.expiring > 0 && (
        <Alert
          message="Expiring Soon"
          description={`You have ${statusCounts.expiring} qualification${statusCounts.expiring > 1 ? 's' : ''} expiring within the next 2 months. Please review and take appropriate action now.`}
          type="warning"
          showIcon
          className="mb-4"
        />
      )}

      {/* Overview with filters */}
      <Card className="shadow-md mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold mb-2">{title}</h2>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <span>Total: <strong>{statusCounts.total}</strong></span>
              <span>Active: <strong className="text-green-600">{statusCounts.active}</strong></span>
              <span>Expiring: <strong className="text-orange-600">{statusCounts.expiring}</strong></span>
              <span>Expired: <strong className="text-red-600">{statusCounts.expired}</strong></span>
            </div>
          </div>
          
          <Space wrap>
            <Button 
              icon={<ReloadOutlined />}
              onClick={fetchQualifications}
              loading={loading}
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setAddModalOpen(true)}
            >
              Add Qualification
            </Button>
          </Space>
        </div>

        {/* Filters */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <Search
                placeholder="Search qualifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                allowClear
                prefix={<SearchOutlined />}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: '100%' }}
                prefix={<FilterOutlined />}
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
                prefix={<FilterOutlined />}
              >
                <Option value="all">All Types</Option>
                {getQualificationTypes().map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </div>
          </div>
          
          {(statusFilter !== 'all' || typeFilter !== 'all' || searchTerm) && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">
                Showing {filteredQualifications.length} of {qualifications.length} qualifications
              </span>
              <Button size="small" onClick={resetFilters}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* Qualifications Grid */}
      {filteredQualifications.length === 0 ? (
        <Card className="shadow-md">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                ? "No qualifications match your filters"
                : "No qualifications uploaded yet"
            }
          >
            {(!searchTerm && statusFilter === 'all' && typeFilter === 'all') && (
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setAddModalOpen(true)}>
                Add Your First Qualification
              </Button>
            )}
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {filteredQualifications.map((qualification) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={qualification.id}>
              <QualificationCard
                qualification={qualification}
                onView={handleViewQualification}
                onEdit={handleEditClick}
                onDelete={handleDeleteQualification}
                onDownload={handleDownloadQualification}
                showUserInfo={showUserInfo}
              />
            </Col>
          ))}
        </Row>
      )}

      {/* Qualification Modal */}
      <QualificationModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddQualification}
        loading={modalLoading}
        title="Add New Qualification"
      />

      {/* Edit Qualification Modal */}
      <QualificationModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedQualification(null);
        }}
        onSubmit={handleEditQualification}
        qualification={selectedQualification}
        loading={modalLoading}
        title="Edit Qualification"
      />

      {/* View Qualification Modal */}
      <QualificationViewModal
        open={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedQualification(null);
        }}
        qualification={selectedQualification}
        onEdit={handleEditClick}
        onDelete={handleDeleteQualification}
        onDownload={handleDownloadQualification}
      />
    </div>
  );
};

export default QualificationList;