import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Row,
  Col,
  Skeleton,
  Empty,
  Tag
} from 'antd';
import { 
  CalendarOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import QualificationStatusTag from './QualificationStatusTag';
import useAuth from '../../hooks/useAuth';
import { getUserQualifications } from '../../api/UserQualificationApi';
import { formatDate } from '../../utils/dateUtils';
import { notifyError } from '../../utils/notificationService';

const QualificationsSummary = ({ title = "My Certificates & Qualifications" }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's qualifications
  const fetchQualifications = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await getUserQualifications(user, user.uid);
      const quals = response.qualifications || [];
      setQualifications(quals);
    } catch (error) {
      console.error('Error fetching qualifications:', error);
      notifyError('Failed to load qualifications', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualifications();
  }, [user]);

  // Calculate stats
  const getStats = () => {
    const now = new Date();
    const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
    
    return {
      total: qualifications.length,
      expired: qualifications.filter(qual => 
        qual.expiryDate && new Date(qual.expiryDate) < now
      ).length,
      expiring: qualifications.filter(qual => 
        qual.expiryDate && 
        new Date(qual.expiryDate) >= now && 
        new Date(qual.expiryDate) < twoMonths
      ).length
    };
  };

  const stats = getStats();

  // Navigation handler
  const handleManage = () => {
    navigate('/account/qualifications');
  };

  // Get qualifications sorted by expiry date (earliest first)
  const getDisplayQualifications = () => {
    const sorted = [...qualifications].sort((a, b) => {
      // Items without expiry date go to the end
      if (!a.expiryDate && !b.expiryDate) return 0;
      if (!a.expiryDate) return 1;
      if (!b.expiryDate) return -1;
      // Sort by expiry date, earliest first
      return new Date(a.expiryDate) - new Date(b.expiryDate);
    });
    
    // Limit to 3 total
    return sorted.slice(0, 3);
  };

  const displayQualifications = getDisplayQualifications();

  if (loading) {
    return (
      <Card 
        className="shadow-md mt-6"
        title={
          <div className="flex items-center gap-2">
            <span>{title}</span>
          </div>
        }
      >
        <Row gutter={[12, 12]}>
          {[1, 2, 3].map(i => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card className="h-24">
                <Skeleton active paragraph={{ rows: 1 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </Card>
    );
  }

  return (
    <Card 
      className="shadow-md mt-6"
      title={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>{title}</span>
            {stats.total > 0 && (
              <Tag color="blue" className="ml-2">{stats.total}</Tag>
            )}
          </div>
          {stats.total > 3 && (
            <Button type="link" size="small" onClick={handleManage}>
              View all {stats.total} →
            </Button>
          )}
        </div>
      }
    >



      {/* Qualification Cards */}
      <Row gutter={[12, 12]}>
        {qualifications.length === 0 ? (
          // Empty state as a card
          <Col xs={24}>
            <Card className="text-center border-dashed border-gray-300 bg-gray-50">
              <div className="py-4">
                <div className="text-sm text-gray-600">No qualifications yet</div>
                <Button 
                  type="primary" 
                  size="small" 
                  className="mt-2"
                  onClick={handleManage}
                >
                  Add a Qualification
                </Button>
              </div>
            </Card>
          </Col>
        ) : (
          <>
            {/* Qualification Cards */}
            {displayQualifications.map((qual) => {
              const isExpired = qual.expiryDate && new Date(qual.expiryDate) < new Date();
              const isExpiringSoon = qual.expiryDate && 
                new Date(qual.expiryDate) < new Date(Date.now() + (60 * 24 * 60 * 60 * 1000)) && 
                !isExpired;

              return (
                <Col xs={24} sm={12} lg={8} key={qual.id}>
                  <Card 
                    className={`h-full ${isExpired ? 'border-red-300' : isExpiringSoon ? 'border-orange-300' : ''}`}
                    size="small"
                  >
                    <div className="space-y-2">
                      {/* Title and Status */}
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate" title={qual.qualificationName}>
                            {qual.qualificationName}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {qual.qualificationType}
                          </div>
                        </div>
                        <QualificationStatusTag 
                          status={qual.status} 
                          expiryDate={qual.expiryDate}
                        />
                      </div>

                      {/* Expiry Date */}
                      {qual.expiryDate && (
                        <div className="flex items-center text-xs">
                          <CalendarOutlined className="mr-1" />
                          <span className={isExpired ? 'text-red-600 font-medium' : isExpiringSoon ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                            Expires: {formatDate(qual.expiryDate)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Card>
                </Col>
              );
            })}

            {/* Action Card */}
            <Col xs={24} sm={12} lg={8}>
              <Card 
                className="h-full border-dashed border-blue-300 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors"
                size="small"
                onClick={handleManage}
              >
                <div className="text-center py-2">
                  <div className="text-sm font-medium text-blue-700">
                    {qualifications.length > 0 ? 'Manage Qualifications' : 'Add New'}
                  </div>
                  <div className="text-xs text-blue-600">
                    {qualifications.length > 0 ? `Click here to Add, View & Manage` : 'Upload qualification'}
                  </div>
                </div>
              </Card>
            </Col>
          </>
        )}
      </Row>
    </Card>
  );
};

export default QualificationsSummary;