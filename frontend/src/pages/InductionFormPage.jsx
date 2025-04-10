import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { getInduction } from '../api/InductionApi';
import Loading from '../components/Loading';
import QuestionTypes from '../models/QuestionTypes';
import { notifyError, notifySuccess, messageError, messageSuccess } from '../utils/notificationService';
import InductionFeedbackModal from '../components/InductionFeedbackModal';
import { updateUserInduction, getUserInductionById } from '../api/UserInductionApi';

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

  // Function to save progress to localStorage
  const saveProgressToLocalStorage = () => {
    if (!induction || !induction.id) return;
    
    const progress = {
      inductionId: induction.id,
      answers: answers,
      currentQuestionIndex: currentQuestionIndex,
      answeredQuestions: answeredQuestions,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(`induction_progress_${induction.id}`, JSON.stringify(progress));
    setLastSaved(new Date());
  };

  // Function to load progress from localStorage
  const loadProgressFromLocalStorage = () => {
    if (!induction || !induction.id) return false;
    
    const savedProgress = localStorage.getItem(`induction_progress_${induction.id}`);
    if (!savedProgress) return false;
    
    try {
      const progress = JSON.parse(savedProgress);
      
      // Check if the saved progress is recent (within the last 24 hours)
      const lastUpdated = new Date(progress.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        // If older than 24 hours, clear it
        localStorage.removeItem(`induction_progress_${induction.id}`);
        return false;
      }
      
      // Restore progress
      setAnswers(progress.answers || {});
      setCurrentQuestionIndex(progress.currentQuestionIndex || 0);
      setAnsweredQuestions(progress.answeredQuestions || {});
      setLastSaved(lastUpdated);
      
      return true;
    } catch (error) {
      console.error("Error loading saved progress:", error);
      return false;
    }
  };

  // Set up auto-save at regular intervals and on certain actions
  useEffect(() => {
    if (!started || !induction || !induction.id) return;
    
    // Save progress whenever answers change
    saveProgressToLocalStorage();
    
    // Set up interval to auto-save every 30 seconds
    const saveInterval = setInterval(saveProgressToLocalStorage, 30000);
    
    // Clean up interval on unmount
    return () => clearInterval(saveInterval);
  }, [answers, currentQuestionIndex, answeredQuestions, started, induction?.id]);

  // Load saved progress when induction loads and user starts
  useEffect(() => {
    if (started && induction && induction.id) {
      loadProgressFromLocalStorage();
    }
  }, [started, induction?.id]);

  // Handle starting the induction (also check for saved progress)
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
    
    // Try to load saved progress
    const progressLoaded = loadProgressFromLocalStorage();
    
    // If no saved progress, initialize with empty answers
    if (!progressLoaded) {
      const initialAnswers = {};
      induction.questions.forEach(question => {
        initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
      });
      setAnswers(initialAnswers);
    }
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
    
    // For information questions, always allow proceeding without an answer
    if (currentQuestion.type === QuestionTypes.INFORMATION) {
      // Mark this question as correctly answered
      setAnsweredQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: true
      }));
      
      // Proceed to next question
      if (currentQuestionIndex < induction.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      return;
    }
    
    // Check if answer is required and provided (except for information questions)
    const isRequired = currentQuestion.isRequired !== false; // Default to true if not specified
    if (isRequired && (currentAnswer === undefined || currentAnswer === '' || 
        (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
      setAnswerFeedback({
        isCorrect: false,
        message: 'Please select an answer before proceeding.',
        showFeedback: true
      });
      return;
    }
    
    // If answer is not required and not provided, allow user to proceed
    if (!isRequired && (currentAnswer === undefined || currentAnswer === '' || 
        (Array.isArray(currentAnswer) && currentAnswer.length === 0))) {
      // Mark this question as correctly answered
      setAnsweredQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: true
      }));
      
      // Proceed to next question
      if (currentQuestionIndex < induction.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
      return;
    }

    // Validate the answer based on question type
    let isCorrect = false;
    
    switch (currentQuestion.type) {
      case QuestionTypes.TRUE_FALSE:
      case QuestionTypes.YES_NO:
        // For TRUE_FALSE and YES_NO, the correct answer is stored in the answers array
        console.log('Validating TRUE_FALSE/YES_NO answer:', currentQuestion.answers, currentAnswer);
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
        
      case QuestionTypes.SHORT_ANSWER:
        // For short answers, we mark as "pending review" instead of correct/incorrect
        // Set feedback to show in orange color for "pending review"
        setAnswerFeedback({
          isCorrect: null, // null means pending review
          message: 'Answer submitted for review.',
          showFeedback: true
        });
        
        // Mark this question as answered (not necessarily correct)
        setAnsweredQuestions(prev => ({
          ...prev,
          [currentQuestion.id]: true
        }));
        
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
        return; // Exit the function early
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
      
      // Mark this question as correctly answered
      setAnsweredQuestions(prev => ({
        ...prev,
        [currentQuestion.id]: true
      }));
      
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
      // Use custom incorrect answer message if available
      const incorrectMessage = currentQuestion.incorrectAnswerMessage || 'Incorrect. Please try again.';
      
      setAnswerFeedback({
        isCorrect: false,
        message: incorrectMessage,
        showFeedback: true
      });
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  // Submit the induction
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields have answers before submission
    const missingRequiredAnswers = [];
    
    induction.questions.forEach((question, index) => {
      // Skip validation for INFORMATION type questions
      if (question.type === QuestionTypes.INFORMATION) return;
      
      // Check if question is required (default to true if not specified)
      const isRequired = question.isRequired !== false;
      
      if (isRequired) {
        const answer = answers[question.id];
        
        // Check if answer is missing
        if (answer === undefined || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          missingRequiredAnswers.push({
            index: index + 1,
            question: question.question
          });
        }
      }
    });
    
    // If there are missing required answers, show error and prevent submission
    if (missingRequiredAnswers.length > 0) {
      // Create error message with list of missing answers
      let errorMessage = 'Please answer the following required questions:';
      
      missingRequiredAnswers.forEach(item => {
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
      // Format answers as an array for storage
      const formattedAnswers = [];
      
      // Get all questions to determine their types
      const questions = induction.questions || [];
      
      // Process each answer based on its question type
      questions.forEach(question => {
        const answer = answers[question.id];
        const answerObj = {
          questionId: question.id,
          questionType: question.type,
          // Save question title/text for context
          questionTitle: question.title || question.question || `Question ${questions.indexOf(question) + 1}`,
          questionText: question.text || '',
          description: question.description || '',
          isRequired: question.isRequired !== false,
          hint: question.hint || '',
          incorrectAnswerMessage: question.incorrectAnswerMessage || ''
        };
        
        // Format differently based on question type
        switch (question.type) {
          case 'multichoice':
            // Save all options and which ones were selected
            answerObj.allOptions = question.options || [];
            answerObj.selectedOptions = Array.isArray(answer) ? answer : [];
            
            // Evaluate if the answer is correct (only for questions with defined correct answers)
            if (question.correctOptions) {
              // Check if selected options match correct options
              const isCorrect = JSON.stringify(answerObj.selectedOptions.sort()) === 
                              JSON.stringify(question.correctOptions.sort());
              answerObj.isCorrect = isCorrect;
            }
            break;
            
          case 'true or false':
          case 'yes_no':
            answerObj.selectedOption = answer !== undefined ? answer : null;
            answerObj.allOptions = question.options || [];
            // Check correctness (only if a correct answer is defined)
            if (question.correctOption !== undefined) {
              answerObj.isCorrect = answerObj.selectedOption === question.correctOption;
            }
            break;
            
          case 'dropdown':
            answerObj.selectedOption = answer !== undefined ? answer : null;
            answerObj.allOptions = question.options || [];
            // Check correctness (only if a correct answer is defined)
            if (question.correctOption !== undefined) {
              answerObj.isCorrect = answerObj.selectedOption === question.correctOption;
            }
            break;
            
          case 'short_answer':
            answerObj.textValue = answer || '';
            // Don't set isCorrect - these need manual review
            answerObj.flaggedForReview = true;
            break;

          case 'information':
            // For information questions, we don't need to store an answer
            answerObj.noAnswerRequired = true;
            break;
            
          case 'file_upload':
            // For file uploads, store the file name
            if (answer) {
              answerObj.fileName = answer.name;
              answerObj.fileType = answer.type;
              answerObj.fileSize = answer.size;
            }
            // Flag for review as we can't automatically verify
            answerObj.flaggedForReview = true;
            break;
            
          default:
            // For any other question type, just store the raw answer
            answerObj.rawAnswer = answer;
            break;
        }
        
        // Add the formatted answer to our array
        formattedAnswers.push(answerObj);
      });
      
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

  // Calculate estimated time based on question types
  const calculateEstimatedTime = (questions) => {
    if (!questions || !questions.length) return 0;
    
    let totalSeconds = 0;
    
    questions.forEach(question => {
      switch (question.type) {
        case QuestionTypes.MULTICHOICE:
        case QuestionTypes.TRUE_FALSE:
        case QuestionTypes.YES_NO:
        case QuestionTypes.DROPDOWN:
          totalSeconds += 45; // 45 seconds for multiple choice/selection questions
          break;
        case QuestionTypes.SHORT_ANSWER:
          totalSeconds += 120; // 2 minutes for short answer questions
          break;
        case QuestionTypes.INFORMATION:
          totalSeconds += 60; // 1 minute for info sections
          break;
        case QuestionTypes.FILE_UPLOAD:
          totalSeconds += 90; // 1.5 minutes for file uploads
          break;
        default:
          totalSeconds += 60; // Default to 1 minute
      }
    });
    
    // Convert to minutes
    return Math.ceil(totalSeconds / 60);
  };

  // Format the time as a range (±20%)
  const formatTimeRange = (minutes) => {
    if (minutes === 0) return "0 minutes";
    
    const lowerBound = Math.max(1, Math.floor(minutes * 0.8));
    const upperBound = Math.ceil(minutes * 1.2);
    
    return `${lowerBound}-${upperBound} minutes`;
  };

  // Calculate estimated time
  const estimatedTime = calculateEstimatedTime(induction?.questions);
  const estimatedTimeRange = formatTimeRange(estimatedTime);

  // New function to handle sidebar navigation
  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
    // Reset feedback when navigating
    setAnswerFeedback({
      isCorrect: null,
      message: '',
      showFeedback: false
    });
  };

  // Mobile sidebar state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev);
  };

  // Function to check if all required questions are answered
  const checkAllRequiredQuestionsAnswered = () => {
    const missingAnswers = [];
    
    induction.questions.forEach((question, index) => {
      // Skip validation for INFORMATION type questions
      if (question.type === QuestionTypes.INFORMATION) return;
      
      // Check if question is required (default to true if not specified)
      const isRequired = question.isRequired !== false;
      
      if (isRequired) {
        const answer = answers[question.id];
        
        // Check if answer is missing
        if (answer === undefined || answer === '' || 
            (Array.isArray(answer) && answer.length === 0)) {
          missingAnswers.push({
            index: index + 1,
            question: question.question
          });
        }
      }
    });
    
    return missingAnswers.length === 0;
  };

  // Handler for moving to submission screen
  const handleGoToSubmissionScreen = () => {
    if (checkAllRequiredQuestionsAnswered()) {
      setShowSubmissionScreen(true);
    } else {
      notifyError('Missing Required Answers', 'Please answer all required questions before submitting.');
    }
  };

  // Handler for going back from submission screen to questions
  const handleBackToQuestions = () => {
    setShowSubmissionScreen(false);
  };

  // Helper function to format the last saved time
  const formatLastSaved = (date) => {
    if (!date) return '';
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Difference in seconds
    
    if (diff < 5) return 'Just now';
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 120) return '1 minute ago';
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 7200) return '1 hour ago';
    return `${Math.floor(diff / 3600)} hours ago`;
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
                    {estimatedTimeRange}
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
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <h1 className="text-2xl font-bold p-6 break-words border-b">{induction.name}</h1>
            
            {induction.questions && induction.questions.length > 0 ? (
              <div className="space-y-6">
                {/* View Mode Toggle - Mobile only */}
                <div className="mb-4 flex justify-end md:hidden">
                  <button
                    onClick={toggleMobileMenu}
                    className="w-full flex items-center justify-between px-4 py-2 bg-gray-100 rounded-md text-gray-700"
                  >
                    <span>Question Navigator</span>
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-5 w-5 transition-transform ${mobileMenuOpen ? 'transform rotate-180' : ''}`} 
                      viewBox="0 0 20 20" 
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                {/* Main flex container for sidebar and content */}
                <div className="flex flex-col md:flex-row">
                  {/* Question numbers side panel - hidden on mobile unless toggled */}
                  <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:block md:w-1/4 bg-gray-50 p-4 border-r`}>
                    <h2 className="text-lg font-medium mb-4">Questions</h2>
                    <div className="space-y-2">
                      {induction.questions.map((question, index) => (
                        <button
                          key={question.id}
                          onClick={() => handleQuestionNavigation(index)}
                          className={`w-full text-left px-3 py-2 rounded-md flex items-center ${
                            currentQuestionIndex === index 
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : answeredQuestions[question.id]
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-2 text-sm ${
                            currentQuestionIndex === index 
                              ? 'bg-blue-500 text-white'
                              : answeredQuestions[question.id]
                                ? 'bg-green-100 text-green-700'
                                : 'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="truncate">{question.question.length > 20 ? question.question.substring(0, 20) + '...' : question.question}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Main content area */}
                  <div className="md:w-3/4 p-6">
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
                              <span className="text-sm font-medium">
                                {showSubmissionScreen ? 'Final Review' : `${currentQuestionIndex + 1} of ${induction.questions.length}`}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div 
                                className="bg-gray-800 h-2.5 rounded-full" 
                                style={{ width: showSubmissionScreen ? '100%' : `${((currentQuestionIndex + 1) / induction.questions.length) * 100}%` }}
                              ></div>
                            </div>
                            
                            {/* Last saved indicator */}
                            {lastSaved && (
                              <div className="mt-2 text-xs text-gray-500 flex items-center justify-end">
                                <svg 
                                  className="w-3 h-3 mr-1" 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  fill="none" 
                                  viewBox="0 0 24 24" 
                                  stroke="currentColor"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                </svg>
                                Progress saved {formatLastSaved(lastSaved)}
                              </div>
                            )}
                          </div>
                          
                          {/* Show either submission screen or current question */}
                          {showSubmissionScreen ? (
                            <div className="bg-gray-50 p-4 sm:p-6 rounded-lg">
                              <h2 className="text-xl font-semibold mb-4">Ready to Submit</h2>
                              
                              <div className="bg-blue-50 p-4 rounded-md border border-blue-200 mb-6">
                                <p className="text-blue-800">
                                  <span className="font-semibold">All questions completed!</span> You've finished the induction and your answers are ready to be submitted.
                                </p>
                              </div>
                              
                              <div className="space-y-4 mb-6">
                                <h3 className="font-semibold text-lg">Summary:</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="bg-gray-100 p-3 rounded">
                                    <p className="text-sm text-gray-600">Total Questions</p>
                                    <p className="font-bold">{induction.questions.length}</p>
                                  </div>
                                  
                                  <div className="bg-gray-100 p-3 rounded">
                                    <p className="text-sm text-gray-600">Questions Answered</p>
                                    <p className="font-bold">{Object.keys(answeredQuestions).length}</p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex justify-between mt-8">
                                <button
                                  type="button"
                                  onClick={handleBackToQuestions}
                                  className="px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50"
                                >
                                  Back to Questions
                                </button>
                                
                                <button
                                  type="submit"
                                  disabled={isSubmitting}
                                  className={`px-6 py-3 bg-gray-800 text-white rounded-md ${
                                    isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-gray-700'
                                  }`}
                                >
                                  {isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* Current question content */
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
                                      answerFeedback.isCorrect === true 
                                        ? 'bg-green-50 text-green-700 border border-green-200' 
                                        : answerFeedback.isCorrect === false
                                          ? 'bg-red-50 text-red-700 border border-red-200'
                                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                                    }`}>
                                      <div className="flex items-center">
                                        {answerFeedback.isCorrect === true ? (
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                          </svg>
                                        ) : answerFeedback.isCorrect === false ? (
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                          </svg>
                                        ) : (
                                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                                          </svg>
                                        )}
                                        <span className="font-medium">{answerFeedback.message}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Navigation buttons */}
                          {!showSubmissionScreen && (
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
                                  disabled={
                                    // Only disable for incorrect answers if it's not a short answer question
                                    answerFeedback.showFeedback && 
                                    !answerFeedback.isCorrect && 
                                    induction.questions[currentQuestionIndex].type !== QuestionTypes.SHORT_ANSWER
                                  }
                                  className={`px-4 py-2 bg-gray-800 text-white rounded-md ${
                                    answerFeedback.showFeedback && 
                                    !answerFeedback.isCorrect && 
                                    induction.questions[currentQuestionIndex].type !== QuestionTypes.SHORT_ANSWER
                                      ? 'opacity-50 cursor-not-allowed' 
                                      : 'hover:bg-gray-700'
                                  }`}
                                >
                                  Next
                                </button>
                              ) : (
                                <button 
                                  type="button"
                                  onClick={handleGoToSubmissionScreen}
                                  className="px-6 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
                                >
                                  Review & Submit
                                </button>
                              )}
                            </div>
                          )}
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

// Helper function to render the appropriate question type
function renderQuestionByType(question, answer, handleAnswerChange) {
  // Determine if this question is required (default to true)
  const isRequired = question.isRequired !== false;
  
  // Show hint if available
  const hint = question.hint ? (
    <div className="mt-2 text-xs italic text-gray-600 bg-gray-100 p-2 rounded-md">
      <span className="font-semibold">Hint:</span> {question.hint}
    </div>
  ) : null;
  
  // Show required indicator if needed
  const requiredIndicator = isRequired ? (
    <span className="text-red-500 ml-1">*</span>
  ) : null;

  switch (question.type) {
    case QuestionTypes.TRUE_FALSE:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {hint}
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
      
    case QuestionTypes.YES_NO:
      return (
        <div className="space-y-3">
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {hint}
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
          <div className="flex items-center">
            <p className="text-sm font-medium text-gray-700">Select option(s){requiredIndicator}</p>
          </div>
          {hint}
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
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Select an option{requiredIndicator}</p>
          </div>
          {hint}
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
        </div>
      );

    case QuestionTypes.SHORT_ANSWER:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Enter your answer{requiredIndicator}</p>
          </div>
          {hint}
          <textarea
            rows={4}
            value={answer || ''}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Type your answer here..."
            className="block w-full p-2 rounded-md border-gray-300 shadow-sm focus:border-gray-500 focus:ring focus:ring-gray-500 focus:ring-opacity-50 text-base"
          />
        </div>
      );

    case QuestionTypes.INFORMATION:
      return (
        <div className="mt-2 bg-blue-50 p-4 rounded-md border border-blue-200">
          {question.description ? (
            <div dangerouslySetInnerHTML={{ __html: question.description }} />
          ) : (
            <p className="text-gray-500 italic">Information block</p>
          )}
          {hint}
        </div>
      );
      
    case QuestionTypes.FILE_UPLOAD:
      return (
        <div>
          <div className="flex items-center mb-2">
            <p className="text-sm font-medium text-gray-700">Upload a file{requiredIndicator}</p>
          </div>
          {hint}
          <input 
            type="file" 
            onChange={(e) => handleAnswerChange(e.target.files[0])} 
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-gray-200 file:text-gray-700 hover:file:bg-gray-300"
          />
        </div>
      );
      
    default:
      return <p className="text-red-500">Unsupported question type: {question.type}</p>;
  }
}

export default InductionFormPage;