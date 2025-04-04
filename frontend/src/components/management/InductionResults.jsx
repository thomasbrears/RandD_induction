import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Card, Table, Tag, Button, Statistic, Row, Col, Progress, Skeleton, Empty,
  Dropdown, Space, Input, Tabs, Badge, Typography
} from 'antd';
import { 
  UserOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, 
  LeftOutlined, SearchOutlined, WarningOutlined, FilterOutlined,
  MailOutlined, SettingOutlined, CalendarOutlined, ExpandOutlined,
  EyeOutlined, RightOutlined
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import ExportSection from '../../components/management/ExportSection';
import { getInduction } from '../../api/InductionApi';
import { getUsersByInduction, getInductionStats, sendInductionReminder } from '../../api/UserInductionApi';
import { notifyError, notifySuccess } from '../../utils/notificationService';
import { formatDate, formatDuration } from '../../utils/dateUtils';

const { Search } = Input;
const { Paragraph, Text } = Typography;

const InductionResults = ({ inductionId, setPageHeader = null }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [induction, setInduction] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredActiveAssignments, setFilteredActiveAssignments] = useState([]);
  const [filteredCompletedAssignments, setFilteredCompletedAssignments] = useState([]);
  const [statusFilter, setStatusFilter] = useState([]);
  const [activeAssignments, setActiveAssignments] = useState([]);
  const [completedAssignments, setCompletedAssignments] = useState([]);
  const [sendingReminder, setSendingReminder] = useState(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [exportType, setExportType] = useState('summary');

  // Check if we should use the mobile view based on window width
  const isMobileView = windowWidth < 768;

  // Effect for window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Fetch induction details and assignments
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get induction details
        const inductionData = await getInduction(currentUser, inductionId);
        setInduction(inductionData);

        // Update page header if function is provided
        if (setPageHeader && inductionData) {
          setPageHeader(inductionData.name);
        }

        // Get all users assigned to this induction
        const assignmentsData = await getUsersByInduction(currentUser, inductionId);
        setAssignments(assignmentsData);
        
        // Separate active and completed assignments
        const completed = assignmentsData.filter(a => a.status === 'complete');
        const active = assignmentsData.filter(a => a.status !== 'complete');
        
        setActiveAssignments(active);
        setCompletedAssignments(completed);
        setFilteredActiveAssignments(active);
        setFilteredCompletedAssignments(completed);

        // Calculate statistics from our data
        const calculatedStats = {
          total: assignmentsData.length,
          completed: completed.length,
          inProgress: assignmentsData.filter(a => a.status === 'in_progress').length,
          assigned: assignmentsData.filter(a => a.status === 'assigned').length,
          overdue: assignmentsData.filter(a => a.status === 'overdue').length
        };
        
        setStats(calculatedStats);
      } catch (error) {
        console.error("Error fetching induction results:", error);
        notifyError("Failed to load results", "Please try again later");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && inductionId) {
      fetchData();
    }
  }, [currentUser, inductionId, setPageHeader]);

  // Filter assignments based on search text 
  useEffect(() => {
    if (!activeAssignments.length && !completedAssignments.length) return;

    // Filter active assignments
    if (activeAssignments.length) {
      let filtered = [...activeAssignments];
      
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(
          assignment => assignment.user?.displayName?.toLowerCase().includes(searchLower) || 
                        assignment.user?.email?.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply status filter to active assignments
      if (statusFilter.length > 0) {
        filtered = filtered.filter(assignment => statusFilter.includes(assignment.status));
      }
      
      setFilteredActiveAssignments(filtered);
    }
    
    // Filter completed assignments
    if (completedAssignments.length) {
      let filtered = [...completedAssignments];
      
      if (searchText) {
        const searchLower = searchText.toLowerCase();
        filtered = filtered.filter(
          assignment => assignment.user?.displayName?.toLowerCase().includes(searchLower) || 
                        assignment.user?.email?.toLowerCase().includes(searchLower)
        );
      }
      
      setFilteredCompletedAssignments(filtered);
    }
  }, [searchText, statusFilter, activeAssignments, completedAssignments]);

  // Status tag component
  const StatusTag = ({ status }) => {
    const statusMap = {
      'assigned': { color: 'blue', text: 'Assigned', icon: <ClockCircleOutlined /> },
      'in_progress': { color: 'orange', text: 'In Progress', icon: <ClockCircleOutlined /> },
      'complete': { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> },
      'overdue': { color: 'red', text: 'Overdue', icon: <WarningOutlined /> }
    };
    
    const config = statusMap[status] || { color: 'default', text: status, icon: null };
    
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  // Status filter menu items
  const statusFilterItems = [
    {
      key: 'assigned',
      label: (
        <span className="flex items-center"><Tag color="blue" className="mr-2">Assigned</Tag></span>
      ),
    },
    {
      key: 'in_progress',
      label: (
        <span className="flex items-center"><Tag color="orange" className="mr-2">In Progress</Tag></span>
      ),
    },
    {
      key: 'overdue',
      label: (
        <span className="flex items-center"><Tag color="red" className="mr-2">Overdue</Tag></span>
      ),
    },
    {
      key: 'clear',
      label: (
        <span className="text-blue-600">Clear Filters</span>
      ),
    },
  ];

  // Handle status filter clicks
  const handleStatusFilterClick = ({ key }) => {
    if (key === 'clear') {
      setStatusFilter([]);
      return;
    }
    
    setStatusFilter(prev => {
      // If already selected, remove it
      if (prev.includes(key)) {
        return prev.filter(item => item !== key);
      }
      // Otherwise add it
      return [...prev, key];
    });
  };

  // Handle sending reminder email
  const handleSendReminder = async (assignment) => {
    setSendingReminder(assignment.id);
    try {
      const result = await sendInductionReminder(currentUser, assignment.id); // Send using our API
      
      if (result.success) {
        notifySuccess(`Reminder sent to ${assignment.user?.displayName || 'user'}`);
      } else {
        notifyError("Failed to send reminder", result.message || "Please try again later");
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
      notifyError("Failed to send reminder", "Please try again later");
    } finally {
      setSendingReminder(null);
    }
  };

  // Navigate to induction management page for the specific user
  const handleManageInductions = (assignment) => {
    if (assignment && assignment.userId) {
      navigate("/management/users/inductions", {state: {uid: assignment.userId}});
    } else {
      notifyError("Unable to find user details", "Please try again");
    }
  };

  // Calculate completion time between two dates
  const calculateCompletionTime = (startDate, endDate) => {
    return formatDuration(startDate, endDate);
  };

  // Active assignments table columns
  const activeColumns = [
    {
      title: 'Staff Member',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div>
          <div className="font-medium">{user?.displayName || 'Unknown User'}</div>
          <div className="text-gray-500 text-sm">{user?.email}</div>
        </div>
      ),
      sorter: (a, b) => (a.user?.displayName || '').localeCompare(b.user?.displayName || '')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusTag status={status} />,
    },
    {
      title: 'Assigned On',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        const dateA = a.assignedAt ? new Date(a.assignedAt.seconds * 1000) : new Date(0);
        const dateB = b.assignedAt ? new Date(b.assignedAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      }
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date) => date ? formatDate(date) : 'No Due Date', 
      sorter: (a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate.seconds * 1000) : new Date(9999, 11, 31);
        const dateB = b.dueDate ? new Date(b.dueDate.seconds * 1000) : new Date(9999, 11, 31);
        return dateA - dateB;
      }
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            size="small"
            icon={<MailOutlined />}
            onClick={() => handleSendReminder(record)}
            loading={sendingReminder === record.id}
          >Send Reminder
          </Button>
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleManageInductions(record)}
          >Manage Assignment
          </Button>
        </Space>
      )
    }
  ];

  // Completed assignments table columns
  const completedColumns = [
    {
      title: 'Staff Member',
      dataIndex: 'user',
      key: 'user',
      render: (user) => (
        <div>
          <div className="font-medium">{user?.displayName || 'Unknown User'}</div>
          <div className="text-gray-500 text-sm">{user?.email}</div>
        </div>
      ),
      sorter: (a, b) => (a.user?.displayName || '').localeCompare(b.user?.displayName || '')
    },
    {
      title: 'Assigned On',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        const dateA = a.assignedAt ? new Date(a.assignedAt.seconds * 1000) : new Date(0);
        const dateB = b.assignedAt ? new Date(b.assignedAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      }
    },
    {
      title: 'Completed On',
      dataIndex: 'completedAt',
      key: 'completedAt',
      render: (date) => formatDate(date),
      sorter: (a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt.seconds * 1000) : new Date(0);
        const dateB = b.completedAt ? new Date(b.completedAt.seconds * 1000) : new Date(0);
        return dateA - dateB;
      }
    },
    {
      title: 'Completion Time',
      key: 'completionTime',
      render: (_, record) => calculateCompletionTime(record.startedAt, record.completedAt)
    },
    {
      title: '',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button 
            type="primary"
            size="small"
            onClick={() => navigate(`/management/results/user/${record.userId}/${record.id}`)}
          >View Results
          </Button>
          <Button
            type="default"
            size="small"
            icon={<SettingOutlined />}
            onClick={() => handleManageInductions(record)}
          >Manage Assignment
          </Button>
        </Space>
      )
    }
  ];

  // Handle edit induction button click - navigate to edit page with induction ID
  const handleEditInduction = (id) => {
    navigate("/management/inductions/edit", { state: { id } });
  };

  // Active assignment card item for mobile view
  const renderActiveAssignmentCard = (item) => (
    <Card className="mb-4 shadow-sm" key={item.id}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-lg font-medium">{item.user?.displayName || 'Unknown User'}</div>
        <StatusTag status={item.status} />
      </div>
      
      <div className="text-gray-500 mb-4">{item.user?.email}</div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <div className="text-gray-500 text-xs">Assigned On</div>
          <div className="flex items-center">
            <CalendarOutlined className="mr-1 text-gray-400" /> 
            {formatDate(item.assignedAt)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Due Date</div>
          <div className="flex items-center">
            <CalendarOutlined className="mr-1 text-gray-400" /> 
            {item.dueDate ? formatDate(item.dueDate) : 'No Due Date'}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          type="primary"
          size="middle"
          block
          icon={<MailOutlined />}
          onClick={() => handleSendReminder(item)}
          loading={sendingReminder === item.id}
        >Send Reminder
        </Button>
        <Button
          type="default"
          size="middle"
          block
          icon={<SettingOutlined />}
          onClick={() => handleManageInductions(item)}
        >Manage Assignment
        </Button>
      </div>
    </Card>
  );

  // Completed assignment card item for mobile view
  const renderCompletedAssignmentCard = (item) => (
    <Card className="mb-4 shadow-sm" key={item.id}>
      <div className="flex justify-between items-start mb-2">
        <div className="text-lg font-medium">{item.user?.displayName || 'Unknown User'}</div>
        <StatusTag status={item.status} />
      </div>
      
      <div className="text-gray-500 mb-4">{item.user?.email}</div>
      
      <div className="grid grid-cols-2 gap-2 mb-4">
        <div>
          <div className="text-gray-500 text-xs">Assigned On</div>
          <div className="flex items-center">
            <CalendarOutlined className="mr-1 text-gray-400" /> 
            {formatDate(item.assignedAt)}
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Completed On</div>
          <div className="flex items-center">
            <CheckCircleOutlined className="mr-1 text-green-500" /> 
            {formatDate(item.completedAt)}
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-gray-500 text-xs">Completion Time</div>
        <div className="flex items-center">
          <ClockCircleOutlined className="mr-1 text-gray-400" /> 
            {calculateCompletionTime(item.startedAt, item.completedAt)}
          </div>
        </div>
      
      <div className="flex flex-col space-y-2">
        <Button 
          type="primary"
          size="middle"
          block
          icon={<EyeOutlined />}
          onClick={() => navigate(`/management/results/user/${item.userId}/${item.id}`)}
        >View Results
        </Button>
        <Button
          type="default"
          size="middle"
          block
          icon={<SettingOutlined />}
          onClick={() => handleManageInductions(item)}
        >Manage Assignment
        </Button>
      </div>
    </Card>
  );

  // Render loading state with skeletons
  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <Skeleton.Input active size="large" style={{ width: '60%', marginBottom: '8px' }} />
        </div>
                
        <Card className="mb-8 shadow-md">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>
        
        <Row gutter={[16, 16]} className="mb-8">
          {[1, 2, 3, 4, 5].map(i => (
            <Col xs={12} sm={6} md={4} lg={4} key={i}>
              <Card bordered={false} className="h-full shadow-sm">
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>

        <Card className="mb-8 shadow-md">
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
        
        <Card bordered={false} className="shadow-md">
          <Skeleton.Input active size="default" style={{ width: '30%', marginBottom: '16px' }} />
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  // if induction is not found, show empty state
  if (!induction) {
    return (
      <Empty 
        description="Induction not found" 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <Button 
          icon={<LeftOutlined />} 
          onClick={() => navigate('/management/results')}
        >Back to Results Hub
        </Button>
      </div>

      {/* Induction Details Card */}
      <Card className="mb-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">{induction.name}</h2>
            <div className="text-gray-600 mb-1">
              <strong>Department:</strong> {induction.department || 'No department specified'}
            </div>
            <div className="text-gray-600 mb-1">
              <strong>Question count:</strong> <span>{induction.questions?.length || 0} questions</span>
            </div>
            <div className="text-gray-600">
              <strong>Description:</strong> 
              <div className="mt-1">
                {!expandedDescription ? (
                  <>
                    <div 
                      className="description-preview overflow-hidden" 
                      style={{ maxHeight: '3em', WebkitLineClamp: 2, display: '-webkit-box', WebkitBoxOrient: 'vertical' }}
                      dangerouslySetInnerHTML={{ __html: induction.description || 'No description available' }} 
                    />
                    <Button 
                      type="link" 
                      onClick={() => setExpandedDescription(true)}
                      className="p-0 h-auto mt-1"
                    >Read more
                    </Button>
                  </>
                ) : (
                  <>
                    <div dangerouslySetInnerHTML={{ __html: induction.description || 'No description available' }} />
                    <Button 
                      type="link" 
                      onClick={() => setExpandedDescription(false)}
                      className="p-0 h-auto mt-1"
                    >Show less
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mt-2 md:mt-0">
            <Button 
              icon={<SettingOutlined />} 
              onClick={() => handleEditInduction(induction.id)}
              className="bg-gray-700 text-white hover:bg-gray-900 border-gray-700"
            >Edit Induction
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card bordered={false} className="text-center h-full shadow-sm">
            <Statistic 
              title="Total Assignments" 
              value={stats?.total || 0} 
              prefix={<UserOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card bordered={false} className="text-center h-full shadow-sm">
            <Statistic 
              title="Assigned" 
              value={stats?.assigned || 0} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#1890ff' }}
            />
            <div className="mt-2">
              <Progress 
                percent={stats?.total ? Math.round((stats.assigned / stats.total) * 100) : 0} 
                size="small" 
                status="normal" 
                showInfo
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card bordered={false} className="text-center h-full shadow-sm">
            <Statistic 
              title="In Progress" 
              value={stats?.inProgress || 0} 
              prefix={<ClockCircleOutlined />} 
              valueStyle={{ color: '#faad14' }}
            />
            <div className="mt-2">
              <Progress 
                percent={stats?.total ? Math.round((stats.inProgress / stats.total) * 100) : 0} 
                size="small" 
                status="active" 
                showInfo
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card bordered={false} className="text-center h-full shadow-sm">
            <Statistic 
              title="Completed" 
              value={stats?.completed || 0} 
              prefix={<CheckCircleOutlined />} 
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2">
              <Progress 
                percent={stats?.total ? Math.round((stats.completed / stats.total) * 100) : 0} 
                size="small" 
                status="success" 
                showInfo
              />
            </div>
          </Card>
        </Col>
        <Col xs={12} sm={12} md={8} lg={4}>
          <Card bordered={false} className="text-center h-full shadow-sm">
            <Statistic 
              title="Overdue" 
              value={stats?.overdue || 0} 
              prefix={<CloseCircleOutlined />} 
              valueStyle={{ color: '#f5222d' }}
            />
            <div className="mt-2">
              <Progress 
                percent={stats?.total ? Math.round((stats.overdue / stats.total) * 100) : 0} 
                size="small" 
                status="exception" 
                showInfo
              />
            </div>
          </Card>
        </Col>
      </Row>

       {/* Export Section */}
       <ExportSection 
        title="Export Induction Results"
        fullReportProps={{
          title: "Full Induction Report",
          description: "Export the complete induction data with all staff assignments, statuses, and completion details.",
          buttonText: "Export Full Report"
        }}
        summaryReportProps={{
          title: "Induction Summary",
          description: "Export a concise overview with statistics and completion rates for this induction.",
          buttonText: "Export Summary"
        }}
        induction={induction}
        activeAssignments={activeAssignments}
        completedAssignments={completedAssignments}
        stats={stats}
      />

      {/* Staff Lists */}
      <Tabs 
        defaultActiveKey="active" 
        className="mb-6"
        items={[
          {
            key: 'active',
            label: (
              <span>
                Active Inductions 
                <Badge 
                  count={activeAssignments.length} 
                  style={{ marginLeft: 8, backgroundColor: activeAssignments.length ? '#1890ff' : '#d9d9d9' }} 
                />
              </span>
            ),
            children: (
              <Card bordered={false} className="shadow-md">
                <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center">
                  <Search
                    placeholder="Search by name or email"
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={value => setSearchText(value)}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full sm:w-auto sm:max-w-sm mb-3 sm:mb-0"
                  />
                  
                  <Dropdown
                    menu={{ 
                      items: statusFilterItems,
                      onClick: handleStatusFilterClick 
                    }}
                    trigger={['click']}
                  >
                    <Button 
                      icon={<FilterOutlined />}
                      className={statusFilter.length > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : ''}
                    >
                      <Space>
                        Filter Status
                        {statusFilter.length > 0 && <Tag color="blue">{statusFilter.length}</Tag>}
                      </Space>
                    </Button>
                  </Dropdown>
                </div>
                
                {isMobileView ? (
                  // Mobile view - card list
                  <div>
                    {filteredActiveAssignments.length > 0 ? (
                      filteredActiveAssignments.map(item => renderActiveAssignmentCard(item))
                    ) : (
                      <Empty 
                        description={
                          searchText || statusFilter.length > 0 ? 
                            'No staff members match your search or filters' : 
                            'No active inductions found'
                        } 
                      />
                    )}
                  </div>
                ) : (
                  // Desktop view - table
                  <Table
                    columns={activeColumns}
                    dataSource={filteredActiveAssignments}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ 
                      emptyText: searchText || statusFilter.length > 0 ? 
                        'No staff members match your search or filters' : 
                        'No active inductions found' 
                    }}
                  />
                )}
              </Card>
            )
          },
          {
            key: 'completed',
            label: (
              <span>
                Completed Inductions 
                <Badge 
                  count={completedAssignments.length} 
                  style={{ marginLeft: 8, backgroundColor: completedAssignments.length ? '#52c41a' : '#d9d9d9' }} 
                />
              </span>
            ),
            children: (
              <Card bordered={false} className="shadow-md">
                <div className="mb-4">
                  <Search
                    placeholder="Search by name or email"
                    allowClear
                    enterButton={<SearchOutlined />}
                    onSearch={value => setSearchText(value)}
                    onChange={e => setSearchText(e.target.value)}
                    className="w-full sm:w-auto sm:max-w-sm"
                  />
                </div>
                
                {isMobileView ? (
                  // Mobile view - card list
                  <div>
                    {filteredCompletedAssignments.length > 0 ? (
                      filteredCompletedAssignments.map(item => renderCompletedAssignmentCard(item))
                    ) : (
                      <Empty 
                        description={
                          searchText ? 
                            'No staff members match your search' : 
                            'No completed inductions found'
                        } 
                      />
                    )}
                  </div>
                ) : (
                  // Desktop view - table
                  <Table
                    columns={completedColumns}
                    dataSource={filteredCompletedAssignments}
                    rowKey="id"
                    pagination={{ pageSize: 10 }}
                    locale={{ 
                      emptyText: searchText ? 
                        'No staff members match your search' : 
                        'No completed inductions found' 
                    }}
                  />
                )}
              </Card>
            )
          }
        ]}
      />

    </div>
  );
};

export default InductionResults;