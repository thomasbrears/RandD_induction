import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { submitContactForm } from '../api/ContactApi';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { getAllDepartments } from '../api/DepartmentApi';
import { FaInfoCircle } from "react-icons/fa";
import { Skeleton, Button } from 'antd';
import { SendOutlined, ReloadOutlined } from '@ant-design/icons';
import DynamicContent from '../components/DynamicContent.jsx';

const ContactForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState({ fullName: '', email: '', department: null });
  const [departments, setDepartments] = useState([]);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Check if user is logged in and get their information
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        setCurrentUser(user);
        setIsUserLoading(true);
        
        const userInfo = { email: user.email, department: null };
        
        // Try to get the user's details from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            if (userData.fullName) {
              userInfo.fullName = userData.fullName;
            } else if (user.displayName) {
              userInfo.fullName = user.displayName;
            }
            
            // Get user's department if available
            if (userData.department) {
              userInfo.department = userData.department;
            } else if (userData.departments) {
              // Check for plural 'departments' field as well
              userInfo.department = userData.departments;
            }
          } else if (user.displayName) {
            // Fallback to displayName from Auth if available
            userInfo.fullName = user.displayName;
          }
          
        } catch (error) {
          console.error('Error fetching user data:', error);
          // If Firestore fetch fails, try to use displayName from Auth
          if (user.displayName) {
            userInfo.fullName = user.displayName;
          }
        }
        setUserDetails(userInfo);
        
        // Fetch departments once we have the user
        try {
          const departmentsList = await getAllDepartments();
          setDepartments(departmentsList);
        } catch (error) {
          console.error('Error fetching departments:', error);
        } finally {
          setIsUserLoading(false);
        }
      }
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Handle sign out
  const handleSignOut = () => {
    const auth = getAuth();
    // Save current URL to session storage
    sessionStorage.setItem('previousUrl', window.location.pathname);
    // Sign out user
    signOut(auth).catch(error => {
      console.error('Error signing out:', error);
    });
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      // If user is logged in, add their details to the submission
      if (currentUser) {
        data.userId = currentUser.uid;
        data.fullName = userDetails.fullName;
        data.email = userDetails.email;
        
        // Use the user's department from their profile
        if (userDetails.department) {
          data.contactType = userDetails.department;
        }
      }
      
      // For non-logged in users, no department is assigned to them, so they will be routed to the main email
      
      // Get auth token for current user if logged in
      const auth = getAuth();
      let token = null;
      
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
        
        // Make sure userId is included in the data
        if (!data.userId) {
          data.userId = auth.currentUser.uid;
        }
      }
      
      // Submit with token if available
      await submitContactForm(data, token);
      setSuccessMessage('Thank you for contacting us! Your message has been sent successfully. We will be in touch soon.');
      reset(); // Reset form after successful submission
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || 
        'Failed to submit the form. Please try again later.'
      );
      console.error('Form submission error:', error);
    } finally {
      setIsLoading(false);
      
      // Scroll to the top of the form to show the message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Function to find department name from ID
  const getDepartmentName = (departmentId) => {
    if (!departmentId) return 'Unknown Department';
    const department = departments.find(d => d.id === departmentId);
    return department ? department.name : departmentId;
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">

      <div className="mt-4 text-base text-center text-black mb-6">
        <DynamicContent 
          section="contact-page-content" 
          fallbackText="Have questions or feedback? We'd love to hear from you! Fill out the form below and we'll get back to you as soon as possible."
        />
      </div>

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border-l-4 border-green-500 text-green-700">
          <p>{successMessage}</p>
        </div>
      )}
      
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
          <p>{errorMessage}</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Message for non-logged in users */}
        {!currentUser && (
          <div className="mb-6 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <FaInfoCircle className="text-blue-600" />
              </div>
              <div className="ml-3">
                <h4 className="text-black font-semibold">Sign in for faster support</h4>
                <p className="mt-1 text-gray-600">
                  <a href="/auth/signin" className="text-blue-600 hover:text-blue-800 underline font-medium">Sign in to your account</a> to have your details auto-filled and have your message prioritized and routed to the correct department.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Only show name and email fields if user is NOT logged in */}
        {!currentUser && (
          <>
            {/* Name field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">
                Full Name *
              </label>
              <input
                id="fullName"
                type="text"
                className={`w-full px-3 py-2 border ${errors.fullName ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                {...register('fullName', { required: 'Full name is required' })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>
              )}
            </div>
            
            {/* Email field */}
            <div className="mb-6">
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                Email *
              </label>
              <input
                id="email"
                type="email"
                className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    message: 'Please enter a valid email address'
                  }
                })}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>
          </>
        )}

        {/* Show skeleton loader while user details are loading */}
        {currentUser && isUserLoading && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <Skeleton active paragraph={{ rows: 2, width: ['20%', '40%'] }} title={{ width: '100%' }} />
          </div>
        )}

        {/* Show user's info if they are logged in and loading is complete */}
        {currentUser && !isUserLoading && (
          <div className="mb-6 p-4 bg-gray-50 rounded border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
              <h3 className="text-sm font-medium text-gray-700">Submitting as {userDetails.fullName} <span className="text-gray-500">({userDetails.email})</span></h3>
              
              {/* Not user, Sign out link */}
              <button 
                type="button" 
                onClick={handleSignOut}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 sm:mt-0"
              >
                Not {userDetails.fullName?.split(' ')[0] || 'you'}? Click here
              </button>
            </div>
            
            {/* Show user's department if available */}
            <div className="mt-2">
              {userDetails.department ? (
                <>
                  <div className="flex items-center">
                    <div className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      Department: {getDepartmentName(userDetails.department)}
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your message will be sent to your department's contact.
                  </p>
                </>
              ) : (
                <>
                 {/* otherwise show No Department Assigned */}
                  <div className="flex items-center">
                    <div className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">
                      No Department Assigned
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Your message will be sent to our general contact.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Subject field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="subject">
            Subject *
          </label>
          <input
            id="subject"
            type="text"
            className={`w-full px-3 py-2 border ${errors.subject ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
            {...register('subject', { required: 'Subject is required' })}
          />
          {errors.subject && (
            <p className="text-red-500 text-xs mt-1">{errors.subject.message}</p>
          )}
        </div>
        
        {/* Message field */}
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="message">
            Message *
          </label>
          <textarea
            id="message"
            rows="6"
            className={`w-full px-3 py-2 border ${errors.message ? 'border-red-500' : 'border-gray-300'} rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
            {...register('message', { required: 'Message is required' })}
          ></textarea>
          {errors.message && (
            <p className="text-red-500 text-xs mt-1">{errors.message.message}</p>
          )}
        </div>
        
        {/* Submit and Reset buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
          <div className="mb-4 sm:mb-0 space-x-2">
            <Button 
              type="primary" 
              htmlType="submit"
              icon={<SendOutlined />}
              loading={isLoading}
              disabled={isUserLoading}
              size="middle"
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </Button>
            
            <Button
              icon={<ReloadOutlined />}
              onClick={() => reset()}
              disabled={isLoading || isUserLoading}
              size="middle"
            >
              Reset
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;