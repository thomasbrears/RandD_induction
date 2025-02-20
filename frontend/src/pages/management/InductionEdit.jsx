import React, { useState } from "react";
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import useAuth from "../../hooks/useAuth";
import {DefaultNewInduction} from "../../models/Inductions"
import { createNewInduction } from "../../api/InductionApi";
import PageHeader from "../../components/PageHeader";
import ManagementSidebar from "../../components/ManagementSidebar";

const InductionEdit = () => {
  const { user } = useAuth();
  const [induction, setInduction] = useState(DefaultNewInduction);

  return (
    <>
      <Helmet><title>Edit Induction | AUT Events Induction Portal</title></Helmet>
      
      {/* Page Header */}
      <PageHeader 
        title="Edit Induction" 
        // TODO: Add induction name
        subtext="Edit {NAME} induction" 
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>
        
        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <p>Induction to edit will be displayed here</p>
        </div>
      </div>
    </>
  );
};  
export default InductionEdit;
