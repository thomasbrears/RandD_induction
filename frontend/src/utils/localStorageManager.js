/**
 * Utility functions for managing induction progress in localStorage
 */

/**
 * Save induction progress to localStorage
 * 
 * @param {string} inductionId - The ID of the induction
 * @param {object} progressData - Object containing progress data
 * @param {object} progressData.answers - Current answers keyed by question ID
 * @param {number} progressData.currentQuestionIndex - Current question index
 * @param {object} progressData.answeredQuestions - Object tracking which questions are answered
 * @param {Function} setLastSaved - State setter function to update last saved timestamp
 * @returns {boolean} - Success status of save operation
 */
export const saveProgressToLocalStorage = (inductionId, progressData, setLastSaved) => {
  if (!inductionId) return false;
  
  const { answers, currentQuestionIndex, answeredQuestions } = progressData;
  
  // Check if there have been meaningful changes before saving
  const existingData = loadProgressFromLocalStorage(inductionId);
  if (existingData && !hasSignificantChanges(existingData, progressData)) {
    return false; // No need to save if nothing important changed
  }
  
  const lastUpdated = new Date().toISOString();
  
  const progress = {
    inductionId,
    answers,
    currentQuestionIndex,
    answeredQuestions,
    lastUpdated
  };
  
  try {
    // Stringify the data to ensure it's saved correctly
    const serializedData = JSON.stringify(progress);
    localStorage.setItem(`induction_progress_${inductionId}`, serializedData);
    
    // Update last saved timestamp if setter is provided
    if (setLastSaved) {
      setLastSaved(new Date(lastUpdated));
    }
    
    return true;
  } catch (error) {
    console.error('Error saving progress to localStorage:', error);
    return false;
  }
};

/**
 * Determine if there have been significant changes that warrant saving
 * 
 * @param {object} oldData - Previous progress data
 * @param {object} newData - Current progress data
 * @returns {boolean} - True if there are significant changes
 */
const hasSignificantChanges = (oldData, newData) => {
  // If question index changed, thats significant
  if (oldData.currentQuestionIndex !== newData.currentQuestionIndex) {
    return true;
  }
  
  // Check if any new questions were answered
  const oldAnsweredCount = Object.keys(oldData.answeredQuestions || {}).length;
  const newAnsweredCount = Object.keys(newData.answeredQuestions || {}).length;
  
  if (newAnsweredCount > oldAnsweredCount) {
    return true;
  }
  
  // Check if any answers have changed
  const oldAnswers = oldData.answers || {};
  const newAnswers = newData.answers || {};
  
  for (const questionId in newAnswers) {
    // If this is a new answer that wasn't in old data
    if (!oldAnswers.hasOwnProperty(questionId)) {
      return true;
    }
    
    // If the answer changed from previous save
    const oldAnswer = oldAnswers[questionId];
    const newAnswer = newAnswers[questionId];
    
    // Deep comparison for arrays (multi-choice)
    if (Array.isArray(oldAnswer) && Array.isArray(newAnswer)) {
      if (oldAnswer.length !== newAnswer.length) {
        return true;
      }
      
      // Check if array contents match
      for (let i = 0; i < oldAnswer.length; i++) {
        if (oldAnswer[i] !== newAnswer[i]) {
          return true;
        }
      }
    } 
    // Simple comparison for other types
    else if (oldAnswer !== newAnswer) {
      return true;
    }
  }
  
  // Check for forced save
  if (newData._forceSave) {
    return true;
  }
  
  // No significant changes detected
  return false;
};

/**
 * Load induction progress from localStorage
 * 
 * @param {string} inductionId - The ID of the induction
 * @returns {object|null} The progress data or null if not found/expired
 */
