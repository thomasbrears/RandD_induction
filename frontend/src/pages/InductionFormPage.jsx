import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import { updateUserInduction, getUserInductionById } from '../api/UserInductionApi';
import Loading from '../components/Loading';
import InductionFeedbackModal from '../components/InductionFeedbackModal';
import SaveRecoveryModal from '../components/takeInduction/SaveRecoveryModal';
import QuestionTypes from '../models/QuestionTypes';
import { notifyError, notifySuccess, messageError, messageSuccess } from '../utils/notificationService';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getSignedUrl, uploadFile } from '../api/FileApi';

import InductionIntro from '../components/takeInduction/InductionIntro';
import ProgressBar from '../components/takeInduction/ProgressBar';
import QuestionNavigation from '../components/takeInduction/QuestionNavigation';
import SingleQuestionView from '../components/takeInduction/SingleQuestionView';
import InductionCompletion from '../components/takeInduction/InductionCompletion';

// Utility functions
import {
  checkAllRequiredQuestionsAnswered,
  validateAnswer,
  formatAnswersForSubmission
} from '../utils/inductionHelpers';
import {
  saveProgressToLocalStorage,
  loadProgressFromLocalStorage,
  forceProgressSave,
  setupVisibilityChangeTracking
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
  const [imageUrls, setImageUrls] = useState({});
  
  // Missing state variables that were causing errors
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadAttempts, setLoadAttempts] = useState(0);
  
  // Other UI states
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
  
  // State for save recovery modal
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedProgressData, setSavedProgressData] = useState(null);

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

            //Loading Images 
            const imageUrlsMap = {};
            const questions = normalizedUserInduction.induction.questions || [];

            await Promise.all(
              questions.map(async (q, index) => {
                if (q.imageFile) {
                  try {
                    const result = await getSignedUrl(user, q.imageFile);
                    imageUrlsMap[index] = result.url;
                  } catch (err) {
                    console.warn(`Could not fetch image for question ${index}`, err);
                  }
                }
              })
            );
            
            if (mounted) {
              window.requestAnimationFrame(() => {
                setUserInduction(normalizedUserInduction);
                setInduction(normalizedUserInduction.induction);
                setImageUrls(imageUrlsMap);
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

              //Loading Images 
              const imageUrlsMap = {};
              const questions = inductionData.questions || [];

              await Promise.all(
                questions.map(async (q, index) => {
                  if (q.imageFile) {
                    try {
                      const result = await getSignedUrl(user, q.imageFile);
                      imageUrlsMap[index] = result.url;
                    } catch (err) {
                      console.warn(`Could not fetch image for question ${index}`, err);
                    }
                  }
                })
              );
              
              if (mounted) {
                window.requestAnimationFrame(() => {
                  setUserInduction(normalizedUserInduction);
                  setInduction(inductionData);
                  setImageUrls(imageUrlsMap);
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

  // Optimised auto-save
  useEffect(() => {
    if (!started || !induction || !induction.id) return;
    
    // Function to get current progress data
    const getCurrentProgressData = () => ({
      answers,
      currentQuestionIndex,
      answeredQuestions
    });
    
    // Set up event listeners for tab switching and page close
    const cleanupListeners = setupVisibilityChangeTracking(
      induction.id,
      getCurrentProgressData,
      setLastSaved
    );
    
    // Clean up event listeners on unmount
    return cleanupListeners;
  }, [started, induction?.id, answers, currentQuestionIndex, answeredQuestions]);

  // Load saved progress when induction loads and user starts
  useEffect(() => {
    if (started && induction && induction.id) {
      const progressData = loadProgressFromLocalStorage(induction.id);
      
      if (progressData) {
        // total questions count to progress data for the recovery modal
        const progressWithTotal = {
          ...progressData,
          totalQuestions: induction.questions.length
        };
        
        // Update state to show recovery modal
        setSavedProgressData(progressWithTotal);
        setShowRecoveryModal(true);
      } else {
        // Initialise with empty answers if no saved progress
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
  
  // Handler for recovering saved progress
  const handleRecoverProgress = () => {
    if (savedProgressData) {
      // Load the saved progress data
      setAnswers(savedProgressData.answers || {});
      setCurrentQuestionIndex(savedProgressData.currentQuestionIndex || 0);
      setAnsweredQuestions(savedProgressData.answeredQuestions || {});
      setLastSaved(savedProgressData.lastUpdated ? new Date(savedProgressData.lastUpdated) : null);
      
      // Close the modal
      setShowRecoveryModal(false);
    }
  };
  
  // Handler for starting fresh
  const handleStartFresh = () => {
    // Initialise with empty answers
    const initialAnswers = {};
    if (induction && induction.questions) {
      induction.questions.forEach(question => {
        initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
      });
    }
    
    // Reset progress
    setAnswers(initialAnswers);
    setCurrentQuestionIndex(0);
    setAnsweredQuestions({});
    setLastSaved(null);
    
    // Close the modal
    setShowRecoveryModal(false);
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

  // Handle answer updates
  const handleAnswer = (questionId, answer) => {
    // Only update the answers state
    setAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionId]: answer
      };
      
      return newAnswers;
    });
    
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
    
    // For information questions, always allow proceeding and mark as answered
    if (currentQuestion.type === QuestionTypes.INFORMATION) {
      // Mark this question as answered only now
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
      
      // Mark this question as answered only after submission
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
      // Mark this question as correctly answered ONLY when validation passes
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
      
      // Save progress when navigating
      forceProgressSave(induction.id, {
        answers,
        currentQuestionIndex: currentQuestionIndex - 1,
        answeredQuestions
      }, setLastSaved);
    }
  };

  // Handle question navigation from sidebar or mobile menu
  const handleQuestionNavigation = (index) => {
    if (index >= 0 && index < induction.questions.length) {
      // Allow navigation
      setCurrentQuestionIndex(index);
      
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      
      // Save current state when navigating between questions
      forceProgressSave(induction.id, {
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
      
      // Save progress when moving to submission screen
      forceProgressSave(induction.id, {
        answers,
        currentQuestionIndex,
        answeredQuestions
      }, setLastSaved);
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
      
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Format answers for storage
      const updatedAnswers = await handleUserFileUpload(induction.questions, answers);
      const formattedAnswers = formatAnswersForSubmission(induction.questions, updatedAnswers);
      
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

  const handleUserFileUpload = async (questions, answers) => {
    const getFileName = ( file, question) =>
      `induction_file_uploads/${idParam}_${question.id}_${file.name}`;

    const updatedAnswers = { ...answers };
  
    for (const question of questions) {
      const answer = updatedAnswers[question.id];
    
      if (question.type === QuestionTypes.FILE_UPLOAD && answer) {
        try {
          const finalFileName = getFileName(answer, question);
          const response = await uploadFile(user, answer, finalFileName);
          const newFileName = response.gcsFileName || finalFileName;
    
          updatedAnswers[question.id] = {
            file: answer,
            uploadedName: newFileName,
          };
        } catch (err) {
          notifyError(`Upload failed for ${answer.name}`, err);
        }
      }
    }

    return updatedAnswers;
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
            className="mt-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 flex items-center justify-center mx-auto"
          >
            <ArrowLeftOutlined className="mr-2" />
            Return to My Inductions
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet><title>{induction?.name || 'Induction'} | AUT Events Induction Portal</title></Helmet>
      <div className="min-h-screen flex flex-col bg-gray-50">
        <div className="flex-1 w-full max-w-6xl mx-auto">
          <div className={`p-4 sm:p-6 ${started ? 'pb-32 md:pb-6' : ''}`}>
            {!started ? (
              <InductionIntro 
                induction={induction} 
                onStart={handleStart} 
              />
            ) : (
              <div className="bg-white shadow-md rounded-lg overflow-hidden">
                {/* Title section with induction name */}
                <div className="border-b border-gray-200">
                  <h1 className="text-xl sm:text-2xl font-bold p-4 px-6 break-words">{induction.name}</h1>
                  
                  {/* Progress bar */}
                  <ProgressBar 
                    questions={induction.questions}
                    answeredQuestions={answeredQuestions}
                    lastSaved={lastSaved}
                  />
                </div>
                
                {induction.questions && induction.questions.length > 0 ? (
                  <div className="flex flex-col md:flex-row relative">
                    {/* Question navigation sidebar */}
                    <div className={`hidden md:block md:w-72 lg:w-80 flex-shrink-0`}>
                      <QuestionNavigation
                        questions={induction.questions}
                        currentIndex={currentQuestionIndex}
                        onNavClick={handleQuestionNavigation}
                        answeredQuestions={answeredQuestions}
                        isOpen={mobileMenuOpen}
                        onClose={handleMobileMenuToggle}
                      />
                    </div>
                    
                    {/* Main content area - flexible width */}
                    <div className="flex-1 min-w-0">
                      <div className="p-4 sm:p-6">
                        <form onSubmit={handleSubmit}>
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
                              imageUrl={imageUrls[currentQuestionIndex]}
                            />
                          )}
                        </form>
                      </div>
                    </div>
                    
                    {/* Mobile navigation */}
                    <div className="md:hidden">
                      <QuestionNavigation
                        questions={induction.questions}
                        currentIndex={currentQuestionIndex}
                        onNavClick={handleQuestionNavigation}
                        answeredQuestions={answeredQuestions}
                        isOpen={mobileMenuOpen}
                        onClose={handleMobileMenuToggle}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <p className="text-xl text-gray-600">No questions available for this induction.</p>
                    <button 
                      onClick={() => navigate('/inductions/my-inductions')}
                      className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 flex items-center justify-center mx-auto"
                    >
                      <ArrowLeftOutlined className="mr-2" />
                      Return to My Inductions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
  
      {/* Feedback Modal */}
      <InductionFeedbackModal
        visible={showFeedbackModal}
        onClose={handleFeedbackModalClose}
        inductionId={userInduction?.inductionId || induction?.id}
        inductionName={induction?.name}
        userInductionId={userInduction?.id}
      />
      
      {/* Save Recovery Modal */}
      <SaveRecoveryModal
        isVisible={showRecoveryModal}
        onRecover={handleRecoverProgress}
        onStartFresh={handleStartFresh}
        savedProgress={savedProgressData}
      />
    </>
  );
};

export default InductionFormPage;