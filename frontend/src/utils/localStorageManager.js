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
 */
export const saveProgressToLocalStorage = (inductionId, progressData, setLastSaved) => {
    if (!inductionId) return;
    
    const { answers, currentQuestionIndex, answeredQuestions } = progressData;
    
    const progress = {
      inductionId,
      answers,
      currentQuestionIndex,
      answeredQuestions,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      // Stringify the data to ensure it's saved correctly
      const serializedData = JSON.stringify(progress);
      localStorage.setItem(`induction_progress_${inductionId}`, serializedData);
      
      // Update last saved timestamp if setter is provided
      if (setLastSaved) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
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
      
      // Check if the saved progress is recent (within the last 24 hours)
      const lastUpdated = new Date(progress.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
      
      // Validate the date to make sure it's not in the future
      if (lastUpdated > now) {
        lastUpdated.setTime(now.getTime());
      }
      
      if (hoursSinceUpdate > 24) {
        // Remove stale data
        localStorage.removeItem(`induction_progress_${inductionId}`);
        return null;
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
        lastUpdated
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
   * 
   * @param {string} inductionId - The ID of the induction
   * @param {object} progressData - Object containing progress data
   * @param {object} progressData.answers - Current answers keyed by question ID
   * @param {number} progressData.currentQuestionIndex - Current question index
   * @param {object} progressData.answeredQuestions - Object tracking which questions are answered
   * @param {Function} setLastSaved - State setter function to update last saved timestamp
   */
  export const forceProgressSave = (inductionId, progressData, setLastSaved) => {
    if (!inductionId) return;
    
    // Use the standard save function but with current data
    saveProgressToLocalStorage(inductionId, progressData, setLastSaved);
  };
  
  /**
   * Clear saved progress for an induction from localStorage
   * 
   * @param {string} inductionId - The ID of the induction to clear progress for
   */
  export const clearSavedProgress = (inductionId) => {
    if (!inductionId) return;
    
    try {
      localStorage.removeItem(`induction_progress_${inductionId}`);
    } catch (error) {
      console.error('Error clearing saved progress:', error);
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