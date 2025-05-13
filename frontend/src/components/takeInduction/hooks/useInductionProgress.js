import { useState, useEffect, useCallback } from 'react';
import { 
  saveProgressToLocalStorage, 
  loadProgressFromLocalStorage, 
  forceProgressSave, 
  clearSavedProgress,
  setupVisibilityChangeTracking 
} from '../../../utils/localStorageManager';
import QuestionTypes from '../../../models/QuestionTypes';

/**
 * Custom hook to manage induction progress and autosaving
 * 
 * @param {string} inductionId - ID of the current induction
 * @param {boolean} started - Whether the induction has been started
 * @param {object} answers - Current answers for all questions
 * @param {number} currentQuestionIndex - Index of the current question
 * @param {object} answeredQuestions - Tracking which questions have been answered
 * @param {function} setLastSaved - Function to update the last saved timestamp
 * @returns {object} Progress management functions
 */
const useInductionProgress = (
  inductionId,
  started,
  answers,
  currentQuestionIndex,
  answeredQuestions,
  setLastSaved
) => {
  // Initialise progress
  const initializeProgress = useCallback(() => {
    if (!inductionId) return null;
    
    // Try to load saved progress
    const progressData = loadProgressFromLocalStorage(inductionId);
    
    // Convert lastUpdated to ISO string format if its a Date object
    if (progressData && progressData.lastUpdated instanceof Date) {
      progressData.lastUpdated = progressData.lastUpdated.toISOString();
    }
    
    return progressData;
  }, [inductionId]);
  
  // Save progress (debounced)
  const saveProgress = useCallback(() => {
    if (!started || !inductionId) return false;
    
    // Get current progress data
    const progressData = {
      answers,
      currentQuestionIndex,
      answeredQuestions
    };
    
    // Save to localStorage
    return saveProgressToLocalStorage(inductionId, progressData, setLastSaved);
  }, [started, inductionId, answers, currentQuestionIndex, answeredQuestions, setLastSaved]);
  
  // Force save progress immediately (for critical moments)
  const forceSaveProgress = useCallback(() => {
    if (!started || !inductionId) return false;
    
    // Get current progress data
    const progressData = {
      answers,
      currentQuestionIndex,
      answeredQuestions
    };
    
    // Force save to localStorage
    return forceProgressSave(inductionId, progressData, setLastSaved);
  }, [started, inductionId, answers, currentQuestionIndex, answeredQuestions, setLastSaved]);
  
  // Clear saved progress
  const clearProgress = useCallback(() => {
    if (!inductionId) return false;
    return clearSavedProgress(inductionId);
  }, [inductionId]);
  
  // Initialize empty answers for a new induction
  const initializeEmptyAnswers = useCallback((questions) => {
    if (!questions || !questions.length) return {};
    
    const initialAnswers = {};
    questions.forEach(question => {
      initialAnswers[question.id] = question.type === QuestionTypes.MULTICHOICE ? [] : '';
    });
    
    return initialAnswers;
  }, []);
  
  // Set up auto-save effect
  useEffect(() => {
    if (!started || !inductionId) return;
    
    // Function to get current progress data
    const getCurrentProgressData = () => ({
      answers,
      currentQuestionIndex,
      answeredQuestions
    });
    
    // Set up event listeners for tab switching and page close
    const cleanupListeners = setupVisibilityChangeTracking(
      inductionId,
      getCurrentProgressData,
      setLastSaved
    );
    
    // Auto-save on changes (debounced)
    const saveTimeout = setTimeout(() => {
      saveProgress();
    }, 2000); // Save after 2 seconds of inactivity
    
    // Clean up timeout on unmount
    return () => {
      cleanupListeners();
      clearTimeout(saveTimeout);
    };
  }, [started, inductionId, answers, currentQuestionIndex, answeredQuestions, saveProgress, setLastSaved]);
  
  return {
    initializeProgress,
    saveProgress,
    forceSaveProgress,
    clearProgress,
    initializeEmptyAnswers
  };
};

export default useInductionProgress;