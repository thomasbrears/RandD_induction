import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import StaffInductionResultsComponent from '../../components/management/StaffInductionResults';
import { getInduction } from '../../api/InductionApi';
import { getUserInductionById } from '../../api/UserInductionApi';
import { getUser } from '../../api/UserApi';
import useAuth from '../../hooks/useAuth';

const StaffInductionResultsPage = () => {
  const { userId, assignmentId } = useParams();
  const { user: currentUser } = useAuth();
  const [pageTitle, setPageTitle] = useState("Staff Induction Results");
  const [pageSubtext, setPageSubtext] = useState("View detailed responses and completion data");
  const [userName, setUserName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [inductionName, setInductionName] = useState("");
  
  // Fetch user and induction names for the header
  useEffect(() => {
    const fetchHeaderInfo = async () => {
      try {
        let userFirstName = "";
        let userFullName = "";
        let inductionTitle = "";
        
        // Fetch user data
        if (userId && currentUser) {
          const userResponse = await getUser(currentUser, userId);
          // Handle both possible data structures
          const userData = userResponse.data || userResponse;
          
          if (userData) {
            // Get full name
            userFullName = userData.displayName || 
              (userData.firstName && userData.lastName ? 
                `${userData.firstName} ${userData.lastName}` : userData.email || "Staff Member");
            
            // Get first name
            userFirstName = userData.firstName || 
              (userData.displayName ? userData.displayName.split(" ")[0] : "this staff member");
            
            setUserName(userFullName);
            setFirstName(userFirstName);
          }
        }
        
        // Fetch induction data from assignment
        if (assignmentId && currentUser) {
          const userInduction = await getUserInductionById(currentUser, assignmentId);
          
          if (userInduction && userInduction.inductionId) {
            // Try to get from induction name in assignment first
            if (userInduction.inductionName) {
              inductionTitle = userInduction.inductionName;
            } else {
              // If not available, fetch the full induction
              const inductionData = await getInduction(currentUser, userInduction.inductionId);
              if (inductionData && inductionData.name) {
                inductionTitle = inductionData.name;
              }
            }
            
            setInductionName(inductionTitle);
          }
        }
        
        // Update page title and subtext once we have both pieces of info
        if (userFullName && inductionTitle) {
          setPageTitle(`${userFullName} - ${inductionTitle}`);
          setPageSubtext(`View ${userFirstName}'s detailed responses and completion data`);
        } else if (userFullName) {
          setPageTitle(`${userFullName}'s Induction Results`);
        } else if (inductionTitle) {
          setPageTitle(`Staff Results for ${inductionTitle}`);
        }
      } catch (error) {
        console.error("Error fetching header info:", error);
      }
    };
    
    fetchHeaderInfo();
  }, [userId, assignmentId, currentUser]);

  return (
    <>
      <Helmet><title>{userName ? `${userName}'s Results` : 'Staff Induction Results'} | AUT Events Induction Portal</title></Helmet>
      
      <PageHeader 
        title={pageTitle} 
        subtext={pageSubtext} 
      />
     
      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div>
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <StaffInductionResultsComponent 
            userId={userId} 
            assignmentId={assignmentId} 
            pageTitle={pageTitle}
            compactHeader={true}
          />
        </div>
      </div>
    </>
  );
};

export default StaffInductionResultsPage;