/**
 * Utility functions for managing induction drafts in localStorage
 */

/**
 * Determine if the induction has enough substantial content to warrant saving
 * 
 * @param {object} inductionData - The induction data to check
 * @returns {boolean} - True if there's substantial content to save
 */
const hasSubstantialContent = (inductionData) => {
    // Check if theres a name
    const hasName = inductionData.name && inductionData.name.trim() !== "";
    
    // Check if there are any questions
    const hasQuestions = inductionData.questions && inductionData.questions.length > 0;
    
    // Only save if theres a name AND at least one question
    return hasName && hasQuestions;
  };
  
  /**
   * Save induction draft to localStorage
   * 
   * @param {string} inductionId - The ID of the induction being created/edited
   * @param {object} inductionData - Object containing induction data
   * @param {Function} setLastSaved - State setter function to update last saved timestamp
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @param {boolean} forceSave - Override the substantial content check
   * @returns {boolean} - Success status of save operation
   */
  export const saveInductionDraftToLocalStorage = (inductionId, inductionData, setLastSaved, isEditing, forceSave = false) => {
    if (!inductionId) return false;
    
    // If we're creating a new induction (not editing), check for substantial content
    // Skip this check when editing existing inductions or when force-saving
    if (!isEditing && !forceSave) {
      if (!hasSubstantialContent(inductionData)) {
        return false; // Not enough content to save
      }
    }
    
    // Key will be different depending on if we're creating or editing
    const storageKey = isEditing 
      ? `induction_edit_draft_${inductionId}`
      : `induction_create_draft`;
    
    // Check if there have been meaningful changes before saving
    const existingData = loadInductionDraftFromLocalStorage(inductionId, isEditing);
    if (existingData && !hasSignificantInductionChanges(existingData, inductionData)) {
      return false; // No need to save if nothing important changed
    }
    
    const draftData = {
      inductionId,
      data: inductionData,
      lastUpdated: new Date().toISOString()
    };
    
    try {
      // Stringify the data to ensure it's saved correctly
      const serializedData = JSON.stringify(draftData);
      localStorage.setItem(storageKey, serializedData);
      
      // Update last saved timestamp if setter is provided
      if (setLastSaved) {
        setLastSaved(new Date());
      }
      
      return true;
    } catch (error) {
      console.error('Error saving induction draft to localStorage:', error);
      return false;
    }
  };
  
  /**
   * Determine if there have been significant changes that warrant saving
   * 
   * @param {object} oldData - Previous induction data
   * @param {object} newData - Current induction data
   * @returns {boolean} - True if there are significant changes
   */
  const hasSignificantInductionChanges = (oldData, newData) => {
    if (oldData.name !== newData.name) return true;
    if (oldData.department !== newData.department) return true;
    if (oldData.description !== newData.description) return true;
    
    // If question count changed, thats significant
    if ((oldData.questions?.length || 0) !== (newData.questions?.length || 0)) {
      return true;
    }
    
    // If any question content changed
    const oldQuestions = oldData.questions || [];
    const newQuestions = newData.questions || [];
    
    // Check if any questions were added, removed, or modified
    for (let i = 0; i < Math.max(oldQuestions.length, newQuestions.length); i++) {
      const oldQ = oldQuestions[i] || {};
      const newQ = newQuestions[i] || {};
      
      // If question IDs dont match (could be new or reordered question)
      if (oldQ.id !== newQ.id) return true;
      
      // If question content changed
      if (oldQ.question !== newQ.question) return true;
      if (oldQ.description !== newQ.description) return true;
      if (oldQ.type !== newQ.type) return true;
      
      // Compare options arrays
      if (JSON.stringify(oldQ.options || []) !== JSON.stringify(newQ.options || [])) return true;
      
      // Compare answers arrays
      if (JSON.stringify(oldQ.answers || []) !== JSON.stringify(newQ.answers || [])) return true;
      
      // Check if image file changed
      if (oldQ.imageFile !== newQ.imageFile) return true;
    }
    
    // No significant changes detected
    return false;
  };
  
  /**
   * Load induction draft from localStorage
   * 
   * @param {string} inductionId - The ID of the induction
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @returns {object|null} The induction draft data or null if not found/expired
   */
  export const loadInductionDraftFromLocalStorage = (inductionId, isEditing) => {
    if (!inductionId) return null;
    
    // Key will be different depending on if we're creating or editing
    const storageKey = isEditing 
      ? `induction_edit_draft_${inductionId}`
      : `induction_create_draft`;
    
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (!savedDraft) {
        return null;
      }
      
      const draftData = JSON.parse(savedDraft);
      
      // Check if the saved draft is recent (within the last 24 hours)
      const lastUpdated = new Date(draftData.lastUpdated);
      const now = new Date();
      const hoursSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60);
      
      // Validate the date to make sure its not in the future
      if (lastUpdated > now) {
        lastUpdated.setTime(now.getTime());
      }
      
      if (hoursSinceUpdate > 24) {
        // Remove stale data
        localStorage.removeItem(storageKey);
        return null;
      }
      
      return draftData.data;
    } catch (error) {
      console.error('Error loading induction draft from localStorage:', error);
      // Try to clean up any corrupted data
      localStorage.removeItem(storageKey);
      return null;
    }
  };
  
  /**
   * Check if there is a saved draft for an induction
   * 
   * @param {string} inductionId - The ID of the induction
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @returns {boolean} True if there is a valid saved draft, false otherwise
   */
  export const hasSavedInductionDraft = (inductionId, isEditing) => {
    if (!inductionId) return false;
    
    try {
      const draft = loadInductionDraftFromLocalStorage(inductionId, isEditing);
      
      // For new inductions, verify the draft has substantial content
      if (!isEditing && draft) {
        return hasSubstantialContent(draft);
      }
      
      return draft !== null;
    } catch (error) {
      return false;
    }
  };
  
  /**
   * Clear saved draft for an induction from localStorage
   * 
   * @param {string} inductionId - The ID of the induction to clear draft for
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @returns {boolean} - Success status of clear operation
   */
  export const clearSavedInductionDraft = (inductionId, isEditing) => {
    if (!inductionId) return false;
    
    // Key will be different depending on if we're creating or editing
    const storageKey = isEditing 
      ? `induction_edit_draft_${inductionId}`
      : `induction_create_draft`;
    
    try {
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('Error clearing saved induction draft:', error);
      return false;
    }
  };
  
  /**
   * Force an immediate save of draft to localStorage, bypassing content checks
   * 
   * @param {string} inductionId - The ID of the induction
   * @param {object} inductionData - Object containing induction data
   * @param {Function} setLastSaved - State setter function to update last saved timestamp
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @returns {boolean} - Success status of save operation
   */
  export const forceInductionDraftSave = (inductionId, inductionData, setLastSaved, isEditing) => {
    if (!inductionId) return false;
    
    // Force save by bypassing all checks
    return saveInductionDraftToLocalStorage(inductionId, inductionData, setLastSaved, isEditing, true);
  };
  
  /**
   * Setup event listeners to save induction draft on tab change or before page unload
   * Also configures periodic auto-saving
   * 
   * @param {string} inductionId - The ID of the induction
   * @param {Function} getInductionData - Function that returns current induction data
   * @param {Function} setLastSaved - State setter function to update last saved timestamp
   * @param {boolean} isEditing - Whether we're editing an existing induction or creating a new one
   * @returns {Function} - Cleanup function to remove event listeners
   */
  export const setupInductionDraftTracking = (inductionId, getInductionData, setLastSaved, isEditing) => {
    if (!inductionId || typeof getInductionData !== 'function') return () => {};
    
    // Handler for visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // User is navigating away from tab, save draft
        const currentData = getInductionData();
        if (currentData) {
          // When creating, only save if there's substantial content
          // When editing, always save
          if (isEditing || hasSubstantialContent(currentData)) {
            forceInductionDraftSave(inductionId, currentData, setLastSaved, isEditing);
          }
        }
      }
    };
    
    // Handler for page unload (closing tab/browser)
    const handleBeforeUnload = () => {
      const currentData = getInductionData();
      if (currentData) {
        // When creating, only save if there's substantial content
        // When editing, always save
        if (isEditing || hasSubstantialContent(currentData)) {
          forceInductionDraftSave(inductionId, currentData, setLastSaved, isEditing);
        }
      }
    };
    
    // Periodic auto-save (every 30 seconds)
    const intervalId = setInterval(() => {
      const currentData = getInductionData();
      if (currentData) {
        saveInductionDraftToLocalStorage(inductionId, currentData, setLastSaved, isEditing);
      }
    }, 30000);
    
    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Return cleanup function
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('beforeunload', handleBeforeUnload);
      clearInterval(intervalId);
    };
  };
  
  // Export a function to get the last updated timestamp for a draft
  export const getLastUpdatedTime = (inductionId, isEditing) => {
    if (!inductionId) return null;
    
    const storageKey = isEditing 
      ? `induction_edit_draft_${inductionId}`
      : `induction_create_draft`;
    
    try {
      const savedDraft = localStorage.getItem(storageKey);
      if (!savedDraft) {
        return null;
      }
      
      const draftData = JSON.parse(savedDraft);
      return new Date(draftData.lastUpdated);
    } catch (error) {
      return null;
    }
  };