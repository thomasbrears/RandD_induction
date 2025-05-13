import { useCallback } from 'react';
import { uploadFile } from '../../../api/FileApi';
import { updateUserInduction } from '../../../api/UserInductionApi';
import { checkAllRequiredQuestionsAnswered, formatAnswersForSubmission } from '../../../utils/inductionHelpers';
import { notifyError, notifySuccess, messageSuccess } from '../../../utils/notificationService';
import QuestionTypes from '../../../models/QuestionTypes';
import { clearSavedProgress } from '../../../utils/localStorageManager';

/**
 * Custom hook to manage induction submission
 * 
 * @param {object} user - Current authenticated user
 * @param {object} induction - Current induction data
 * @param {object} userInduction - Current user induction assignment
 * @param {object} answers - Current answers for all questions
 * @param {string} inductionId - ID of the current induction
 * @param {function} setIsSubmitting - Function to update submission state
 * @param {function} onSubmitSuccess - Callback to run after successful submission
 * @returns {object} Submission functions
 */
const useInductionSubmission = (
  user,
  induction,
  userInduction,
  answers,
  inductionId,
  setIsSubmitting,
  onSubmitSuccess
) => {
  // Handle file uploads
  const handleUserFileUpload = useCallback(async (questions, answers) => {
    if (!user || !inductionId) {
      throw new Error('User authentication or induction ID is missing');
    }
    
    const getFileName = (file, question) =>
      `induction_file_uploads/${inductionId}_${question.id}_${file.name}`;
    
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
  }, [user, inductionId]);
  
  // Submit the induction
  const handleSubmit = useCallback(async (e) => {
    if (!induction || !userInduction || !user) {
      notifyError('Error', 'Missing required data for submission');
      return;
    }
    
    if (e) e.preventDefault();
    
    // Validate all required fields
    const validation = checkAllRequiredQuestionsAnswered(induction.questions, answers);
    
    // If missing required answers, show error
    if (!validation.isValid) {
      // Create error message
      let errorMessage = 'Please answer the following required questions:';
      
      validation.missingAnswers.forEach(item => {
        errorMessage += `\n• Question ${item.index}: ${item.question.length > 30 ? 
          item.question.substring(0, 30) + '...' : item.question}`;
      });
      
      notifyError('Missing Required Answers', errorMessage);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload any files and format answers
      const updatedAnswers = await handleUserFileUpload(induction.questions, answers);
      const formattedAnswers = formatAnswersForSubmission(induction.questions, updatedAnswers);
      
      // Mark induction as complete in database
      if (userInduction) {
        await updateUserInduction(user, userInduction.id, {
          status: 'complete',
          completedAt: new Date().toISOString(),
          progress: 100,
          answers: formattedAnswers
        });
      }

      // Clear saved progress from local storage
      clearSavedProgress(inductionId);
      
      // Show success message
      messageSuccess('Induction completed successfully!');
      
      // Call success callback
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (error) {
      console.error("Error completing induction:", error);
      notifyError('Error', 'Failed to save induction completion. Please try again.');
      setIsSubmitting(false);
    }
  }, [
    induction, 
    userInduction, 
    user, 
    answers, 
    setIsSubmitting, 
    handleUserFileUpload, 
    onSubmitSuccess
  ]);
  
  return {
    handleSubmit,
    handleUserFileUpload
  };
};

export default useInductionSubmission;