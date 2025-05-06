import React, { useState, useEffect } from 'react';
import { Card, Select, Button, Divider, Spin, Empty, Alert, Skeleton, Typography } from 'antd';
import { BarChartOutlined, UserOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { getAllInductions } from '../../api/InductionApi';
import { getUserInductions } from '../../api/UserInductionApi';
import { getAllUsers } from '../../api/UserApi';
import { notifyError } from '../../utils/notificationService';
import { formatDate } from '../../utils/dateUtils';

const { Option } = Select;
const { Text } = Typography;

const ResultsHub = () => {
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [inductions, setInductions] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingInductions, setLoadingInductions] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingUserInductions, setLoadingUserInductions] = useState(false);
  const [selectedUserInductions, setSelectedUserInductions] = useState([]);
  const [selectedUserInductionId, setSelectedUserInductionId] = useState(null);
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  // Fetch all inductions on mount
  useEffect(() => {
    const fetchInductions = async () => {
      setLoadingInductions(true);
      try {
        const data = await getAllInductions(currentUser);
        // Filter out draft inductions for results
        const publishedInductions = data.filter(induction => !induction.isDraft);
        setInductions(publishedInductions);
      } catch (error) {
        console.error("Error fetching inductions:", error);
        notifyError("Failed to load inductions", "Please try again later");
      } finally {
        setLoadingInductions(false);
      }
    };

    if (currentUser) {
      fetchInductions();
    }
  }, [currentUser]);

  // Fetch all users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoadingUsers(true);
      try {
        const data = await getAllUsers(currentUser);
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
        notifyError("Failed to load users", "Please try again later");
      } finally {
        setLoadingUsers(false);
      }
    };

    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser]);

  // Fetch user inductions when selecting a user
  useEffect(() => {
    const fetchUserInductions = async () => {
      if (!selectedUser) {
        setSelectedUserInductions([]);
        setSelectedUserInductionId(null);
        return;
      }

      setLoadingUserInductions(true);
      try {
        const userInductionsData = await getUserInductions(currentUser, selectedUser);
        const completedInductions = userInductionsData.filter(ind => ind.status === 'complete');
        setSelectedUserInductions(completedInductions);
        
        // Set the first induction as selected by default if available
        if (completedInductions.length > 0) {
          setSelectedUserInductionId(completedInductions[0].id);
        } else {
          setSelectedUserInductionId(null);
        }
      } catch (error) {
        console.error("Error fetching user inductions:", error);
        notifyError("Failed to load user inductions", "Please try again later");
      } finally {
        setLoadingUserInductions(false);
      }
    };

    if (currentUser && selectedUser) {
      fetchUserInductions();
    }
  }, [currentUser, selectedUser]);

  // Handle viewing induction results
  const handleViewInductionResults = () => {
    if (selectedInduction) {
      navigate(`/management/results/induction/${selectedInduction}`);
    } else {
      notifyError("Selection Required", "Please select an induction to view results");
    }
  };

  // Handle viewing user's induction results
  const handleViewUserInductionResults = () => {
    if (selectedUser && selectedUserInductionId) {
      navigate(`/management/results/user/${selectedUser}/${selectedUserInductionId}`);
    } else {
      notifyError("Selection Required", "Please select a user and an induction to view results");
    }
  };

  // No induction data to display
  const renderInductionsEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span className="text-gray-500">
          No published inductions found. Please create and publish an induction first.
        </span>
      }
    />
  );

  // No user data to display
  const renderUsersEmptyState = () => (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={
        <span className="text-gray-500">
          No staff members found in the system. Please add staff members or try again.
        </span>
      }
    />
  );

  return (
    <div className="w-full mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* View Induction Results Card */}
        <Card
          title={
            <div className="flex items-center">
              <BarChartOutlined className="mr-2 text-blue-600" />
              <span>Induction Results</span>
            </div>
          }
          className="shadow-md hover:shadow-lg transition-shadow"
          bordered={false}
        >
          <p className="mb-4 text-gray-600">
            View overall statistics and results for a specific induction
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Induction
            </label>
            {loadingInductions ? (
              <Skeleton.Input active size="large" block={true} className="mb-2" />
            ) : (
              <Select
                placeholder="Choose an induction"
                className="w-full"
                value={selectedInduction}
                onChange={setSelectedInduction}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent={inductions.length === 0 ? renderInductionsEmptyState() : null}
              >
                {inductions.map(induction => (
                  <Option key={induction.id} value={induction.id}>
                    {induction.name}
                  </Option>
                ))}
              </Select>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              type="primary"
              size="large"
              onClick={handleViewInductionResults}
              disabled={!selectedInduction || loadingInductions}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600"
            >View Results
            </Button>
          </div>
        </Card>

        {/* View Staff Results Card */}
        <Card
          title={
            <div className="flex items-center">
              <UserOutlined className="mr-2 text-blue-600" />
              <span>Staff Member Results</span>
            </div>
          }
          className="shadow-md hover:shadow-lg transition-shadow"
          bordered={false}
        >
          <p className="mb-4 text-gray-600">
            View individual results for a specific staff member
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Staff Member
            </label>
            {loadingUsers ? (
              <Skeleton.Input active size="large" block={true} className="mb-4" />
            ) : (
              <Select
                placeholder="Choose a staff member"
                className="w-full mb-4"
                value={selectedUser}
                onChange={setSelectedUser}
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
                notFoundContent={users.length === 0 ? renderUsersEmptyState() : null}
              >
                {users.map(user => (
                  <Option key={user.uid} value={user.uid}>
                    {user.displayName || (user.firstName && user.lastName) 
                      ? `${user.firstName || ''} ${user.lastName || user.displayName || ''}${user.email ? ` (${user.email})` : ''}`
                      : user.email}
                  </Option>
                ))}
              </Select>
            )}

            <label className="block text-sm font-medium text-gray-700 mb-1">
              Select Induction
            </label>
            
            {loadingUserInductions && selectedUser ? (
              <div className="py-2">
                <Skeleton.Input active size="large" block={true} />
                <div className="flex items-center justify-center mt-2">
                  <Spin size="small" className="mr-2" />
                  <span className="text-gray-500 text-sm">Loading staff member's inductions...</span>
                </div>
              </div>
            ) : (
              <>
                <Select
                  placeholder="Choose an induction"
                  className="w-full"
                  disabled={!selectedUser || selectedUserInductions.length === 0}
                  value={selectedUserInductionId}
                  onChange={setSelectedUserInductionId}
                  showSearch
                  optionFilterProp="label"
                  filterOption={(input, option) => {
                    // Using option.label (the text value) for filtering
                    return option.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                  }}
                >
                  {selectedUserInductions.map(induction => (
                    <Option 
                      key={induction.id} 
                      value={induction.id}
                      label={induction.inductionName || "Unnamed Induction"}
                    >
                      <div className="flex items-center justify-between">
                        <div>{induction.inductionName || "Unnamed Induction"}</div>
                        <div className="flex items-center">
                          {(induction.completedAt || induction.dueDate) && (
                            <Text type="secondary" className="text-xs ml-2">
                              <CalendarOutlined className="mr-1" />
                              {induction.completedAt ? 
                                `Completed: ${formatDate(induction.completedAt)}` : 
                                (induction.dueDate ? `Due: ${formatDate(induction.dueDate)}` : '')}
                            </Text>
                          )}
                        </div>
                      </div>
                    </Option>
                  ))}
                </Select>

                {selectedUser && !loadingUserInductions && selectedUserInductions.length === 0 && (
                  <Alert
                    message="No completed inductions"
                    description="This staff member has not completed any inductions yet. Please check back later or select another staff member."
                    type="info"
                    showIcon
                    className="mt-4"
                  />
                )}
              </>
            )}
          </div>

          <div className="flex justify-center">
            <Button
              type="primary"
              size="large"
              onClick={handleViewUserInductionResults}
              disabled={!selectedUser || selectedUserInductions.length === 0 || loadingUserInductions}
              className="bg-blue-600 hover:bg-blue-700 border-blue-600"
            >View Results
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ResultsHub;