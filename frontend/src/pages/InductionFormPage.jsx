import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import { updateUserInduction, getUserInductionById } from '../api/UserInductionApi';
import Loading from '../components/Loading';
import InductionFeedbackModal from '../components/InductionFeedbackModal';
import QuestionTypes from '../models/QuestionTypes';
import { notifyError, notifySuccess, messageError, messageSuccess } from '../utils/notificationService';

import InductionIntro from '../components/takeInduction/InductionIntro';
import ProgressBar from '../components/takeInduction/ProgressBar';
import QuestionNavigation from '../components/takeInduction/QuestionNavigation';
import SingleQuestionView from '../components/takeInduction/SingleQuestionView';
import AllQuestionsView from '../components/takeInduction/AllQuestionsView';
import InductionCompletion from '../components/takeInduction/InductionCompletion';

// Utility functions
import {
  calculateEstimatedTime,
  formatTimeRange,
  checkAllRequiredQuestionsAnswered,
  validateAnswer,
  formatAnswersForSubmission
} from '../utils/inductionHelpers';
import {
  saveProgressToLocalStorage,
  loadProgressFromLocalStorage,
  forceProgressSave
} from '../utils/localStorageManager';

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
  const inductionRef = useRef(null);
  const userInductionRef = useRef(null);
  const errorMessageRef = useRef(null);
  
  // These states will ONLY be updated once we're certain of their final values
  const [viewState, setViewState] = useState(STATES.LOADING);
  const [induction, setInduction] = useState(null);
  const [userInduction, setUserInduction] = useState(null);
  
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

  // Add state to track answered questions
  const [answeredQuestions, setAnsweredQuestions] = useState({});

  // Track if user is on the submission screen
  const [showSubmissionScreen, setShowSubmissionScreen] = useState(false);

  // Add state to track when progress was last saved
  const [lastSaved, setLastSaved] = useState(null);
  
  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

        // First, get the user induction assignment
        const userInductionData = await getUserInductionById(user, idParam);
        
        if (userInductionData) {
          // Make a clean copy to normalise any data if needed
          const normalizedUserInduction = { ...userInductionData };
          
          // Check for Firestore timestamp formats and normalize them
          const normalizeTimestamp = (field) => {
            const value = normalizedUserInduction[field];
            if (value && typeof value === 'object') {
              // Handle Firestore timestamps with seconds
              if (value._seconds !== undefined || value.seconds !== undefined) {
                const seconds = value._seconds !== undefined ? value._seconds : value.seconds;
                normalizedUserInduction[field] = new Date(seconds * 1000);
              }
              // Handle objects with toDate method
              else if (typeof value.toDate === 'function') {
                normalizedUserInduction[field] = value.toDate();
              }
            }
          };
          
          // Normalize all potential timestamp fields
          normalizeTimestamp('assignedAt');
          normalizeTimestamp('availableFrom');
          normalizeTimestamp('dueDate');
          normalizeTimestamp('completedAt');
          normalizeTimestamp('startedAt');
          
          userInductionRef.current = normalizedUserInduction;
          
          // Now get the detailed induction content using the inductionId from user induction
          if (normalizedUserInduction.induction) {
            // If the induction details are already embedded in the response
            inductionRef.current = normalizedUserInduction.induction;
            stateRef.current = STATES.SUCCESS;
            
            if (mounted) {
              window.requestAnimationFrame(() => {
                setUserInduction(normalizedUserInduction);
                setInduction(normalizedUserInduction.induction);
                setViewState(STATES.SUCCESS);
                setLoading(false);
              });
            }
          } else if (normalizedUserInduction.inductionId) {
            // Otherwise fetch the induction details
            const inductionData = await getInduction(user, normalizedUserInduction.inductionId);
            
            if (inductionData) {
              inductionRef.current = inductionData;
              stateRef.current = STATES.SUCCESS;
              
              if (mounted) {
                window.requestAnimationFrame(() => {
                  setUserInduction(normalizedUserInduction);
                  setInduction(inductionData);
                  setViewState(STATES.SUCCESS);
                  setLoading(false);
                });
              }
            } else {
              throw new Error('Failed to load induction content');
            }
          } else {
            throw new Error('Induction assignment does not contain induction ID');
          }
          
          // Check if induction is already in progress
          if (normalizedUserInduction.status === 'in_progress') {
            setStarted(true);
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

  // Set up auto-save at regular intervals and on certain actions
  useEffect(() => {
    if (!started || !induction || !induction.id) return;
    
    // Save progress whenever answers change (with debounce)
    const saveTimeout = setTimeout(() => {
      saveProgressToLocalStorage(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions
      }, setLastSaved);
    }, 500);
    
    // Set up interval to auto-save every 30 seconds
    const saveInterval = setInterval(() => {
      saveProgressToLocalStorage(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions
      }, setLastSaved);
    }, 30000);
    
    // Clean up interval and timeout on unmount
    return () => {
      clearInterval(saveInterval);
      clearTimeout(saveTimeout);
    };
  }, [answers, currentQuestionIndex, answeredQuestions, started, induction?.id]);

  // Load saved progress when induction loads and user starts
  useEffect(() => {
    if (started && induction && induction.id) {
      const progressData = loadProgressFromLocalStorage(induction.id);
      
      if (progressData) {
        setAnswers(progressData.answers || {});
        setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
        setAnsweredQuestions(progressData.answeredQuestions || {});
        setLastSaved(progressData.lastUpdated ? new Date(progressData.lastUpdated) : null);
      } else {
        // Initialize with empty answers if no saved progress
        const initialAnswers = {};
        induction.questions.forEach(question => {
          initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
        });
        setAnswers(initialAnswers);
      }
    }
  }, [started, induction?.id]);

  // Handler for mobile menu toggle
  const handleMobileMenuToggle = (value) => {
    // If no value is provided, toggle the current state
    // Otherwise use the provided value
    if (typeof value === 'boolean') {
      setMobileMenuOpen(value);
    } else {
      setMobileMenuOpen(!mobileMenuOpen);
    }
  };

  // Handle starting the induction
  const handleStart = async () => {
    // If user is logged in, try to update their induction status
    if (user && userInduction) {
      try {
        await updateUserInduction(user, userInduction.id, {
          status: 'in_progress',
          startedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error updating induction status:", error);
        // Continue anyway - the UI state is more important
      }
    }
    
    setStarted(true);
  };

  // Toggle between slideshow and list view
  const toggleViewMode = () => {
    setShowAllQuestions(prev => !prev);
  };

  // Handle answer updates
  const handleAnswer = (questionId, answer) => {
    // Update the answers state
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      
      return newAnswers;
    });
    
    // Also mark question as answered if appropriate
    const hasValidAnswer = answer !== undefined && 
      answer !== '' && 
      !(Array.isArray(answer) && answer.length === 0);
      
    if (hasValidAnswer) {
      setAnsweredQuestions(prev => ({
        ...prev,
        [questionId]: true
      }));
    }
    
    // Clear feedback when a new answer is selected
    setAnswerFeedback({
      isCorrect: null,
      message: '',
      showFeedback: false
    });
  };

  // Handle moving to the next question
  const handleNextQuestion = () => {
    // Get current question and answer
    const currentQuestion = induction.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    
    // For information questions, always allow proceeding without an answer
    if (currentQuestion.type === QuestionTypes.INFORMATION) {
      // Mark this question as answered
      const updatedAnsweredQuestions = {
        ...answeredQuestions,
        [currentQuestion.id]: true
      };
      setAnsweredQuestions(updatedAnsweredQuestions);
      
      // Save progress
      forceProgressSave(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions: updatedAnsweredQuestions
      }, setLastSaved);
      
      // Proceed to next question
      if (currentQuestionIndex < induction.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      return;
    }
    
    // Validate the answer
    const validation = validateAnswer(currentQuestion, currentAnswer);
    
    if (!validation.isValid) {
      setAnswerFeedback({
        isCorrect: false,
        message: validation.message,
        showFeedback: true
      });
      return;
    }
    
    // Handle short answer questions differently
    if (currentQuestion.type === QuestionTypes.SHORT_ANSWER) {
      setAnswerFeedback({
        isCorrect: null, // null means pending review
        message: 'Answer submitted for review.',
        showFeedback: true
      });
      
      // Mark this question as answered
      const updatedAnsweredQuestions = {
        ...answeredQuestions,
        [currentQuestion.id]: true
      };
      setAnsweredQuestions(updatedAnsweredQuestions);
      
      // Save progress
      forceProgressSave(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions: updatedAnsweredQuestions
      }, setLastSaved);
      
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
      return;
    }
    
    // Show feedback based on answer validation
    setAnswerFeedback({
      isCorrect: validation.isCorrect,
      message: validation.message,
      showFeedback: true
    });
    
    if (validation.isCorrect) {
      // Mark this question as correctly answered
      const updatedAnsweredQuestions = {
        ...answeredQuestions,
        [currentQuestion.id]: true
      };
      setAnsweredQuestions(updatedAnsweredQuestions);
      
      // Save progress
      forceProgressSave(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions: updatedAnsweredQuestions
      }, setLastSaved);
      
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
    }
  };

  // Handle going to the previous question
  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Handle question navigation from sidebar or mobile menu
  const handleQuestionNavigation = (index) => {
    if (index >= 0 && index < induction.questions.length) {
      // Allow navigation even in all-questions view
      setCurrentQuestionIndex(index);
      
      // If we're in all-questions view, exit it
      if (showAllQuestions) {
        setShowAllQuestions(false);
      }
      
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      
      // Save current state
      saveProgressToLocalStorage(induction.id, {
        answers,
        currentQuestionIndex: index,
        answeredQuestions
      }, setLastSaved);
    }
  };

  // Handler for moving to submission screen with validation
  const handleGoToSubmissionScreen = () => {
    const validation = checkAllRequiredQuestionsAnswered(induction.questions, answers);
    
    if (validation.isValid) {
      setShowSubmissionScreen(true);
    } else {
      const errorMessage = 'Please answer all required questions before submitting.';
      notifyError('Missing Required Answers', errorMessage);
    }
  };

  // Submit the induction
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    // Validate all required fields
    const validation = checkAllRequiredQuestionsAnswered(induction.questions, answers);
    
    // If there are missing required answers, show error and prevent submission
    if (!validation.isValid) {
      // Create error message with list of missing answers
      let errorMessage = 'Please answer the following required questions:';
      
      validation.missingAnswers.forEach(item => {
        errorMessage += `\n• Question ${item.index}: ${item.question.length > 30 ? 
          item.question.substring(0, 30) + '...' : item.question}`;
      });
      
      // Show error notification
      notifyError('Missing Required Answers', errorMessage);
      
      // If in slideshow view, switch to list view to make it easier to see all questions
      if (!showAllQuestions) {
        setShowAllQuestions(true);
      }
      
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format answers for storage
      const formattedAnswers = formatAnswersForSubmission(induction.questions, answers);
      
      // Mark induction as complete in the database with answers
      if (userInduction) {
        await updateUserInduction(user, userInduction.id, {
          status: 'complete', // Mark as complete with status change
          completedAt: new Date().toISOString(), // Set completion date
          progress: 100, // Assuming 100% completion
          feedback: null, // This will be filled by the feedback modal
          answers: formattedAnswers // Save formatted answers
        });
      }
      
      // Show success message
      messageSuccess('Induction completed successfully!');
      
      // Show feedback modal
      setShowFeedbackModal(true);
    } catch (error) {
      console.error("Error completing induction:", error);
      notifyError('Error', 'Failed to save induction completion. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Handle feedback modal close
  const handleFeedbackModalClose = (feedback) => {
    setShowFeedbackModal(false);
    
    // If feedback was provided, save it
    if (feedback && userInduction) {
      updateUserInduction(user, userInduction.id, { feedback })
        .catch(error => console.error("Error saving feedback:", error));
    }
    
    // Navigate away after closing the modal
    navigate('/inductions/my-inductions');
  };

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
          <InductionIntro 
            induction={induction} 
            onStart={handleStart} 
          />
        ) : (
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <h1 className="text-2xl font-bold p-6 break-words border-b">{induction.name}</h1>
            
            {induction.questions && induction.questions.length > 0 ? (
              <div className="space-y-6">
                {/* Main flex container for sidebar and content */}
                <div className="flex flex-col md:flex-row">
                  {/* Question navigation sidebar - only in slideshow view */}
                  {!showAllQuestions && (
                    <QuestionNavigation
                      questions={induction.questions}
                      currentIndex={currentQuestionIndex}
                      onNavClick={handleQuestionNavigation}
                      answeredQuestions={answeredQuestions}
                      isOpen={mobileMenuOpen}
                      onClose={handleMobileMenuToggle}
                    />
                  )}
                  
                  {/* Main content area */}
                  <div className={`${showAllQuestions ? 'w-full' : 'md:w-3/4'} p-6`}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* View Mode Toggle */}
                      <div className="mb-4 flex justify-end">
                        <button
                          type="button"
                          onClick={toggleViewMode}
                          className="text-gray-700 hover:text-gray-900 font-medium flex items-center px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200"
                        >
                          {showAllQuestions ? (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5l-7 7 7 7" />
                              </svg>
                              <span>Switch to Slideshow View</span>
                            </>
                          ) : (
                            <>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                              </svg>
                              <span>View All Questions</span>
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* List view or slideshow based on showAllQuestions state */}
                      {showAllQuestions ? (
                        /* List View - All questions */
                        <AllQuestionsView
                          questions={induction.questions}
                          answers={answers}
                          handleAnswerChange={handleAnswer}
                          answerFeedback={answerFeedback}
                          handleSubmit={handleSubmit}
                          isSubmitting={isSubmitting}
                        />
                      ) : (
                        /* Slideshow View - Single question */
                        <>
                          {/* Progress indicator */}
                          <ProgressBar 
                            questions={induction.questions}
                            answeredQuestions={answeredQuestions}
                            lastSaved={lastSaved}
                          />
                          
                          {/* Show either submission screen or current question */}
                          {showSubmissionScreen ? (
                            <InductionCompletion
                              answeredQuestions={answeredQuestions}
                              questions={induction.questions}
                              onBackToQuestions={() => setShowSubmissionScreen(false)}
                              onSubmit={handleSubmit}
                              isSubmitting={isSubmitting}
                            />
                          ) : (
                            <SingleQuestionView
                              question={induction.questions[currentQuestionIndex]}
                              answer={answers[induction.questions[currentQuestionIndex].id]}
                              handleAnswerChange={(answer) => handleAnswer(induction.questions[currentQuestionIndex].id, answer)}
                              answerFeedback={answerFeedback}
                              handlePrevQuestion={handlePrevQuestion}
                              handleNextQuestion={handleNextQuestion}
                              currentIndex={currentQuestionIndex}
                              totalQuestions={induction.questions.length}
                              handleGoToSubmissionScreen={handleGoToSubmissionScreen}
                              QuestionTypes={QuestionTypes}
                            />
                          )}
                        </>
                      )}
                    </form>
                  </div>
                </div>
              </div>
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
        inductionId={userInduction?.inductionId || induction?.id}
        inductionName={induction?.name}
        userInductionId={userInduction?.id}
      />
    </>
  );
};

export default InductionFormPage;