import React, { useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Result, Card, Button } from 'antd';
import { notifySuccess, notifyError, notifyWarning } from '../../utils/notificationService';

// Hooks
import useAuth from '../../hooks/useAuth';
import useMobileDetection from '../../utils/useMobileDetection';
import { useInduction } from './InductionContext';
import useInductionProgress from './hooks/useInductionProgress';
import useInductionNavigation from './hooks/useInductionNavigation';
import useInductionSubmission from './hooks/useInductionSubmission';

// API Functions
import { getInduction } from '../../api/InductionApi';
import { updateUserInduction, getUserInductionById } from '../../api/UserInductionApi';
import { getSignedUrl } from '../../api/FileApi';

// Components
import InductionIntro from './InductionIntro';
import InductionLayout from '../../layouts/InductionLayout';
import SingleQuestionView from './SingleQuestionView';
import InductionCompletion from './InductionCompletion';
import SaveRecoveryModal from './SaveRecoveryModal';
import InductionFeedbackModal from '../InductionFeedbackModal';
import InductionError from './InductionError';
import InductionLoader from './InductionLoader';
import QuestionTypes from '../../models/QuestionTypes';

const STATES = {
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  NOT_FOUND: 'NOT_FOUND'
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1500;

/**
 * InductionController - Orchestrates the induction experience
 * Handles data fetching, state management, and coordinates between components
 */
const InductionController = ({ inductionId }) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobileDetection();
  
  // Get induction context
  const { state, actions } = useInduction();
  
  // Extract state from context
  const {
    induction,
    userInduction,
    viewState,
    started,
    currentQuestionIndex,
    answers,
    answeredQuestions,
    answerFeedback,
    showSubmissionScreen,
    isSubmitting,
    lastSaved,
    imageUrls,
    loadAttempts,
    errorMessage
  } = state;
  
  // Local state for modals
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [savedProgressData, setSavedProgressData] = useState(null);
  
  const [notFoundState, setNotFoundState] = useState(false);
  
  // Custom hooks for induction functionality
  const {
    initializeProgress,
    saveProgress,
    forceSaveProgress,
    clearProgress,
    initializeEmptyAnswers
  } = useInductionProgress(
    induction?.id,
    started,
    answers,
    currentQuestionIndex,
    answeredQuestions,
    actions.setLastSaved
  );
  
  const {
    handleNextQuestion,
    handlePrevQuestion,
    handleQuestionNavigation,
    handleGoToSubmissionScreen,
    handleBackToSpecificQuestion
  } = useInductionNavigation(
    induction,
    answers,
    currentQuestionIndex,
    answeredQuestions,
    answerFeedback,
    actions.setCurrentQuestion,
    actions.setAnsweredQuestion,
    actions.setAnswerFeedback,
    actions.setShowSubmission,
    forceSaveProgress
  );
  
  const {
    handleSubmit
  } = useInductionSubmission(
    user,
    induction,
    userInduction,
    answers,
    inductionId,
    actions.setIsSubmitting,
    () => setShowFeedbackModal(true)
  );
  
  /**
   * Normalise timestamps from Firestore to JavaScript Date objects
   */
  const normalizeUserInduction = useCallback((userInductionData) => {
    if (!userInductionData) return null;
    
    const normalizedUserInduction = { ...userInductionData };
    
    const normalizeTimestamp = (field) => {
      const value = normalizedUserInduction[field];
      if (value && typeof value === 'object') {
        if (value._seconds !== undefined || value.seconds !== undefined) {
          const seconds = value._seconds !== undefined ? value._seconds : value.seconds;
          normalizedUserInduction[field] = new Date(seconds * 1000);
        } else if (typeof value.toDate === 'function') {
          normalizedUserInduction[field] = value.toDate();
        }
      }
    };
    
    // Normalise timestamp fields
    ['assignedAt', 'availableFrom', 'dueDate', 'completedAt', 'startedAt'].forEach(normalizeTimestamp);
    
    return normalizedUserInduction;
  }, []);
  
  /**
   * Fetch and set image URLs for questions
   */
  const fetchImageUrls = useCallback(async (inductionData) => {
    if (!user || !inductionData || !inductionData.questions) return {};
    
    const imageUrlsMap = {};
    const questions = inductionData.questions || [];
    try {
      await Promise.all(
        questions.map(async (q, index) => {
          // Check if imageFiles exists and is an array
          if (Array.isArray(q.imageFiles) && q.imageFiles.length > 0) {

            // Primary image (first in array)
            if (q.imageFiles[0]) {
              try {
                const result = await getSignedUrl(user, q.imageFiles[0]);
                if (result && result.url) {
                  imageUrlsMap[index] = result.url;
                }
              } catch (err) {
                console.warn(`Could not fetch primary image for question ${index}:`, err);
              }
            }
            
            // Secondary image (second in array)
            if (q.imageFiles[1]) {
              try {
                const result = await getSignedUrl(user, q.imageFiles[1]);
                if (result && result.url) {
                  imageUrlsMap[`${index}_secondary`] = result.url;
                }
              } catch (err) {
                console.warn(`Could not fetch secondary image for question ${index}:`, err);
              }
            }
          } else if (q.imageFiles && typeof q.imageFiles === 'string') {
            // Handle case where imageFiles is a single string (backwards compatibility)
            try {
              const result = await getSignedUrl(user, q.imageFiles);
              if (result && result.url) {
                imageUrlsMap[index] = result.url;
              }
            } catch (err) {
              console.warn(`Could not fetch single image for question ${index}:`, err);
            }
          } else {
            console.log(`No imageFiles found for question ${index} (or empty array)`);
          }
        })
      );
      
      return imageUrlsMap;
    } catch (error) {
      console.error("Error fetching image URLs:", error);
      return {};
    }
  }, [user]);
  
  /**
   * Initialise empty answers for questions
   */
  const setupInitialAnswers = useCallback((questions) => {
    if (!questions || !Object.keys(answers).length) {
      const initialAnswers = {};
      questions.forEach(question => {
        initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
      });
      
      // Set initial answers in context
      Object.entries(initialAnswers).forEach(([id, value]) => {
        actions.setAnswer(id, value);
      });
    }
  }, [actions, answers]);
  
  // Handle answer updates
  const handleAnswer = useCallback((questionId, answer) => {
    actions.setAnswer(questionId, answer);
    
    // Clear feedback when a new answer is selected
    actions.setAnswerFeedback({
      isCorrect: null,
      message: '',
      showFeedback: false
    });
  }, [actions]);
  
  // Track NOT_FOUND state separately to ensure it persists
  useEffect(() => {
    if (viewState === STATES.NOT_FOUND) {
      setNotFoundState(true);
    }
  }, [viewState]);
  
  // Effect to handle data fetching after authentication is complete
  useEffect(() => {
    // If we've already determined its a not found state, don't try to load again
    if (notFoundState) return;
    
    if (authLoading) return;
    
    // Only proceed once we have the user object
    if (!user?.uid) {
      if (loadAttempts > MAX_RETRIES) {
        actions.setViewState(STATES.ERROR);
        actions.setError("Authentication required to view this induction");
        notifyError('Authentication Required', 'You need to be logged in to access this induction');
      } else {
        // Retry authentication check
        const timer = setTimeout(() => {
          actions.incrementLoadAttempts();
        }, RETRY_DELAY);
        return () => clearTimeout(timer);
      }
      return;
    }
    
    // Redirect if no ID parameter
    if (!inductionId) {
      notifyError('Error', 'No induction specified');
      navigate('/inductions/my-inductions');
      return;
    }
    
    // Dont fetch if already successful or errored (but continue if loading)
    if (viewState !== STATES.LOADING) return;
    
    let isMounted = true;
    
    // Fetch induction data
    const fetchData = async () => {
      try {
        // Get the user induction assignment
        let userInductionData = await getUserInductionById(user, inductionId);
        
        // If not found and we havent tried too many times, retry
        if (!userInductionData && loadAttempts < MAX_RETRIES) {
          const timer = setTimeout(() => {
            if (isMounted) actions.incrementLoadAttempts();
          }, RETRY_DELAY);
          return () => clearTimeout(timer);
        }
        
        // If not found after max retries, show not found state
        if (!userInductionData) {
          if (isMounted) {
            actions.setError('Induction not found or you do not have access to it');
            actions.setViewState(STATES.NOT_FOUND);
            setNotFoundState(true); // Set our local state to maintain NOT_FOUND status
            notifyWarning('Module Not Found', 'Sorry, we could not find the requested module');
          }
          return;
        }
        
        // Normalize user induction data
        const normalizedUserInduction = normalizeUserInduction(userInductionData);
        
        // Get the induction content
        let inductionData;
        
        if (normalizedUserInduction.induction) {
          // Induction details already embedded
          inductionData = normalizedUserInduction.induction;
        } else if (normalizedUserInduction.inductionId) {
          // Fetch induction details
          inductionData = await getInduction(user, normalizedUserInduction.inductionId);
          
          if (!inductionData) {
            throw new Error('Failed to load induction content');
          }
        } else {
          throw new Error('Induction assignment does not contain induction ID');
        }
        
        // Set induction data in context
        if (isMounted) {
          actions.setInductionData(inductionData, normalizedUserInduction);
          
          // Fetch image URLs
          const imageUrlsMap = await fetchImageUrls(inductionData);
          actions.setImageUrls(imageUrlsMap);
          
          // Check if induction was already started
          if (normalizedUserInduction.status === 'in_progress') {
            actions.setStarted(true);
          }
          
          // Initialize empty answers
          setupInitialAnswers(inductionData.questions);
          
          // Set view state to success
          actions.setViewState(STATES.SUCCESS);
        }
      } catch (error) {
        console.error("Error loading induction:", error);
        
        if (loadAttempts < MAX_RETRIES) {
          // Schedule another attempt
          const timer = setTimeout(() => {
            if (isMounted) actions.incrementLoadAttempts();
          }, RETRY_DELAY);
          return () => clearTimeout(timer);
        } else {
          if (isMounted) {
            actions.setError(error.message || 'Error loading induction');
            actions.setViewState(STATES.ERROR);
            notifyError('Loading Error', 'Failed to load induction');
          }
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [
    inductionId, 
    user, 
    authLoading, 
    loadAttempts, 
    navigate, 
    actions, 
    viewState,
    normalizeUserInduction,
    fetchImageUrls,
    setupInitialAnswers,
    notFoundState
  ]);
  
  // Load saved progress when induction loads
  useEffect(() => {
    if (started && induction && induction.id) {
      const progressData = initializeProgress();
      
      if (progressData) {
        const processedProgressData = {
          ...progressData,
          totalQuestions: induction.questions.length,
          lastUpdated: progressData.lastUpdated instanceof Date 
            ? progressData.lastUpdated.toISOString() 
            : progressData.lastUpdated
        };
        
        // Show recovery modal
        setSavedProgressData(processedProgressData);
        setShowRecoveryModal(true);
      }
    }
  }, [started, induction?.id, initializeProgress]);
  
  // Handler for recovering saved progress
  const handleRecoverProgress = useCallback(() => {
    if (savedProgressData) {
      // Load the saved progress data
      actions.loadSavedProgress(savedProgressData);
      
      // Close the modal
      setShowRecoveryModal(false);
      
      notifySuccess('Progress Restored', 'Your previous progress has been loaded successfully');
    }
  }, [savedProgressData, actions]);
  
  // Handler for starting fresh
  const handleStartFresh = useCallback(() => {
    // Reset progress
    actions.resetState();
    clearProgress();
    
    // Initialise with empty answers
    if (induction && induction.questions) {
      const initialAnswers = initializeEmptyAnswers(induction.questions);
      
      // Set initial answers in context
      Object.entries(initialAnswers).forEach(([id, value]) => {
        actions.setAnswer(id, value);
      });
    }
    
    // Close the modal
    setShowRecoveryModal(false);    
  }, [induction, actions, clearProgress, initializeEmptyAnswers]);
  
  // Handle starting the induction
  const handleStart = useCallback(async () => {
    // Update induction status in database
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
    
    actions.setStarted(true);
    
    // Initialise with empty answers if not already initialised
    if (induction && induction.questions) {
      setupInitialAnswers(induction.questions);
    }
  }, [user, userInduction, induction, actions, setupInitialAnswers]);
  
  // Handle feedback modal close
  const handleFeedbackModalClose = useCallback(() => {
    setShowFeedbackModal(false);
    
    // Navigate away
    navigate('/inductions/my-inductions');
  }, [navigate]);
  
  // Handle error navigation
  const handleErrorNavigation = useCallback(() => {
    navigate('/inductions/my-inductions');
  }, [navigate]);
  
  // Show loading state until authentication is ready and we've tried to load the data
  if (authLoading || (viewState === STATES.LOADING && loadAttempts < MAX_RETRIES)) {
    return <InductionLoader />;
  }

  // Show NOT_FOUND state (checked first to ensure it persists)
  if (notFoundState || viewState === STATES.NOT_FOUND) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="w-full max-w-4xl">
          <Card bordered={false} className="shadow-md">
            <Result
              status="404"
              title="Induction Not Found"
              subTitle="The induction you're looking for couldn't be found. It may have been removed, or you might not have permission to access it."
              extra={[
                <Button 
                  type="primary" 
                  key="return" 
                  onClick={handleErrorNavigation}
                  size="large"
                >
                  Return to My Inductions
                </Button>
              ]}
            />
          </Card>
        </div>
      </div>
    );
  }

  // Show error state for general errors
  if (viewState === STATES.ERROR) {
    return <InductionError message={errorMessage} onReturnClick={handleErrorNavigation} />;
  }

  return (
    <>
      {!started ? (
        // Intro screen
        <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
          <div className="w-full max-w-4xl">
            <InductionIntro 
              induction={induction} 
              onStart={handleStart} 
            />
          </div>
        </div>
      ) : (
        // Main induction experience using inductionlayout
        <InductionLayout
          induction={induction}
          currentQuestionIndex={currentQuestionIndex}
          answeredQuestions={answeredQuestions}
          lastSaved={lastSaved}
          isMobile={isMobile}
          onNavigate={handleQuestionNavigation}
          isSubmissionScreen={showSubmissionScreen}
        >
          {showSubmissionScreen ? (
            // Submission/review screen
            <InductionCompletion
              answeredQuestions={answeredQuestions}
              questions={induction.questions}
              onBackToQuestions={() => actions.setShowSubmission(false)}
              onBackToSpecificQuestion={handleBackToSpecificQuestion}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          ) : (
            // Current question view
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
              imageUrls={imageUrls}
            />
          )}
        </InductionLayout>
      )}
      
      {/* Modals */}
      <SaveRecoveryModal
        isVisible={showRecoveryModal}
        onRecover={handleRecoverProgress}
        onStartFresh={handleStartFresh}
        savedProgress={savedProgressData}
      />
      
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

InductionController.propTypes = {
  inductionId: PropTypes.string
};

export default InductionController;