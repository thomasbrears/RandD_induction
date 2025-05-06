/**
 * Utility functions for induction processing
 */
import QuestionTypes from '../models/QuestionTypes';

/**
 * Calculate estimated time to complete an induction based on question types
 * 
 * @param {Array} questions - Array of question objects
 * @returns {number} Estimated time in minutes
 */
export const calculateEstimatedTime = (questions) => {
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

/**
 * Format the time as a range (±20%)
 * 
 * @param {number} minutes - Estimated time in minutes
 * @returns {string} Formatted time range
 */
export const formatTimeRange = (minutes) => {
  if (minutes === 0) return "0 minutes";
  
  const lowerBound = Math.max(1, Math.floor(minutes * 0.8));
  const upperBound = Math.ceil(minutes * 1.2);
  
  return `${lowerBound}-${upperBound} minutes`;
};

/**
 * Check if all required questions have been answered
 * 
 * @param {Array} questions - Array of question objects
 * @param {object} answers - Object containing answers keyed by question ID
 * @returns {object} Object with isValid flag and missing answers
 */
export const checkAllRequiredQuestionsAnswered = (questions, answers) => {
  if (!questions || !questions.length) return { isValid: true, missingAnswers: [] };
  
  const missingAnswers = [];
  
  questions.forEach((question, index) => {
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


      // Ensure short answer questions meets minimum/maximum length
      if (question.type === QuestionTypes.SHORT_ANSWER && answer) {
        const minChars = question.minChars || 10;
        const maxChars = question.maxChars || 1000;
        
        if (answer.length < minChars) {
          missingAnswers.push({
            index: index + 1,
            question: question.question,
            reason: `Answer must be at least ${minChars} characters`
          });
        }
        
        if (answer.length > maxChars) {
          missingAnswers.push({
            index: index + 1,
            question: question.question,
            reason: `Answer must not exceed ${maxChars} characters`
          });
        }
      }
    }
  });
  
  return {
    isValid: missingAnswers.length === 0,
    missingAnswers
  };
};

/**
 * Validate an answer based on the question type
 * 
 * @param {object} question - Question object
 * @param {any} answer - Answer value
 * @returns {object} Validation result with isValid, isCorrect, and message
 */
export const validateAnswer = (question, answer) => {
  // For information questions, always return valid
  if (question.type === QuestionTypes.INFORMATION) {
    return {
      isValid: true,
      isCorrect: true,
      message: ''
    };
  }
  
  // Check if answer is required and provided
  const isRequired = question.isRequired !== false;
  if (isRequired && (answer === undefined || answer === '' || 
      (Array.isArray(answer) && answer.length === 0))) {
    return {
      isValid: false,
      isCorrect: false,
      message: 'Please select an answer before proceeding.'
    };
  }
  
  // If answer is not required and not provided, allow proceeding
  if (!isRequired && (answer === undefined || answer === '' || 
      (Array.isArray(answer) && answer.length === 0))) {
    return {
      isValid: true,
      isCorrect: true,
      message: ''
    };
  }
  
  // Validate based on question type
  switch (question.type) {
    case QuestionTypes.TRUE_FALSE:
    case QuestionTypes.YES_NO:
      return {
        isValid: true,
        isCorrect: parseInt(answer) === question.answers?.[0],
        message: parseInt(answer) === question.answers?.[0] 
          ? 'Correct! Well done.' 
          : (question.incorrectAnswerMessage || 'Incorrect. Please try again.')
      };
    
    case QuestionTypes.MULTICHOICE:
      if (Array.isArray(question.answers) && Array.isArray(answer)) {
        const isCorrect = 
          answer.length === question.answers.length && 
          answer.every(a => question.answers.includes(parseInt(a)));
          
        return {
          isValid: true,
          isCorrect,
          message: isCorrect 
            ? 'Correct! Well done.' 
            : (question.incorrectAnswerMessage || 'Incorrect. Please try again.')
        };
      }
      return {
        isValid: false,
        isCorrect: false,
        message: 'Invalid answer format for multi-choice question.'
      };
    
    case QuestionTypes.DROPDOWN:
      return {
        isValid: true,
        isCorrect: parseInt(answer) === question.answers?.[0],
        message: parseInt(answer) === question.answers?.[0] 
          ? 'Correct! Well done.' 
          : (question.incorrectAnswerMessage || 'Incorrect. Please try again.')
      };
      
    case QuestionTypes.SHORT_ANSWER:
      const minChars = question.minChars || 10;
      const maxChars = question.maxChars || 1000;
      
      // Check if answer meets minumum length requirements
      if (answer.length < minChars) {
        return {
          isValid: false,
          isCorrect: false,
          message: `Your answer must be at least ${minChars} characters long.`
        };
      }
      
      // Check if answer meets maximum length requirements
      if (answer.length > maxChars) {
        return {
          isValid: false,
          isCorrect: false,
          message: `Your answer must not exceed ${maxChars} characters.`
        };
      }
      
      // For short answers, we don't validate correctness, but mark as "pending review"
      return {
        isValid: true,
        isCorrect: null, // null means pending review
        message: 'Answer submitted for review.'
      };
      
    case QuestionTypes.FILE_UPLOAD:
      // For file uploads, always allow proceeding
      return {
        isValid: true,
        isCorrect: true,
        message: 'File uploaded successfully.'
      };
      
    default:
      return {
        isValid: true,
        isCorrect: true,
        message: ''
      };
  }
};

