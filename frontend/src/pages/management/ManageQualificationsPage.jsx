import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, Alert, Skeleton, Divider } from 'antd';
import { 
  WarningOutlined, 
  CloseCircleOutlined
} from '@ant-design/icons';
import QualificationOverview from '../../components/qualifications/QualificationOverview';
import QualificationManagement from '../../components/qualifications/QualificationManagement';
import PageHeader from '../../components/PageHeader';
import useAuth from '../../hooks/useAuth';
import { getAllUserQualifications } from '../../api/UserQualificationApi';
import { notifyError } from '../../utils/notificationService';

const ManageQualificationsPage = () => {
  const { user } = useAuth();
  const [qualificationsData, setQualificationsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    expiring: 0,
    expired: 0,
    users: 0
  });

  // Fetch all qualifications for overview stats
  const fetchQualificationsOverview = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await getAllUserQualifications(user);
      const qualifications = response.qualifications || [];
      setQualificationsData(qualifications);
      
      // Calculate stats
      const now = new Date();
      const twoMonths = new Date(now.getTime() + (60 * 24 * 60 * 60 * 1000));
      
      const activeCount = qualifications.filter(qual => 
        !qual.expiryDate || new Date(qual.expiryDate) >= now
      ).length;
      
      const expiringCount = qualifications.filter(qual => 
        qual.expiryDate && 
        new Date(qual.expiryDate) >= now && 
        new Date(qual.expiryDate) < twoMonths
      ).length;
      
      const expiredCount = qualifications.filter(qual => 
        qual.expiryDate && new Date(qual.expiryDate) < now
      ).length;
      
      const uniqueUsers = new Set(qualifications.map(qual => qual.userId)).size;
      
      setStats({
        total: qualifications.length,
        active: activeCount,
        expiring: expiringCount,
        expired: expiredCount,
        users: uniqueUsers
      });
      
    } catch (error) {
      console.error('Error fetching qualifications overview:', error);
      notifyError('Failed to load qualifications overview', 'Please try again later');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualificationsOverview();
  }, [user]);

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Manage Qualifications & Certificates - AUT Events Induction Portal</title>
          <meta 
            name="description" 
            content="Manage user qualifications and certificates for AUT Events staff" 
          />
        </Helmet>

        <PageHeader 
          title="Qualification & Certificate Management" 
          subtext="Monitor and manage staff qualifications and track expiry dates."
        />

        <div className="min-h-screen bg-gray-50 py-6">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            {/* Overview Skeleton */}
            <Card className="shadow-md mb-6">
              <div className="space-y-6">
                <Skeleton.Button active style={{ width: '200px', height: '32px' }} />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[1, 2, 3, 4].map(i => (
                    <Skeleton.Button 
                      key={i} 
                      active 
                      style={{ width: '100%', height: '100px' }} 
                    />
                  ))}
                </div>
                <Skeleton active paragraph={{ rows: 8 }} />
              </div>
            </Card>

            {/* Divider Skeleton */}
            <div className="mb-6">
              <Skeleton.Button active style={{ width: '200px', height: '32px' }} />
            </div>

            {/* Management Skeleton */}
            <Card className="shadow-md">
              <div className="space-y-4">
                {/* Filters Skeleton */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i}>
                        <Skeleton.Button active style={{ width: '100%', height: '16px', marginBottom: '8px' }} />
                        <Skeleton.Button active style={{ width: '100%', height: '32px' }} />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Skeleton.Button active style={{ width: '150px', height: '24px' }} />
                    <div className="flex space-x-2">
                      <Skeleton.Button active style={{ width: '100px', height: '32px' }} />
                      <Skeleton.Button active style={{ width: '100px', height: '32px' }} />
                      <Skeleton.Button active style={{ width: '80px', height: '32px' }} />
                    </div>
                  </div>
                </div>

                {/* Table Skeleton */}
                <div className="bg-white shadow-sm rounded-lg p-4">
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                      <Skeleton.Button 
                        key={i} 
                        active 
                        style={{ width: '100%', height: '48px' }} 
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Manage Qualifications - AUT Events Induction Portal</title>
        <meta 
          name="description" 
          content="Manage user qualifications and certificates for AUT Events staff" 
        />
      </Helmet>

      <PageHeader 
        title="Qualification Management" 
        subtext="Monitor and manage staff qualifications, track expiry dates, and request certificates from team members."
      />

      <div className="min-h-screen bg-gray-50 py-6">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

          {/* Critical Alerts */}
          {stats.expired > 0 && (
            <Alert
              message="Urgent: Expired Qualifications"
              description={`There are ${stats.expired} expired qualification${stats.expired > 1 ? 's' : ''} that require immediate attention.`}
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          
          {stats.expiring > 0 && (
            <Alert
              message="Expiring Soon"
              description={`${stats.expiring} qualification${stats.expiring > 1 ? 's' : ''} will expire within 2 months.`}
              type="warning"
              showIcon
              className="mb-4"
            />
          )}

          {/* Overview Section */}
          <Card className="shadow-md mb-6">
            <QualificationOverview 
              qualifications={qualificationsData}
              stats={stats}
              onRefresh={fetchQualificationsOverview}
            />
          </Card>

          {/* Divider */}
          <div className="mb-6">
            <Divider>
              <span className="text-lg font-semibold text-gray-700">All Qualifications & Certificates</span>
            </Divider>
          </div>

          {/* Management Section */}
          <Card className="shadow-md">
            <QualificationManagement 
              qualifications={qualificationsData}
              loading={false}
              onRefresh={fetchQualificationsOverview}
            />
          </Card>
        </div>
      </div>
    </>
  );
};

export default ManageQualificationsPage;