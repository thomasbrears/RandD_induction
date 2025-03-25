import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import Loading from '../components/Loading';
import QuestionTypes from '../models/QuestionTypes';
import { notifyError, notifySuccess, messageError, messageSuccess } from '../utils/notificationService';
import InductionFeedbackModal from '../components/InductionFeedbackModal';

const STATES = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
};

const InductionFormPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  // Support both assignmentID (preferred) and id (legacy) parameters
  const assignmentID = searchParams.get('assignmentID');
  const id = searchParams.get('id');
  const idParam = assignmentID || id; // Use whichever is available
  const navigate = useNavigate();
  
  // Use refs to avoid intermediate state updates
  const stateRef = useRef(STATES.LOADING);
  const inducRef = useRef(null);
  const errorMessageRef = useRef(null);
  
  // These states will ONLY be updated once we're certain of their final values
  const [viewState, setViewState] = useState(STATES.LOADING);
  const [induction, setInduction] = useState(null);
  
  // Missing state variables that were causing errors
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Other UI states
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  
  // Add feedback state for validation
  const [answerFeedback, setAnswerFeedback] = useState({
    isCorrect: null,
    message: '',
    showFeedback: false
  });
  
  // Add feedback modal state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load induction data just once on mount
  useEffect(() => {
    let mounted = true;
    let errorDisplayTimeout;
    let hasErrorBeenShown = false;
    
    // Clean up function to handle unmounting
    const cleanup = () => {
      mounted = false;
      clearTimeout(errorDisplayTimeout);
    };
    
    // Redirect immediately if no ID
    if (!idParam) {
      messageError('No induction specified');
      navigate('/inductions/my-inductions');
      return cleanup;
    }
    
    // Fetch data and handle loading states
    const fetchData = async () => {
      try {
        if (!idParam) {
          messageError('No induction specified');
          navigate('/inductions/my-inductions');
          return;
        }
        
        setLoading(true);
        setNotFound(false);

        const data = await getInduction(user, idParam);
        
        // If we got valid data, always show it immediately
        if (data) {
          console.log("✅ Got valid data");
          
          // Update refs first (these never cause renders)
          inducRef.current = data;
          stateRef.current = STATES.SUCCESS;
          
          // Only update state if still mounted
          if (mounted) {
            // Use requestAnimationFrame to batch these updates together
            window.requestAnimationFrame(() => {
              setInduction(data);
              setViewState(STATES.SUCCESS);
              setLoading(false);
            });
          }
        } 
        // If we got null data and haven't changed state yet
        else if (stateRef.current === STATES.LOADING) {
          console.log("❌ Got null data");
          
          errorMessageRef.current = 'Induction not found';
          
          // IMPORTANT: Only show error after a delay, giving any successful
          // request time to come back first
          errorDisplayTimeout = setTimeout(() => {
            // Only change state if we STILL haven't got valid data AND still mounted
            if (stateRef.current === STATES.LOADING && mounted) {              
              stateRef.current = STATES.ERROR;
              setViewState(STATES.ERROR);
              
              if (!hasErrorBeenShown) {
                messageError(errorMessageRef.current);
                hasErrorBeenShown = true;
              }
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error in fetch:", error);
        
        // Only handle error if still in loading state
        if (stateRef.current === STATES.LOADING) {
          errorMessageRef.current = 'Error loading induction';
          
          // Same delay approach for errors
          errorDisplayTimeout = setTimeout(() => {
            if (stateRef.current === STATES.LOADING && mounted) {
              console.log("⚠️ Showing error after delay");
              
              stateRef.current = STATES.ERROR;
              setViewState(STATES.ERROR);
              
              if (!hasErrorBeenShown) {
                messageError(errorMessageRef.current);
                hasErrorBeenShown = true;
              }
            }
          }, 1000);
        }
      }
    };
    
    // Set a timeout for stalled requests
    const timeoutId = setTimeout(() => {
      if (stateRef.current === STATES.LOADING && mounted) {
        errorMessageRef.current = 'Request timed out';
        
        stateRef.current = STATES.ERROR;
        setViewState(STATES.ERROR);
        
        // Only show error notification and set not found after final attempt
        if (loadAttempts >= 2) {
          messageError('Failed to load induction');
          setNotFound(true);
          setLoading(false);
        } else {
          // Try again if we haven't reached max attempts
          setLoadAttempts(prev => prev + 1);
        }
      }
    }, 15000);
    
    // Start the fetch
    fetchData();
    
    // Cleanup on unmount
    return () => {
      cleanup();
      clearTimeout(timeoutId);
    };
  }, [idParam, user, navigate, loadAttempts]);

  const handleStart = () => {
    setStarted(true);
    const initialAnswers = {};
    induction.questions.forEach(question => {
      initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
    });
    setAnswers(initialAnswers);
  };

  // New function to toggle between slideshow and list view
  const toggleViewMode = () => {
    setShowAllQuestions(prev => !prev);
  };

  const handleAnswer = (questionId, answer) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
    // Clear feedback when a new answer is selected
    setAnswerFeedback({
      isCorrect: null,
      message: '',
      showFeedback: false
    });
  };

  const handleNextQuestion = () => {
    // Get current question and answer
    const currentQuestion = induction.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    
    // Log for debugging
    console.log('Current Question:', currentQuestion);
    console.log('Current Answer:', currentAnswer);
    
    // Check if answer is provided
    if (currentAnswer === undefined || currentAnswer === '' || 
        (Array.isArray(currentAnswer) && currentAnswer.length === 0)) {
      setAnswerFeedback({
        isCorrect: false,
        message: 'Please select an answer before proceeding.',
        showFeedback: true
      });
      return;
    }

    // Validate the answer based on question type
    let isCorrect = false;
    
    switch (currentQuestion.type) {
      case QuestionTypes.TRUE_FALSE:
        // For TRUE_FALSE, the correct answer is stored in the answers array
        console.log('Validating TRUE_FALSE answer:', currentQuestion.answers, currentAnswer);
        isCorrect = parseInt(currentAnswer) === currentQuestion.answers[0];
        break;
      
      case QuestionTypes.MULTICHOICE:
        // For multiple choice, answers array contains indices of correct options
        console.log('Validating MULTICHOICE answer:', currentQuestion.answers, currentAnswer);
        if (Array.isArray(currentQuestion.answers) && Array.isArray(currentAnswer)) {
          // All selected options should be correct and all correct options should be selected
          isCorrect = 
            currentAnswer.length === currentQuestion.answers.length && 
            currentAnswer.every(answer => 
              currentQuestion.answers.includes(parseInt(answer))
            );
        }
        break;
      
      case QuestionTypes.DROPDOWN:
        // For dropdown, answers array typically contains one correct index
        console.log('Validating DROPDOWN answer:', currentQuestion.answers, currentAnswer);
        isCorrect = parseInt(currentAnswer) === currentQuestion.answers[0];
        break;
        
      case QuestionTypes.FILE_UPLOAD:
        // For file uploads, we always allow proceeding
        isCorrect = true;
        break;
        
      default:
        console.warn('Unknown question type:', currentQuestion.type);
        isCorrect = true; // Default to true for unknown types
    }

    // Show feedback based on answer validation
    if (isCorrect) {
      setAnswerFeedback({
        isCorrect: true,
        message: 'Correct! Well done.',
        showFeedback: true
      });
      
      // Proceed to next question after a short delay
      setTimeout(() => {
        if (currentQuestionIndex < induction.questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          // Reset feedback for the next question
          setAnswerFeedback({
            isCorrect: null,
            message: '',
            showFeedback: false
          });
        }
      }, 1000);
    } else {
      setAnswerFeedback({
        isCorrect: false,
        message: 'Incorrect. Please try again.',
        showFeedback: true
      });
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const submissionData = {
      inductionId: induction.id,
      userId: user?.id,
      answers: answers,
      completedAt: new Date().toISOString()
    };
    
    console.log('Form submitted', submissionData);
    
    // Show success message
    messageSuccess('Induction completed successfully!');
    
    // Show feedback modal
    setShowFeedbackModal(true);
    
    // Reset the form submission state
    //setIsSubmitting(false);
  };

  // Handle feedback modal close
  const handleFeedbackModalClose = () => {
    setShowFeedbackModal(false);
    // Navigate away after closing the modal
    navigate('/inductions/my-inductions');
  };

  // Calculate estimated time (assumed 2 minutes per question as a default)
  const estimatedTime = induction?.questions?.length ? induction.questions.length * 2 : 0;

  // Render based on view state
  if (viewState === STATES.LOADING) {
    return <Loading />;
  }

  if (viewState === STATES.ERROR) {
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
            
            {induction.questions.length > 0 ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* View Mode Toggle */}
                <div className="mb-4 flex justify-end">
                  <button
                    type="button"
                    onClick={toggleViewMode}
                    className="text-gray-600 hover:text-gray-800 text-sm font-medium flex items-center"
                  >
                    {showAllQuestions ? (
                      <>
                        <span>Switch to Slideshow View</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    ) : (
                      <>
                        <span>View All Questions</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
                
                {/* List view or slideshow based on showAllQuestions state */}
                {showAllQuestions ? (
                  /* List View - All questions displayed */
                  <div className="space-y-8">
                    {induction.questions.map((question, index) => (
                      <div 
                        key={question.id}
                        className="bg-gray-50 p-4 sm:p-6 rounded-lg"
                      >
                        <h2 className="text-xl font-semibold mb-2 flex items-center">
                          <span className="bg-gray-800 text-white rounded-full w-7 h-7 flex items-center justify-center mr-2 text-sm flex-shrink-0">
                            {index + 1}
                          </span>
                          <span className="break-words">{question.question}</span>
                        </h2>
                        
                        {question.description && (
                          <div 
                            className="text-gray-600 prose max-w-none mb-4"
                            dangerouslySetInnerHTML={{ __html: question.description }}
                          />
                        )}
                        
                        <div className="mt-2">
                          {renderQuestionByType(
                            question, 
                            answers[question.id], 
                            (answer) => handleAnswer(question.id, answer)
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Slideshow View - Single question displayed */
                  <>
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
                    <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                      {induction.questions[currentQuestionIndex] && (
                        <div className="space-y-4">
                          <h2 className="text-xl font-semibold">{induction.questions[currentQuestionIndex].question}</h2>
                          
                          {induction.questions[currentQuestionIndex].description && (
                            <div 
                              className="text-gray-600 prose max-w-none"
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
                          
                          {/* Answer Feedback */}
                          {answerFeedback.showFeedback && (
                            <div className={`mt-4 p-3 rounded-md ${
                              answerFeedback.isCorrect 
                                ? 'bg-green-50 text-green-700 border border-green-200' 
                                : 'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              <div className="flex items-center">
                                {answerFeedback.isCorrect ? (
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                  </svg>
                                )}
                                <span className="font-medium">{answerFeedback.message}</span>
                              </div>
                            </div>
                          )}
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
                          disabled={answerFeedback.showFeedback && !answerFeedback.isCorrect}
                          className={`px-4 py-2 bg-gray-800 text-white rounded-md ${
                            answerFeedback.showFeedback && !answerFeedback.isCorrect 
                              ? 'opacity-50 cursor-not-allowed' 
                              : 'hover:bg-gray-700'
                          }`}
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
                  </>
                )}
                
                {/* Submit button for list view */}
                {showAllQuestions && (
                  <div className="mt-8 flex justify-center">
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-3 bg-gray-800 text-white rounded-md w-full sm:w-auto ${
                        isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700'
                      }`}
                    >
                      {isSubmitting ? 'Submitting...' : 'Complete Induction'}
                    </button>
                  </div>
                )}
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

      {/* Feedback Modal */}
      <InductionFeedbackModal
        visible={showFeedbackModal}
        onClose={handleFeedbackModalClose}
        inductionId={induction?.id}
        inductionName={induction?.name}
      />
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
                id={`option-${question.id}-${index}`}
                name={`question-${question.id}`}
                value={index}
                checked={answer === index}
                onChange={() => handleAnswerChange(index)}
                className="w-5 h-5 text-gray-800 border-gray-300 focus:ring-gray-500"
              />
              <label htmlFor={`option-${question.id}-${index}`} className="ml-2 block text-gray-700">
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
                id={`option-${question.id}-${index}`}
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
                className="w-5 h-5 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
              />
              <label htmlFor={`option-${question.id}-${index}`} className="ml-2 block text-gray-700 text-base">
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
          className="block w-full p-2 mt-1 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-base"
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
            <div className="flex flex-col sm:flex-row text-sm text-gray-600 justify-center">
              <label
                htmlFor={`file-upload-${question.id}`}
                className="relative cursor-pointer bg-white rounded-md font-medium text-gray-800 hover:text-gray-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-gray-500"
              >
                <span>Upload a file</span>
                <input id={`file-upload-${question.id}`} name={`file-upload-${question.id}`} type="file" className="sr-only" />
              </label>
              <p className="pl-1 mt-1 sm:mt-0">or drag and drop</p>
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