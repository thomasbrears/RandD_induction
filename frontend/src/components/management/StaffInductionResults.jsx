import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Button, Skeleton, Empty, Collapse, Space } from 'antd';
import { 
  ClockCircleOutlined, CheckCircleOutlined, WarningOutlined,
  LeftOutlined, UpOutlined, DownOutlined
} from '@ant-design/icons';
import useAuth from '../../hooks/useAuth';
import { getInduction } from '../../api/InductionApi';
import { getUserInductionById } from '../../api/UserInductionApi';
import { getUser } from '../../api/UserApi';
import { notifyError } from '../../utils/notificationService';
import Status from '../../models/Status';
import { formatDate, formatDuration } from '../../utils/dateUtils';
import { SectionRenderer } from './QuestionResponseRenderer';
import FeedbackSection from './FeedbackSection';
import ExportSection from './ExportSection';
import '../../style/Results.css';

const { Panel } = Collapse;

const StaffInductionResults = ({ userId, assignmentId, pageTitle, compactHeader = false }) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [userInduction, setUserInduction] = useState(null);
  const [induction, setInduction] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [answers, setAnswers] = useState({});
  const [collapsedQuestions, setCollapsedQuestions] = useState({});
  const [activeSectionKeys, setActiveSectionKeys] = useState(['0']); // Default to first section open

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {        
        // Get user induction assignment data
        const userInductionData = await getUserInductionById(currentUser, assignmentId);
        setUserInduction(userInductionData);
        
        if (userInductionData?.inductionId) {          
          // Get induction details
          const inductionData = await getInduction(currentUser, userInductionData.inductionId);
          setInduction(inductionData);
          
          // Process answers if available
          if (userInductionData?.answers) {
            processSectionsAndAnswers(inductionData, userInductionData.answers);
          } else {
            console.log("No answers found in user induction data");
          }
        }
        
        // Get user details
        if (userId) {
          const userResponse = await getUser(currentUser, userId);
          const userDataValue = userResponse.data || userResponse;
          setUserData(userDataValue);
        }
      } catch (error) {
        console.error("Error fetching induction results:", error);
        notifyError("Failed to load results", "Please try again later");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser && assignmentId) {
      fetchData();
    }
  }, [currentUser, assignmentId, userId]);

  // Process sections and answers data
  const processSectionsAndAnswers = (inductionData, answerData) => {
    if (!inductionData || !answerData) {
      console.log("Missing induction or answer data");
      return;
    }
    
    // Check if we need to convert from flat questions to sections structure
    let sectionsToUse = [];
    
    if (inductionData.sections) {
      // If sections already exist, use them
      sectionsToUse = inductionData.sections;
    } else if (inductionData.questions) {
      // If we only have a flat questions array, create a single default section
      sectionsToUse = [{
        title: "Main Section",
        questions: inductionData.questions
      }];
    } else {
      return;
    }
    
    setSections(sectionsToUse);
        
    // Organise answers by question ID for easy lookup
    const answersMap = {};
    
    if (Array.isArray(answerData)) {
      answerData.forEach((answer) => {
        if (answer && answer.questionId) {
          answersMap[answer.questionId] = answer;
        }
      });
    }
    
    setAnswers(answersMap);
    
    // Initialise collapsed state for all questions
    const initialCollapsedState = {};
    sectionsToUse.forEach(section => {
      section.questions?.forEach(question => {
        initialCollapsedState[question.id] = false; // Start with all expanded
      });
    });
    setCollapsedQuestions(initialCollapsedState);
  };

  // Function to toggle question collapse
  const toggleQuestionCollapsed = (questionId) => {
    setCollapsedQuestions(prev => ({
      ...prev,
      [questionId]: !prev[questionId]
    }));
  };

  // Function to collapse all questions
  const collapseAllQuestions = () => {
    const newState = {};
    sections.forEach(section => {
      section.questions?.forEach(question => {
        newState[question.id] = true; // true means collapsed
      });
    });
    setCollapsedQuestions(newState);
  };

  // Function to expand all questions
  const expandAllQuestions = () => {
    const newState = {};
    sections.forEach(section => {
      section.questions?.forEach(question => {
        newState[question.id] = false; // false means expanded
      });
    });
    setCollapsedQuestions(newState);
  };

  // Status tag component
  const StatusTag = ({ status }) => {
    const statusMap = {
      [Status.ASSIGNED]: { color: 'blue', text: 'Assigned', icon: <ClockCircleOutlined /> },
      [Status.IN_PROGRESS]: { color: 'orange', text: 'In Progress', icon: <ClockCircleOutlined /> },
      [Status.COMPLETE]: { color: 'green', text: 'Completed', icon: <CheckCircleOutlined /> },
      [Status.OVERDUE]: { color: 'red', text: 'Overdue', icon: <WarningOutlined /> },
      // String versions for backward compatibility
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

  // Determine if induction is completed
  const isCompleted = userInduction?.status === 'complete' || userInduction?.status === Status.COMPLETE;

  // Get user display name
  const getUserName = () => {
    const userDataValue = userData?.data || userData;
    
    if (userDataValue?.displayName) {
      return userDataValue.displayName;
    } else if (userDataValue?.firstName && userDataValue?.lastName) {
      return `${userDataValue.firstName} ${userDataValue.lastName}`;
    } else {
      return 'Staff Member';
    }
  };

  // Get user email
  const getUserEmail = () => {
    const userDataValue = userData?.data || userData;
    return userDataValue?.email || 'No email available';
  };

  // Render skeleton loading state
  if (loading) {
    return (
      <div className="w-full">
        <div className="mb-8">
          <Skeleton.Input active size="large" style={{ width: '60%', marginBottom: '8px' }} />
        </div>
        
        <Card className="mb-8 shadow-md">
          <Skeleton active paragraph={{ rows: 4 }} />
        </Card>

        <Card className="mb-8 shadow-md">
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>

        <Card className="mb-8 shadow-md">
          <Skeleton active paragraph={{ rows: 5 }} />
        </Card>
        
        <Card className="shadow-md mb-6">
          <Skeleton active paragraph={{ rows: 2 }} />
        </Card>
      </div>
    );
  }

  // Render empty state if no user induction or induction data
  if (!userInduction || !induction) {
    return (
      <Empty 
        description={
          <div>
            <p className="text-lg font-medium mb-2">Induction results not found</p>
            <p className="text-gray-500">The requested induction or user data could not be loaded.</p>
          </div>
        } 
        image={Empty.PRESENTED_IMAGE_SIMPLE} 
      />
    );
  }

  return (
    <div className="w-full min-h-screen px-2 sm:px-4 lg:px-6" style={{ maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Header Section - only show full header if not compactHeader */}
      {!compactHeader ? (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4 gap-2">
            <Button 
              icon={<LeftOutlined />} 
              onClick={() => navigate(`/management/results/induction/${induction.id}`)}
              className="shrink-0"
              size="small sm:default"
            >
              <span className="hidden sm:inline">Back to Induction Results</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-800 break-words">
              {getUserName()} - {induction.name}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <StatusTag status={userInduction.status} />
              <span className="text-sm sm:text-base text-gray-600 break-all">
                {getUserEmail()}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-4">
            <Button 
              icon={<LeftOutlined />} 
              onClick={() => navigate(`/management/results/induction/${induction.id}`)}
              size="small sm:default"
            >
              <span className="hidden sm:inline">Back to Induction Results</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      )}

      {/* Summary Card */}
      <Card className="mb-6 sm:mb-8 shadow-md overflow-hidden mx-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base sm:text-lg font-semibold">Induction Summary</h2>
        </div>
        <div className="overflow-x-auto">
          <Descriptions 
            bordered 
            column={{ xxl: 4, xl: 3, lg: 3, md: 2, sm: 1, xs: 1 }}
            size="small"
            className="min-w-0"
          >
            <Descriptions.Item label="Status">
              <StatusTag status={userInduction.status} />
            </Descriptions.Item>
            <Descriptions.Item label="Induction" className="break-words">
              <span className="break-words">{induction.name}</span>
            </Descriptions.Item>
            <Descriptions.Item label="User" className="break-words">
              <span className="break-words">{getUserName()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Email" className="break-all">
              <span className="break-all text-sm">{getUserEmail()}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Assigned Date">
              <span className="text-sm">{formatDate(userInduction.assignedAt)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Available From">
              <span className="text-sm">{formatDate(userInduction.availableFrom)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Due Date">
              <span className="text-sm">{formatDate(userInduction.dueDate)}</span>
            </Descriptions.Item>
            <Descriptions.Item label="Started Date">
              <span className="text-sm">
                {userInduction.startedAt ? formatDate(userInduction.startedAt) : 'Not available'}
              </span>
            </Descriptions.Item>
            {isCompleted && (
              <>
                <Descriptions.Item label="Completed Date">
                  <span className="text-sm">
                    {userInduction.completedAt ? formatDate(userInduction.completedAt) : 'Not completed'}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Completion Time">
                  <span className="text-sm">
                    {userInduction.startedAt && userInduction.completedAt 
                      ? formatDuration(userInduction.startedAt, userInduction.completedAt) 
                      : 'Not available'}
                  </span>
                </Descriptions.Item>
              </>
            )}
          </Descriptions>
        </div>
      </Card>

      {/* Export Section - Only shown if completed */}
      <ExportSection 
        isCompleted={isCompleted}
        userInduction={userInduction}
        induction={induction}
        userData={userData}
        sections={sections}
        answers={answers}
        isStaffContext={true}
      />

      {isCompleted ? (
        <>
          {/* Responses Section - Only shown if completed */}
          <Card 
            title={
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold">Induction Responses</h2>
                <Space size="small" wrap>
                  <Button onClick={expandAllQuestions} icon={<DownOutlined />} size="small"><span className="hidden sm:inline">Expand All</span><span className="sm:hidden">Expand</span></Button>
                  <Button onClick={collapseAllQuestions} icon={<UpOutlined />}size="small"><span className="hidden sm:inline">Collapse All</span><span className="sm:hidden">Collapse</span></Button>
                </Space>
              </div>
            }
            className="shadow-md mb-6 mx-0"
          >
            {sections.length === 0 ? (
              <Empty description="No responses available" />
            ) : (
              <Collapse 
                defaultActiveKey={activeSectionKeys} 
                className="bg-white border-0"
                onChange={(keys) => setActiveSectionKeys(keys)}
                items={sections.map((section, sectionIndex) => ({
                  key: sectionIndex.toString(),
                  label: section.title || `Section ${sectionIndex + 1}`,
                  children: (
                    <SectionRenderer
                      section={section}
                      answers={answers}
                      collapsedQuestions={collapsedQuestions}
                      onToggleCollapsed={toggleQuestionCollapsed}
                    />
                  )
                }))}
              />
            )}
          </Card>
          
          {/* Feedback Section - Only shown if completed */}
          <Card 
            title={<h2 className="text-lg font-semibold">Feedback</h2>} 
            className="shadow-md overflow-hidden"
          >
            {userInduction.feedback ? (
              <FeedbackSection userInduction={userInduction} />
            ) : (
              <Empty 
                description="No feedback provided" 
                image={Empty.PRESENTED_IMAGE_SIMPLE} 
              />
            )}
          </Card>
        </>
      ) : (
        // If induction is not completed, show in progress message
        <Card className="shadow-md">
          <div className="text-center py-6">
            <div className="mb-4">
              <Tag color="orange" icon={<ClockCircleOutlined />} className="text-lg px-4 py-2">
                Induction In Progress
              </Tag>
            </div>
            <p className="text-gray-600 mb-2">
              {getUserName()} has not yet completed this induction.
            </p>
            <p className="text-gray-500">
              Detailed responses will be available once the induction is completed.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
};

export default StaffInductionResults;