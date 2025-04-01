import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, Button, Table, Tooltip, Input, Empty, Card } from 'antd';
import { SearchOutlined, CheckCircleOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import CompletionCertificate from './CompletionCertificate';
import Status from '../models/Status';
import { notifyError, notifyWarning } from '../utils/notificationService';
import useAuth from '../hooks/useAuth';
import { getUserInductions, getUserInductionById } from '../api/UserInductionApi';

const { TabPane } = Tabs;

// Reusable StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusMapping = {
    'assigned': { label: 'To Complete', color: 'border-blue-500 text-blue-500' },
    'in_progress': { label: 'In Progress', color: 'border-yellow-500 text-yellow-500' },
    'complete': { label: 'Completed', color: 'border-green-500 text-green-500' },
    'overdue': { label: 'OVERDUE', color: 'border-red-500 text-white bg-red-500' },
    // Support for both string and numeric status (backward compatibility)
    [Status.ASSIGNED]: { label: 'To Complete', color: 'border-blue-500 text-blue-500' },
    [Status.IN_PROGRESS]: { label: 'In Progress', color: 'border-yellow-500 text-yellow-500' },
    [Status.COMPLETE]: { label: 'Completed', color: 'border-green-500 text-green-500' },
    [Status.OVERDUE]: { label: 'OVERDUE', color: 'border-red-500 text-white bg-red-500' },
  };

  const { label, color } = statusMapping[status] || { label: 'Status Unknown', color: 'border-gray-500 text-gray-500' };

  return (
    <span className={`px-2 py-1 border rounded ${color}`}>
      {label}
    </span>
  );
};

// Reusable DateCell Component
const DateCell = ({ date, label }) => {
  const formatDate = (dateValue) => {
    if (!dateValue) return 'Not Available';
    
    try {
      // Handle Firestore Timestamp objects with _seconds
      if (dateValue && typeof dateValue === 'object' && (dateValue._seconds !== undefined || dateValue.seconds !== undefined)) {
        const seconds = dateValue._seconds !== undefined ? dateValue._seconds : dateValue.seconds;
        return new Date(seconds * 1000).toLocaleDateString();
      }
      
      // Check if itss a regular Date object
      if (dateValue instanceof Date) {
        return dateValue.toLocaleDateString();
      }
      
      // If it has a toDate method
      if (dateValue && typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        return dateValue.toDate().toLocaleDateString();
      }
      
      // Handle ISO string dates
      return new Date(dateValue).toLocaleDateString();
    } catch (e) {
      console.error("Error formatting date:", e, dateValue);
      return "Not Available";
    }
  };

  return (
    <div className="flex flex-col">
      {label && <span className="text-xs text-gray-500 lg:hidden">{label}:</span>}
      <span>{formatDate(date)}</span>
    </div>
  );
};