export const loadProgressFromLocalStorage = (inductionId) => {
  if (!inductionId) return null;
  
  try {
    const savedProgress = localStorage.getItem(`induction_progress_${inductionId}`);
    if (!savedProgress) {
      return null;
    }
    
    const progress = JSON.parse(savedProgress);
    
    // Check if the saved progress is recent
    // Convert lastUpdated string to Date consistently
    const lastUpdated = progress.lastUpdated ? new Date(progress.lastUpdated) : null;
    const now = new Date();
    
    // Validate the date
    if (!lastUpdated || isNaN(lastUpdated.getTime())) {
      console.error('Invalid lastUpdated date in saved progress:', progress.lastUpdated);
      // Use current time as fallback
      progress.lastUpdated = now.toISOString();
    } else if (lastUpdated > now) {
      // If date is in the future, reset to now
      progress.lastUpdated = now.toISOString();
    } else {
      // Check if stale (older than 24 hours)
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 24) {
        // Remove stale data
        localStorage.removeItem(`induction_progress_${inductionId}`);
        return null;
      }
    }
    
    // Make sure we're using structurally valid data
    const validAnswers = progress.answers && typeof progress.answers === 'object' ? progress.answers : {};
    const validAnsweredQuestions = progress.answeredQuestions && typeof progress.answeredQuestions === 'object' ? progress.answeredQuestions : {};
    const validCurrentIndex = typeof progress.currentQuestionIndex === 'number' && progress.currentQuestionIndex >= 0 ? 
      progress.currentQuestionIndex : 0;
    
    // Return validated data
    return {
      answers: validAnswers,
      currentQuestionIndex: validCurrentIndex,
      answeredQuestions: validAnsweredQuestions,
      lastUpdated: progress.lastUpdated // Keep as ISO string
    };
  } catch (error) {
    console.error('Error loading progress from localStorage:', error);
    // Try to clean up any corrupted data
    localStorage.removeItem(`induction_progress_${inductionId}`);
    return null;
  }
};

/**
 * Force an immediate save of progress to localStorage
 * Useful for critical moments like question completion or tab visibility change
 * 
 * @param {string} inductionId - The ID of the induction
 * @param {object} progressData - Object containing progress data
 * @param {Function} setLastSaved - State setter function to update last saved timestamp
 * @returns {boolean} - Success status of save operation
 */
export const forceProgressSave = (inductionId, progressData, setLastSaved) => {
  if (!inductionId) return false;
  
  // Use the standard save function but bypass change detection
  const progress = {
    ...progressData,
    _forceSave: true // Internal flag to force save
  };
  
  return saveProgressToLocalStorage(inductionId, progress, setLastSaved);
};

/**
 * Clear saved progress for an induction from localStorage
 * 
 * @param {string} inductionId - The ID of the induction to clear progress for
 * @returns {boolean} - Success status of clear operation
 */
export const clearSavedProgress = (inductionId) => {
  if (!inductionId) return false;
  
  try {
    localStorage.removeItem(`induction_progress_${inductionId}`);
    return true;
  } catch (error) {
    console.error('Error clearing saved progress:', error);
    return false;
  }
};

/**
 * Check if there is saved progress for an induction
 * 
 * @param {string} inductionId - The ID of the induction
 * @returns {boolean} True if there is saved progress, false otherwise
 */
export const hasSavedProgress = (inductionId) => {
  if (!inductionId) return false;
  
  try {
    const progress = loadProgressFromLocalStorage(inductionId);
    return progress !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Save progress when tab visibility changes or before page unload
 * 
 * @param {string} inductionId - The ID of the induction
 * @param {Function} getProgressData - Function that returns current progress data
 * @param {Function} setLastSaved - State setter function to update last saved timestamp
 * @returns {Function} - Cleanup function to remove event listeners
 */
export const setupVisibilityChangeTracking = (inductionId, getProgressData, setLastSaved) => {
  if (!inductionId || typeof getProgressData !== 'function') return () => {};
  
  // Handler for visibility change (tab switching)
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      // User is navigating away from tab, save progress
      const currentData = getProgressData();
      if (currentData) {
        forceProgressSave(inductionId, currentData, setLastSaved);
      }
    }
  };
  
  // Handler for page unload (closing tab/browser)
  const handleBeforeUnload = () => {
    const currentData = getProgressData();
    if (currentData) {
      forceProgressSave(inductionId, currentData, setLastSaved);
    }
  };
  
  // Set up event listeners
  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('beforeunload', handleBeforeUnload);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  };
};