import React, { useState, useEffect, useCallback } from 'react';
import { getAssignedInductions, getInduction } from '../api/InductionApi';
import useAuth from '../hooks/useAuth';
import { Tabs, Button, Table, Tooltip, Input, Empty } from 'antd';
import { SearchOutlined, CheckCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import CompletionCertificate from './CompletionCertificate';
import Status from '../models/Status';
import { 
  notifyError, 
  notifyWarning
} from '../utils/notificationService';

const { TabPane } = Tabs;

// Reusable StatusBadge Component
const StatusBadge = ({ status }) => {
  const statusMapping = {
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
const DateCell = ({ date }) => (
  <span>{date ? new Date(date).toLocaleDateString() : 'Not Available'}</span>
);

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
      const data = await getInduction(user, record.assignmentID);
            
      if (data) {
        setFullInduction({
          ...data,
          name: data.name || record.name
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
      completionDate={record.completionDate}
      fallbackName={record.name}
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

// Reusable ActionButton Component
const ActionButton = ({ status, assignmentID, availableFrom }) => {
  const now = new Date();
  const startDate = availableFrom ? new Date(availableFrom) : null;
  const isFutureInduction = startDate && startDate > now;
  const daysUntilAvailable = startDate ? Math.ceil((startDate - now) / (1000 * 60 * 60 * 24)) : 0;
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

  if ([Status.ASSIGNED, Status.IN_PROGRESS, Status.OVERDUE].includes(status)) {
    if (isFutureInduction) {
      return (
        <Tooltip title={`Available in ${daysUntilAvailable} day${daysUntilAvailable !== 1 ? 's' : ''}`}>
          <Button type="primary" disabled>
            Start
          </Button>
        </Tooltip>
      );
    }
    
    return (
      <Button type="primary" onClick={handleStartClick}>
        {status === Status.IN_PROGRESS ? 'Continue' : 'Start'}
      </Button>
    );
  } else if (status === Status.COMPLETE) {
    return (
      <div className="flex items-center text-green-600">
        <CheckCircleOutlined className="mr-1" />
        <span>Completed</span>
      </div>
    );
  }
  return null;
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
          const response = await getAssignedInductions(user, userId);
          setAssignedInductions(response.assignedInductions || []);
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
    induction.status !== Status.COMPLETE
  );
  
  const completedInductions = assignedInductions.filter(induction => 
    induction.status === Status.COMPLETE
  );

  // Filter function for search
  const filterInductions = useCallback((dataSource) => {
    if (!searchText) return dataSource;
    
    return dataSource.filter(item => 
      item.name?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [searchText]);

  // Define ANTD table columns
  const activeColumns = [
    {
      title: 'Induction Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <Link to={`/induction/take?assignmentID=${record.assignmentID}`} className="text-black hover:underline">
          {text || 'Unnamed Induction'}
        </Link>
      ),
    },
    {
      title: 'Available From',
      dataIndex: 'availableFrom',
      key: 'availableFrom',
      sorter: (a, b) => new Date(a.availableFrom || 0) - new Date(b.availableFrom || 0),
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0),
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      sorter: (a, b) => (a.status || 0) - (b.status || 0),
      render: (status) => <StatusBadge status={status} />,
    },
    {
      title: '',
      key: 'action',
      render: (_, record) => (
        <ActionButton 
          status={record.status} 
          assignmentID={record.assignmentID}
          availableFrom={record.availableFrom}
        />
      ),
    },
  ];

  const completedColumns = [
    {
      title: 'Induction Name',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
      render: (text, record) => (
        <Link to={`/induction/take?assignmentID=${record.assignmentID}`} className="text-black hover:underline">
          {text || 'Unnamed Induction'}
        </Link>
      ),
    },
    {
      title: 'Available From',
      dataIndex: 'availableFrom',
      key: 'availableFrom',
      sorter: (a, b) => new Date(a.availableFrom || 0) - new Date(b.availableFrom || 0),
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      sorter: (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0),
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Completion Date',
      dataIndex: 'completionDate',
      key: 'completionDate',
      sorter: (a, b) => new Date(a.completionDate || 0) - new Date(b.completionDate || 0),
      render: (date) => <DateCell date={date} />,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
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
              <Table
                dataSource={filterInductions(activeInductions)}
                columns={activeColumns}
                rowKey="assignmentID"
                pagination={activeInductions.length > 10 ? { pageSize: 10 } : false}
                locale={{ emptyText: <Empty description="No active inductions" /> }}
              />
            )
          },
          {
            key: '2',
            label: `Completed Inductions (${completedInductions.length})`,
            children: (
              <Table
                dataSource={filterInductions(completedInductions)}
                columns={completedColumns}
                rowKey="assignmentID"
                pagination={completedInductions.length > 10 ? { pageSize: 10 } : false}
                locale={{ emptyText: <Empty description="No completed inductions" /> }}
              />
            )
          }
        ]}
      />
    </div>
  );
};

export default AssignedInductions;