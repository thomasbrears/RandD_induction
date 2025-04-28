import React, { useState } from 'react';
import { Card, Tabs, Empty, Badge, Tag, Button, Typography, Spin } from 'antd';
import { FileOutlined, InboxOutlined, ArrowRightOutlined, LoadingOutlined } from '@ant-design/icons';
import { formatDate } from '../../utils/dateUtils';
import Status from '../../models/Status';

const { Text } = Typography;

/**
 * Component to display a users inductions in a read-only list view
 * 
 * @param {Object} props
 * @param {Array} props.inductions - Array of induction objects
 * @param {string} props.userId - User ID
 * @param {function} props.onManageInductions - Function to call when Manage Inductions button is clicked
 * @param {function} props.onViewResults - Function to call when View Results button is clicked for a completed induction
 * @param {boolean} props.loadingResults - Whether the results are currently being loaded
 */
const UserInductionsList = ({ 
  inductions = [], 
  userId, 
  onManageInductions, 
  onViewResults,
  loadingResults = false 
}) => {
  const [activeTabKey, setActiveTabKey] = useState('active');

  // Get induction name
  const getInductionName = (induction) => {
    return induction.name || induction.inductionName || (induction.induction?.name) || "Induction";
  };

  // Get completion date
  const getCompletionDate = (induction) => {
    return induction.completionDate || induction.completedAt;
  };

  // Get induction status badge
  const getStatusBadge = (status) => {
    switch(status) {
      case Status.ASSIGNED:
        return <Tag color="blue">Assigned</Tag>;
      case Status.IN_PROGRESS:
        return <Tag color="gold">In Progress</Tag>;
      case Status.COMPLETE:
        return <Tag color="green">Completed</Tag>;
      case Status.OVERDUE:
        return <Tag color="red">OVERDUE</Tag>;
      default:
        return <Tag color="default">Unknown</Tag>;
    }
  };

  // Handle viewing results for a specific induction
  const handleViewInductionResults = (induction) => {
    onViewResults(induction);
  };

  // Separate inductions by status
  const activeInductions = (inductions || [])
    .filter(induction => induction.status !== Status.COMPLETE)
    .sort((a, b) => {
      // Overdue items first
      if (a.status === Status.OVERDUE && b.status !== Status.OVERDUE) return -1;
      if (a.status !== Status.OVERDUE && b.status === Status.OVERDUE) return 1;
      
      // Then sort by due date
      const dateA = a.dueDate ? new Date(a.dueDate) : new Date(9999, 11, 31);
      const dateB = b.dueDate ? new Date(b.dueDate) : new Date(9999, 11, 31);
      
      return dateA - dateB;
    });
    
  const completedInductions = (inductions || [])
    .filter(induction => induction.status === Status.COMPLETE);

  // Tab items configuration
  const tabItems = [
    {
      key: 'active',
      label: (
        <span>
          Active 
          <Badge 
            count={activeInductions.length} 
            style={{ marginLeft: 8, backgroundColor: activeInductions.length ? '#1890ff' : '#d9d9d9' }} 
          />
        </span>
      ),
      children: activeInductions.length === 0 ? (
        <Empty
          image={<InboxOutlined style={{ fontSize: 40 }} />}
          description="No active inductions"
        />
      ) : (
        <div className="space-y-2 mt-2">
          {activeInductions.map((induction, index) => (
            <Card 
              key={index} 
              size="small" 
              className="shadow-sm hover:shadow-md transition-shadow"
              bordered
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text strong>{getInductionName(induction)}</Text>
                    {getStatusBadge(induction.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>Available From: {formatDate(induction.availableFrom)}</div>
                    <div>Due on: {formatDate(induction.dueDate)}</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    },
    {
      key: 'completed',
      label: (
        <span>
          Completed 
          <Badge 
            count={completedInductions.length} 
            style={{ marginLeft: 8, backgroundColor: completedInductions.length ? '#52c41a' : '#d9d9d9' }} 
          />
        </span>
      ),
      children: completedInductions.length === 0 ? (
        <Empty
          image={<InboxOutlined style={{ fontSize: 40 }} />}
          description="No completed inductions"
        />
      ) : (
        <div className="space-y-2 mt-2">
          {loadingResults && (
            <div className="flex justify-center items-center py-4 text-gray-500">
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <span className="ml-2">Loading results data...</span>
            </div>
          )}
          {completedInductions.map((induction, index) => (
            <Card 
              key={index} 
              size="small" 
              className="shadow-sm hover:shadow-md transition-shadow"
              bordered
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Text strong>{getInductionName(induction)}</Text>
                    {getStatusBadge(induction.status)}
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>Completed on: {formatDate(getCompletionDate(induction))}</div>
                    <div>Due date: {formatDate(induction.dueDate)}</div>
                  </div>
                </div>
                <div>
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => handleViewInductionResults(induction)}
                      > View Results
                    </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )
    }
  ];

  return (
    <Card 
      className="mx-auto max-w-4xl shadow-lg mt-6"
      title={
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FileOutlined className="mr-2" />
            <span>Assigned Inductions</span>
          </div>
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={onManageInductions}
          >Manage Inductions
          </Button>
        </div>
      }
    >
      {!inductions || inductions.length === 0 ? (
        <Empty
          image={<InboxOutlined style={{ fontSize: 60 }} />}
          description={
            <span className="text-gray-500">
              No inductions assigned to this user yet
            </span>
          }
        />
      ) : (
        <Tabs 
          activeKey={activeTabKey} 
          onChange={setActiveTabKey}
          items={tabItems}
          className="mt-2"
        />
      )}
    </Card>
  );
};

export default UserInductionsList;