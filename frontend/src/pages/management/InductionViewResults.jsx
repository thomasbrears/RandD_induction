import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import PageHeader from '../../components/PageHeader';
import ManagementSidebar from '../../components/ManagementSidebar';
import useAuth from "../../hooks/useAuth";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DefaultNewInduction } from "../../models/Inductions";
import {getInduction } from "../../api/InductionApi";

const InductionViewResults = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [induction, setInduction] = useState(DefaultNewInduction);
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state?.id;

  useEffect(() => {
    if (id && !authLoading) {
      const fetchInduction = async () => {
        try {
          setLoading(true);
          setLoadingMessage(`Loading the inductions's results...`);
          const inductionData = await getInduction(user, id);
          setInduction(inductionData);
        } catch (err) {
          toast.error(err.response?.data?.message || "An error occurred");
        } finally {
          setLoading(false);
        }
      };
      fetchInduction();
    } else if (!authLoading) {
      toast.error("No induction was selected. Please select an induction to edit.");
      setTimeout(() => navigate("/management/inductions/view"), 1000);
    }
  }, [id, user, authLoading, navigate]);

  return (
    <>
      <Helmet><title>Induction Results | AUT Events Induction Portal</title></Helmet>

      {/* Page Header */}
      <PageHeader
        title="Induction Results"
        subtext={`View the results for ${induction.name}`}
      />

      {/* Main container */}
      <div className="flex px-4 md:px-0 bg-gray-50">
        {/* Management Sidebar */}
        <div className="hidden md:flex">
          <ManagementSidebar />
        </div>

        {/* Main content area */}
        <div className="flex-1 ml-6 md:ml-8 p-6">
          <p>Results will be displayed here</p>
        </div>
      </div>
    </>
  );
};

export default InductionViewResults;