// Certificate Button Component
const CertificateButton = ({ record, user }) => {
  const [fullInduction, setFullInduction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const loadInductionDetails = async () => {
    if (fullInduction) {
      return;
    }
    
    setLoading(true);
    setError(false);
    
    try {
      // Get induction details from API
      const data = await getUserInductionById(user, record.id);
      
      if (data) {
        // Normalize completion date
        let completionDate = record.completedAt || record.completionDate;
        
        // Handle Firestore Timestamp objects
        if (completionDate && typeof completionDate === 'object') {
          if (completionDate._seconds !== undefined || completionDate.seconds !== undefined) {
            const seconds = completionDate._seconds !== undefined ? completionDate._seconds : completionDate.seconds;
            completionDate = new Date(seconds * 1000);
          } else if (typeof completionDate.toDate === 'function') {
            completionDate = completionDate.toDate();
          }
        }
        
        setFullInduction({
          ...data,
          name: data.inductionName || record.inductionName || 'Unnamed Induction',
          completionDate: completionDate
        });
      } else {
        throw new Error('No data returned');
      }
    } catch (error) {
      setError(true);
      notifyError('Certificate Error', 'Unable to generate certificate. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleCertificateClick = () => {
    loadInductionDetails();
  };

  // If there was an error, allow retrying
  if (error) {
    return (
      <Button 
        type="default"
        danger
        icon={<TrophyOutlined />}
        onClick={handleCertificateClick}
        loading={loading}
      >Retry Certificate
      </Button>
    );
  }

  return fullInduction ? (
    <CompletionCertificate 
      induction={fullInduction}
      user={user}
      completionDate={fullInduction.completionDate}
      fallbackName={record.inductionName}
    />
  ) : (
    <Button 
      type="primary" 
      icon={<TrophyOutlined />}
      onClick={handleCertificateClick}
      loading={loading}
      className="certificate-btn"
      style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
    >View Certificate
    </Button>
  );
};

// Check if an induction is in the future
const isFutureInduction = (availableFrom) => {
  if (!availableFrom) return false;
  
  const now = new Date();
  
  try {
    // Handle Firestore Timestamp objects with _seconds
    if (typeof availableFrom === 'object' && (availableFrom._seconds !== undefined || availableFrom.seconds !== undefined)) {
      const seconds = availableFrom._seconds !== undefined ? availableFrom._seconds : availableFrom.seconds;
      return new Date(seconds * 1000) > now;
    }
    
    // Handle objects with toDate method
    if (typeof availableFrom === 'object' && typeof availableFrom.toDate === 'function') {
      return availableFrom.toDate() > now;
    }
    
    // Default case for regular date strings/objects
    const startDate = new Date(availableFrom);
    return startDate > now;
  } catch (e) {
    console.error("Error checking future induction:", e, availableFrom);
    return false;
  }
};

// Get days until available
const getDaysUntilAvailable = (availableFrom) => {
  if (!availableFrom) return 0;
  
  const now = new Date();
  
  try {
    let startDate;
    
    // Handle Firestore Timestamp objects with _seconds
    if (typeof availableFrom === 'object' && (availableFrom._seconds !== undefined || availableFrom.seconds !== undefined)) {
      const seconds = availableFrom._seconds !== undefined ? availableFrom._seconds : availableFrom.seconds;
      startDate = new Date(seconds * 1000);
    }
    // Handle objects with toDate method
    else if (typeof availableFrom === 'object' && typeof availableFrom.toDate === 'function') {
      startDate = availableFrom.toDate();
    }
    // Default case for regular date strings/objects
    else {
      startDate = new Date(availableFrom);
    }
    
    return Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  } catch (e) {
    console.error("Error calculating days until available:", e, availableFrom);
    return 0;
  }
};

// Reusable InductionTitle component that handles future inductions
const InductionTitle = ({ record }) => {
  const future = isFutureInduction(record.availableFrom);
  const daysUntil = getDaysUntilAvailable(record.availableFrom);
  
  const inductionName = record.inductionName || record.induction?.name || 'Unnamed Induction';
  
  if (future) {
    return (
      <Tooltip title={`Available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}>
        <span className="text-black">
          {inductionName}
        </span>
      </Tooltip>
    );
  }
  
  return (
    <Link to={`/induction/take?assignmentID=${record.id}`} className="text-black hover:underline">
      {inductionName}
    </Link>
  );
};

// Reusable ActionButton Component
const ActionButton = ({ status, assignmentID, availableFrom }) => {
  const future = isFutureInduction(availableFrom);
  const daysUntil = getDaysUntilAvailable(availableFrom);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStartClick = (e) => {
    e.preventDefault();
    
    // Verify user has a token before navigating
    if (!user?.token) {
      notifyWarning('Login Required', 'Please log in to start this induction');
      navigate('/auth/signin', { state: { from: `/induction/take?assignmentID=${assignmentID}` } });
      return;
    }
    
    // Navigate to the induction page
    navigate(`/induction/take?assignmentID=${assignmentID}`);
  };

  if (['assigned', 'in_progress', 'overdue'].includes(status)) {
    if (future) {
      return (
        <Tooltip title={`Available in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`}>
          <Button type="primary" disabled className="flex items-center">
            <ClockCircleOutlined className="mr-1" />
            Start
          </Button>
        </Tooltip>
      );
    }
    
    return (
      <Button type="primary" onClick={handleStartClick}>
        {status === 'in_progress' ? 'Continue' : 'Start'}
      </Button>
    );
  } else if (status === 'complete') {
    return (
      <div className="flex items-center text-green-600">
        <CheckCircleOutlined className="mr-1" />
        <span>Completed</span>
      </div>
    );
  }
  return null;
};

// Mobile Card Component for Active Inductions
const ActiveInductionCard = ({ induction }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">
            <InductionTitle record={induction} />
          </h3>
          <StatusBadge status={induction.status} />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
        <DateCell date={induction.availableFrom} label="Available From" />
        <DateCell date={induction.dueDate} label="Due Date" />
      </div>
      
      <div className="mt-2">
        <ActionButton 
          status={induction.status} 
          assignmentID={induction.id}
          availableFrom={induction.availableFrom}
        />
      </div>
    </Card>
  );
};

// Mobile Card Component for Completed Inductions
const CompletedInductionCard = ({ induction, user }) => {
  return (
    <Card className="mb-4 shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className="text-lg font-medium mb-1">
            <InductionTitle record={induction} />
          </h3>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-4 mb-4">
        <DateCell date={induction.availableFrom} label="Available From" />
        <DateCell date={induction.dueDate} label="Due Date" />
        <b><DateCell date={induction.completedAt} label="Completed On" /></b>
      </div>
      
      <div className="mt-2">
        <CertificateButton 
          record={induction}
          user={user}
        />
      </div>
    </Card>
  );
};

// Loading Skeleton Component
const TableSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-4 mb-4">
      <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
    </div>
    <div className="hidden lg:block">
      <div className="min-w-full bg-white shadow-md rounded-lg">
        <div className="bg-gray-50 px-5 py-3 flex">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-1/6 h-6 bg-gray-200 rounded animate-pulse mr-2"></div>
          ))}
        </div>
        <div className="bg-white divide-y divide-gray-200">
          {[1, 2, 3, 4, 5].map((row) => (
            <div key={row} className="flex px-6 py-4">
              {[1, 2, 3, 4, 5, 6].map((cell) => (
                <div key={cell} className="w-1/6 h-6 bg-gray-200 rounded animate-pulse mr-2"></div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="lg:hidden space-y-4">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="bg-white shadow-md rounded-lg p-4">
          <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
          </div>
          <div className="mt-4 h-8 bg-gray-200 rounded animate-pulse w-24"></div>
        </div>
      ))}
    </div>
  </div>
);

const SearchInputWithFocus = ({ value, onChange }) => {
  const inputRef = React.useRef(null);
  
  return (
    <Input
      ref={inputRef}
      placeholder="Search inductions..."
      prefix={<SearchOutlined />}
      value={value}
      onChange={onChange}
      className="mb-4"
      allowClear
    />
  );
};

// Main AssignedInductions Component
const AssignedInductions = ({ uid }) => {
  const [assignedInductions, setAssignedInductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('1');
  const { user } = useAuth();

  const userId = uid || user?.uid;

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    setSearchText(e.target.value);
  }, []);

  useEffect(() => {
    if (user && userId) {
      const fetchInductions = async () => {
        setLoading(true);
        try {
          // Function to get user inductions from the API
          const response = await getUserInductions(user, userId);
          
          setAssignedInductions(response || []);
        } catch (error) {
          if (error.response?.status === 401) {
            notifyError('Authentication Error', 'Your session has expired. Please log in again.');
          } else {
            notifyError('Unable to load assigned inductions', 'Please try again later or contact support.');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchInductions();
    }
  }, [user, userId]);

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  // Separate inductions into active and completed
  const activeInductions = assignedInductions.filter(induction => 
    induction.status !== 'complete'
  );
  
  const completedInductions = assignedInductions.filter(induction => 
    induction.status === 'complete'
  );

  // Filter function for search
  const filterInductions = useCallback((dataSource) => {
    if (!searchText) return dataSource;
    
    return dataSource.filter(item => 
      (item.inductionName || item.induction?.name || '')
        .toLowerCase()
        .includes(searchText.toLowerCase())
    );
  }, [searchText]);

  // Define ANTD table columns
  const activeColumns = [
    {
      title: 'Induction Name',
      dataIndex: 'inductionName',
      key: 'inductionName',
      sorter: (a, b) => (a.inductionName || '').localeCompare(b.inductionName || ''),
      render: (text, record) => <InductionTitle record={record} />,
    },
    {
      title: 'Available From',
      dataIndex: 'availableFrom',
      key: 'availableFrom',
      sorter: (a, b) => {
        const getDateValue = (date) => {
          if (!date) return 0;
          if (date && typeof date === 'object' && date.toDate) {
            return date.toDate().getTime();
          }
          return new Date(date || 0).getTime();
        };
        
        return getDateValue(a.availableFrom) - getDateValue(b.availableFrom);
      },
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a, b) => {
        const getDateValue = (date) => {
          if (!date) return 0;
          if (date && typeof date === 'object' && date.toDate) {
            return date.toDate().getTime();
          }
          return new Date(date || 0).getTime();
        };
        
        return getDateValue(a.dueDate) - getDateValue(b.dueDate);
      },
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || ''),
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <ActionButton 
          status={record.status} 
          assignmentID={record.id}
          availableFrom={record.availableFrom}
        />
      ),
    },
  ];

  const completedColumns = [
    {
      title: 'Induction Name',
      dataIndex: 'inductionName',
      key: 'inductionName',
      sorter: (a, b) => (a.inductionName || '').localeCompare(b.inductionName || ''),
      render: (text, record) => <InductionTitle record={record} />,
    },
    {
      title: 'Available From',
      dataIndex: 'availableFrom',
      key: 'availableFrom',
      sorter: (a, b) => {
        const getDateValue = (date) => {
          if (!date) return 0;
          if (date && typeof date === 'object' && date.toDate) {
            return date.toDate().getTime();
          }
          return new Date(date || 0).getTime();
        };
        
        return getDateValue(a.availableFrom) - getDateValue(b.availableFrom);
      },
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a, b) => {
        const getDateValue = (date) => {
          if (!date) return 0;
          if (date && typeof date === 'object' && date.toDate) {
            return date.toDate().getTime();
          }
          return new Date(date || 0).getTime();
        };
        
        return getDateValue(a.dueDate) - getDateValue(b.dueDate);
      },
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Completion Date',
      dataIndex: 'completedAt',
      key: 'completedAt',
      sorter: (a, b) => {
        const getDateValue = (date) => {
          if (!date) return 0;
          if (date && typeof date === 'object' && date.toDate) {
            return date.toDate().getTime();
          }
          return new Date(date || 0).getTime();
        };
        
        return getDateValue(a.completedAt) - getDateValue(b.completedAt);
      },
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Certificate',
      key: 'certificate',
      render: (_, record) => (
        <CertificateButton 
          record={record}
          user={user}
        />
      ),
    }
  ];

  if (loading) {
    return <TableSkeleton />;
  }

  if (assignedInductions.length === 0) {
    return <Empty description="No inductions assigned" />;
  }

  // Mobile card view for active inductions
  const ActiveMobileView = () => (
    <div className="space-y-4">
      {filterInductions(activeInductions).length === 0 ? (
        <Empty description="No active inductions" />
      ) : (
        filterInductions(activeInductions).map(induction => (
          <ActiveInductionCard 
            key={induction.id} 
            induction={induction} 
          />
        ))
      )}
    </div>
  );

  // Mobile card view for completed inductions
  const CompletedMobileView = () => (
    <div className="space-y-4">
      {filterInductions(completedInductions).length === 0 ? (
        <Empty description="No completed inductions" />
      ) : (
        filterInductions(completedInductions).map(induction => (
          <CompletedInductionCard 
            key={induction.id} 
            induction={induction} 
            user={user}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="tableContainer">
      <SearchInputWithFocus 
        value={searchText}
        onChange={handleSearchChange}
      />
      
      <Tabs 
        activeKey={activeTab}
        onChange={handleTabChange}
        items={[
          {
            key: '1',
            label: `Active Inductions (${activeInductions.length})`,
            children: (
              <>
                {/* Desktop view - table */}
                <div className="hidden lg:block">
                  <Table
                    dataSource={filterInductions(activeInductions)}
                    columns={activeColumns}
                    rowKey="id"
                    pagination={activeInductions.length > 10 ? { pageSize: 10 } : false}
                    locale={{ emptyText: <Empty description="No active inductions" /> }}
                  />
                </div>
                
                {/* Mobile view - cards */}
                <div className="lg:hidden">
                  <ActiveMobileView />
                </div>
              </>
            )
          },
          {
            key: '2',
            label: `Completed Inductions (${completedInductions.length})`,
            children: (
              <>
                {/* Desktop view - table */}
                <div className="hidden lg:block">
                  <Table
                    dataSource={filterInductions(completedInductions)}
                    columns={completedColumns}
                    rowKey="id"
                    pagination={completedInductions.length > 10 ? { pageSize: 10 } : false}
                    locale={{ emptyText: <Empty description="No completed inductions" /> }}
                  />
                </div>
                
                {/* Mobile view - cards */}
                <div className="lg:hidden">
                  <CompletedMobileView />
                </div>
              </>
            )
          }
        ]}
      />
    </div>
  );
};

export default AssignedInductions;