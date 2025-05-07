import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import InductionResultsComponent from '../../components/management/InductionResults';
import { getInduction } from '../../api/InductionApi';
import useAuth from '../../hooks/useAuth';

const InductionResultsPage = () => {
  const { inductionId } = useParams();
  const { user: currentUser } = useAuth();
  const [pageTitle, setPageTitle] = useState("Induction Results Details");
  const [pageSubtext, setPageSubtext] = useState("View detailed statistics and participant data");
  
  // Function to update page header with induction name
  const updatePageHeader = (inductionName) => {
    if (inductionName) {
      setPageTitle(`${inductionName} Results`);
      setPageSubtext(`View detailed statistics and completion data for ${inductionName}`);
    }
  };

  // Fetch induction name for the header
  useEffect(() => {
    const fetchInductionName = async () => {
      if (currentUser && inductionId) {
        try {
          const inductionData = await getInduction(currentUser, inductionId);
          if (inductionData && inductionData.name) {
            updatePageHeader(inductionData.name);
          }
        } catch (error) {
          console.error("Error fetching induction details for header:", error);
        }
      }
    };
    
    fetchInductionName();
  }, [inductionId, currentUser]);

  return (
    <>
      <Helmet><title>{pageTitle} | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header with dynamic induction name */}
      <PageHeader 
        title={pageTitle} 
        subtext={pageSubtext} 
      />
     
      {/* Main container */}
      <div className="flex bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <InductionResultsComponent 
            inductionId={inductionId} 
            setPageHeader={updatePageHeader}
          />
        </div>
      </div>
    </>
  );
};

export default InductionResultsPage;