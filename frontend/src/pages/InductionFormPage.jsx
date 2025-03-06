import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import Loading from '../components/Loading';

const InductionFormPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const inductionId = searchParams.get('id');
  const navigate = useNavigate();
  
  const [induction, setInduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    const fetchInduction = async () => {
      try {
        if (!inductionId) {
          toast.error('No induction specified');
          navigate('/inductions/my-inductions');
          return;
        }
        
        const data = await getInduction(user, inductionId);
        setInduction(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching induction:', error);
        toast.error('Failed to load induction');
        setLoading(false);
      }
    };

    fetchInduction();
  }, [inductionId, user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Submit the form data
    console.log('Form submitted', formData);
  };

  const handleStart = () => {
    setStarted(true);
  };

  // Calculate estimated time (assumed 2 minutes per question as a default)
  const estimatedTime = induction?.questions?.length ? induction.questions.length * 2 : 0;

  if (loading) {
    return <Loading />;
  }

  if (!induction) {
    return (
      <>
        <Helmet><title>Induction Not Found | AUT Events Induction Portal</title></Helmet>
        <div className="p-6 max-w-4xl mx-auto text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Induction Not Found</h1>
          <p>Sorry, we couldn't find the requested induction.</p>
          <button 
            onClick={() => navigate('/inductions/my-inductions')}
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Return to My Inductions
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>{induction.name || 'Induction'} | AUT Events Induction Portal</title></Helmet>
      <div className="p-6 max-w-4xl mx-auto">
        {!started ? (
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">{induction.name}</h1>
            
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-gray-700">{induction.description || 'No description provided.'}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-md">
                  <span className="block text-sm font-medium text-gray-600">Question Count</span>
                  <span className="text-lg font-semibold">{induction.questions?.length || 0} questions</span>
                </div>
                
                <div className="bg-green-50 p-4 rounded-md">
                  <span className="block text-sm font-medium text-gray-600">Estimated Time</span>
                  <span className="text-lg font-semibold">
                    {estimatedTime} {estimatedTime === 1 ? 'minute' : 'minutes'}
                  </span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleStart}
              className="w-full md:w-auto px-6 py-3 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors font-medium"
            >
              Start Induction
            </button>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-bold mb-4">{induction.name}</h1>
            <p>Welcome, {user?.email}! Please complete the induction form below.</p>
            {/* Actual induction form content would go here */}
            <div className="mt-6">
              <p>Induction questions would appear here...</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default InductionFormPage;