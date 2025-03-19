import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async'; // HelmetProvider to dynamicly set page head for titles, seo etc
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import Loading from '../components/Loading';
import QuestionTypes from '../models/QuestionTypes';

const InductionFormPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // Support both assignmentID (preferred) and id (legacy) parameters
  const assignmentID = searchParams.get('assignmentID');
  const id = searchParams.get('id');
  const idParam = assignmentID || id; // Use whichever is available
  const navigate = useNavigate();
  
  const [induction, setInduction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [started, setStarted] = useState(false);
  const [formData, setFormData] = useState({});
  const [loadAttempts, setLoadAttempts] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchInduction = async () => {
      try {
        if (!idParam) {
          toast.error('No induction specified');
          navigate('/inductions/my-inductions');
          return;
        }
        
        setLoading(true);
        setNotFound(false);
        
        const data = await getInduction(user, idParam);
        
        if (data) {
          setInduction(data);
          setLoading(false);
        } else {
          // Only set not found after a delay to prevent flash
          setTimeout(() => {
            if (loadAttempts < 3) { // Try up to 3 times
              setLoadAttempts(prev => prev + 1);
            } else {
              setNotFound(true);
              setLoading(false);
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Error fetching induction:', error);
        
        // Only show error toast and set not found after final attempt
        if (loadAttempts >= 2) {
          toast.error('Failed to load induction');
          setNotFound(true);
          setLoading(false);
        } else {
          // Try again if we haven't reached max attempts
          setLoadAttempts(prev => prev + 1);
        }
      }
    };

    fetchInduction();
  }, [idParam, user, navigate, loadAttempts]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Prepare the submission data
    const submissionData = {
      inductionId: induction.id,
      userId: user?.id,
      answers: answers,
      completedAt: new Date().toISOString()
    };
    
    // TODO: Send the answers to the backend
    console.log('Form submitted', submissionData);
    
    toast.success('Induction completed successfully!');
    setTimeout(() => {
      navigate('/inductions/my-inductions');
    }, 2000);
  };

  const handleStart = () => {
    setStarted(true);
    // Initialize answers with empty values for all questions
    const initialAnswers = {};
    induction.questions.forEach(question => {
      initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
    });
    setAnswers(initialAnswers);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < induction.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Calculate estimated time (assumed 2 minutes per question as a default)
  const estimatedTime = induction?.questions?.length ? induction.questions.length * 2 : 0;

  if (loading) {
    return <Loading />;
  }

  if (notFound) {
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
            <h1 className="text-2xl font-bold text-gray-800 mb-4 break-words">{induction.name}</h1>
            
            <div className="mb-6 space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <div className="prose !max-w-none w-full break-words overflow-hidden">
                  <p 
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: induction.description || 'No description provided.' }}
                  />
                </div>
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
          <div className="bg-white shadow-md rounded-lg p-6">
            <h1 className="text-2xl font-bold mb-4 break-words">{induction.name}</h1>
            <p className="mb-6">Welcome, {user?.email}! Please complete the induction form below.</p>
            
            {induction.questions.length > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Progress indicator */}
                <div className="mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-medium">{currentQuestionIndex + 1} of {induction.questions.length}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-gray-800 h-2.5 rounded-full" 
                      style={{ width: `${((currentQuestionIndex + 1) / induction.questions.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Current question */}
                <div className="bg-gray-50 p-6 rounded-lg">
                  {induction.questions[currentQuestionIndex] && (
                    <div className="space-y-4">
                      <h2 className="text-xl font-semibold">{induction.questions[currentQuestionIndex].question}</h2>
                      
                      {induction.questions[currentQuestionIndex].description && (
                        <div 
                          className="text-gray-600 prose"
                          dangerouslySetInnerHTML={{ __html: induction.questions[currentQuestionIndex].description }}
                        />
                      )}
                      
                      {/* Question content based on type */}
                      <div className="mt-4">
                        {renderQuestionByType(
                          induction.questions[currentQuestionIndex], 
                          answers[induction.questions[currentQuestionIndex].id], 
                          (answer) => handleAnswer(induction.questions[currentQuestionIndex].id, answer)
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Navigation buttons */}
                <div className="flex justify-between mt-6">
                  <button 
                    type="button"
                    onClick={handlePrevQuestion}
                    disabled={currentQuestionIndex === 0}
                    className={`px-4 py-2 border rounded-md ${
                      currentQuestionIndex === 0 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                        : 'bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {currentQuestionIndex < induction.questions.length - 1 ? (
                    <button 
                      type="button"
                      onClick={handleNextQuestion}
                      className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-2 bg-gray-800 text-white rounded-md ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Induction'}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-10">
                <p className="text-xl text-gray-600">No questions available for this induction.</p>
                <button 
                  onClick={() => navigate('/inductions/my-inductions')}
                  className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                >
                  Return to My Inductions
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

// Helper function to render the appropriate question type
function renderQuestionByType(question, answer, handleAnswerChange) {
  switch (question.type) {
    case QuestionTypes.TRUE_FALSE:
      return (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="radio"
                id={`option-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={answer === index}
                onChange={() => handleAnswerChange(index)}
                className="w-4 h-4 text-gray-800 border-gray-300 focus:ring-gray-500"
              />
              <label htmlFor={`option-${index}`} className="ml-2 block text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
      );
      
    case QuestionTypes.MULTICHOICE:
      return (
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <div key={index} className="flex items-center">
              <input
                type="checkbox"
                id={`option-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={Array.isArray(answer) && answer.includes(index)}
                onChange={() => {
                  if (Array.isArray(answer)) {
                    if (answer.includes(index)) {
                      handleAnswerChange(answer.filter(i => i !== index));
                    } else {
                      handleAnswerChange([...answer, index]);
                    }
                  } else {
                    handleAnswerChange([index]);
                  }
                }}
                className="w-4 h-4 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
              />
              <label htmlFor={`option-${index}`} className="ml-2 block text-gray-700">
                {option}
              </label>
            </div>
          ))}
        </div>
      );
      
    case QuestionTypes.DROPDOWN:
      return (
        <select
          value={answer}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="block w-full mt-1 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50"
        >
          <option value="">Select an answer</option>
          {question.options.map((option, index) => (
            <option key={index} value={index}>
              {option}
            </option>
          ))}
        </select>
      );
      
    case QuestionTypes.FILE_UPLOAD:
      return (
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer bg-white rounded-md font-medium text-gray-800 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500"
              >
                <span>Upload a file</span>
                <input id="file-upload" name="file-upload" type="file" className="sr-only" />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
          </div>
        </div>
      );
      
    default:
      return <p className="text-red-500">Unknown question type: {question.type}</p>;
  }
}

export default InductionFormPage;