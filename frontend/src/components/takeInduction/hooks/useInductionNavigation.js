import { useCallback } from 'react';
import { validateAnswer, checkAllRequiredQuestionsAnswered } from '../../../utils/inductionHelpers';
import QuestionTypes from '../../../models/QuestionTypes';
import { notifyError } from '../../../utils/notificationService';

/**
 * Custom hook to manage induction navigation
 * 
 * @param {object} induction - Current induction data
 * @param {object} answers - Current answers
 * @param {number} currentQuestionIndex - Index of the current question
 * @param {object} answeredQuestions - Tracking which questions have been answered
 * @param {object} answerFeedback - Feedback for the current answer
 * @param {function} setCurrentQuestion - Function to update the current question index
 * @param {function} setAnsweredQuestion - Function to mark a question as answered
 * @param {function} setAnswerFeedback - Function to update answer feedback
 * @param {function} setShowSubmission - Function to show/hide the submission screen
 * @param {function} forceSaveProgress - Function to force save progress
 * @returns {object} Navigation functions
 */
const useInductionNavigation = (
  induction,
  answers,
  currentQuestionIndex,
  answeredQuestions,
  answerFeedback,
  setCurrentQuestion,
  setAnsweredQuestion,
  setAnswerFeedback,
  setShowSubmission,
  forceSaveProgress
) => {
  // Handler for moving to the next question
  const handleNextQuestion = useCallback(() => {
    if (!induction || !induction.questions) return;
    
    // Get current question and answer
    const currentQuestion = induction.questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    const isLastQuestion = currentQuestionIndex === induction.questions.length - 1;
    
    // For information questions, always allow proceeding
    if (currentQuestion.type === QuestionTypes.INFORMATION) {
      // Mark as answered
      setAnsweredQuestion(currentQuestion.id, true);
      
      // Force save progress
      forceSaveProgress();
      
      // If last question, go to submission screen, otherwise next question
      if (isLastQuestion) {
        handleGoToSubmissionScreen();
      } else {
        setCurrentQuestion(currentQuestionIndex + 1);
      }
      return;
    }
    
    // Validate the answer
    const validation = validateAnswer(currentQuestion, currentAnswer);
    
    // If invalid, show error and don't proceed
    if (!validation.isValid) {
      setAnswerFeedback({
        isCorrect: false,
        message: validation.message,
        showFeedback: true
      });
      return;
    }
    
    // Handle short answer questions
    if (currentQuestion.type === QuestionTypes.SHORT_ANSWER) {
      setAnswerFeedback({
        isCorrect: null, // null means pending review
        message: 'Answer submitted for review.',
        showFeedback: true
      });
      
      // Mark as answered
      setAnsweredQuestion(currentQuestion.id, true);
      
      // Force save progress
      forceSaveProgress();
      
      // Proceed after a short delay
      setTimeout(() => {
        if (isLastQuestion) {
          handleGoToSubmissionScreen();
        } else {
          setCurrentQuestion(currentQuestionIndex + 1);
          // Reset feedback
          setAnswerFeedback({
            isCorrect: null,
            message: '',
            showFeedback: false
          });
        }
      }, 1000);
      return;
    }
    
    // Show feedback based on validation
    setAnswerFeedback({
      isCorrect: validation.isCorrect,
      message: validation.message,
      showFeedback: true
    });
    
    // If correct, proceed after delay
    if (validation.isCorrect) {
      // Mark as answered
      setAnsweredQuestion(currentQuestion.id, true);
      
      // Force save progress
      forceSaveProgress();
      
      // Proceed after delay
      setTimeout(() => {
        if (isLastQuestion) {
          handleGoToSubmissionScreen();
        } else {
          setCurrentQuestion(currentQuestionIndex + 1);
          // Reset feedback
          setAnswerFeedback({
            isCorrect: null,
            message: '',
            showFeedback: false
          });
        }
      }, 1000);
    }
  }, [
    induction, 
    currentQuestionIndex, 
    answers, 
    setCurrentQuestion, 
    setAnsweredQuestion, 
    setAnswerFeedback,
    forceSaveProgress
  ]);
  
  // Handler for going to the previous question
  const handlePrevQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestion(currentQuestionIndex - 1);
      
      // Save progress when navigating
      forceSaveProgress();
    }
  }, [currentQuestionIndex, setCurrentQuestion, forceSaveProgress]);
  
  // Handler for question navigation from sidebar
  const handleQuestionNavigation = useCallback((index) => {
    if (!induction || !induction.questions) return;
    
    if (index >= 0 && index < induction.questions.length) {
      setCurrentQuestion(index);
      
      // Save progress
      forceSaveProgress();
    }
  }, [induction, setCurrentQuestion, forceSaveProgress]);
  
  // Handler for moving to submission screen
  const handleGoToSubmissionScreen = useCallback(() => {
    if (!induction || !induction.questions) return;
    
    const validation = checkAllRequiredQuestionsAnswered(induction.questions, answers);
    
    if (validation.isValid) {
      setShowSubmission(true);
      
      // Save progress
      forceSaveProgress();
    } else {
      const errorMessage = 'Please answer all required questions before submitting.';
      notifyError('Missing Required Answers', errorMessage);
    }
  }, [induction, answers, setShowSubmission, forceSaveProgress]);
  
  // Handler for going back to specific question from review screen
  const handleBackToSpecificQuestion = useCallback((index) => {
    setCurrentQuestion(index);
    setShowSubmission(false);
  }, [setCurrentQuestion, setShowSubmission]);
  
  return {
    handleNextQuestion,
    handlePrevQuestion,
    handleQuestionNavigation,
    handleGoToSubmissionScreen,
    handleBackToSpecificQuestion
  };
};

export default useInductionNavigation;