/**
 * Format answers for submission to the backend
 * 
 * @param {Array} questions - Array of question objects
 * @param {object} answers - Object containing answers keyed by question ID
 * @returns {Array} Formatted answers ready for submission
 */
export const formatAnswersForSubmission = (questions, answers) => {
  const formattedAnswers = [];
  
  questions.forEach(question => {
    const answer = answers[question.id];
    const answerObj = {
      questionId: question.id,
      questionType: question.type,
      questionTitle: question.title || question.question || `Question ${questions.indexOf(question) + 1}`,
      questionText: question.text || '',
      description: question.description || '',
      isRequired: question.isRequired !== false,
      hint: question.hint || '',
      incorrectAnswerMessage: question.incorrectAnswerMessage || ''
    };
    
    // Format differently based on question type
    switch (question.type) {
      case QuestionTypes.MULTICHOICE:
        answerObj.allOptions = question.options || [];
        answerObj.selectedOptions = Array.isArray(answer) ? answer : [];
        
        if (question.correctOptions) {
          const isCorrect = JSON.stringify(answerObj.selectedOptions.sort()) === 
                          JSON.stringify(question.correctOptions.sort());
          answerObj.isCorrect = isCorrect;
        }
        break;
        
      case QuestionTypes.TRUE_FALSE:
      case QuestionTypes.YES_NO:
        answerObj.selectedOption = answer !== undefined ? answer : null;
        answerObj.allOptions = question.options || [];
        // Check correctness (only if a correct answer is defined)
        if (question.correctOption !== undefined) {
          answerObj.isCorrect = answerObj.selectedOption === question.correctOption;
        }
        break;
        
      case QuestionTypes.DROPDOWN:
        answerObj.selectedOption = answer !== undefined ? answer : null;
        answerObj.allOptions = question.options || [];
        // Check correctness (only if a correct answer is defined)
        if (question.correctOption !== undefined) {
          answerObj.isCorrect = answerObj.selectedOption === question.correctOption;
        }
        break;
        
      case QuestionTypes.SHORT_ANSWER:
        answerObj.textValue = answer || '';
        answerObj.charCount = answer ? answer.length : 0;
        answerObj.minChars = question.minChars || 10;
        answerObj.maxChars = question.maxChars || 1000;
        // Don't set isCorrect - these need manual review
        answerObj.flaggedForReview = true;
        break;

      case QuestionTypes.INFORMATION:
        // For information questions, we don't need to store an answer
        answerObj.noAnswerRequired = true;
        break;
        
      case QuestionTypes.FILE_UPLOAD:
        // For file uploads, store the file name
        if (answer && answer.file) {
          answerObj.fileName = answer.uploadedName || answer.name;
          answerObj.fileType = answer.file.type;
          answerObj.fileSize = answer.file.size;
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
  
  return formattedAnswers;
};

/**
 * Get a formatted summary of induction progress
 * 
 * @param {Array} questions - Array of question objects
 * @param {object} answeredQuestions - Object tracking which questions are answered
 * @returns {object} Object with total, answered, and unanswered counts
 */
export const getProgressSummary = (questions, answeredQuestions) => {
  if (!questions || !questions.length) {
    return { total: 0, answered: 0, unanswered: 0, percentComplete: 0 };
  }
  
  // Filter out INFORMATION type questions for progress calculation
  const totalQuestions = questions.filter(q => q.type !== QuestionTypes.INFORMATION).length;
  
  // Count answered questions (excluding information blocks)
  const answeredCount = Object.keys(answeredQuestions || {}).filter(id => {
    const question = questions.find(q => q.id === id);
    return question && question.type !== QuestionTypes.INFORMATION;
  }).length;
  
  const unansweredCount = totalQuestions - answeredCount;
  const percentComplete = totalQuestions > 0 ? Math.floor((answeredCount / totalQuestions) * 100) : 0;
  
  return {
    total: totalQuestions,
    answered: answeredCount,
    unanswered: unansweredCount,
    percentComplete
  };
};