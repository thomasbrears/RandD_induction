import { formatDistanceToNow, differenceInMinutes, differenceInHours, differenceInDays } from 'date-fns';

/**
 * Format date from various possible timestamp formats
 * @param {Date|Object|string} date - Date object, Firestore timestamp, or date string
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return "Not Available";
  
  try {
    // Handle Firestore Timestamp objects
    if (date && typeof date === 'object' && (date._seconds !== undefined || date.seconds !== undefined)) {
      const seconds = date._seconds !== undefined ? date._seconds : date.seconds;
      return new Date(seconds * 1000).toLocaleDateString();
    }
    
    // Handle Date objects
    if (date instanceof Date) {
      return date.toLocaleDateString();
    }
    
    // Handle objects with toDate method
    if (date && typeof date.toDate === 'function') {
      return date.toDate().toLocaleDateString();
    }
    
    // Handle ISO string dates
    if (typeof date === 'string') {
      return new Date(date).toLocaleDateString();
    }
    
    // If its some other object that can't be directly used as a date
    if (typeof date === 'object') {
      return "Date format not supported";
    }
    
    return String(date);
  } catch (e) {
    console.error("Error formatting date:", e, date);
    return "Invalid Date";
  }
};

/**
 * Parse and return a timestamp for various formats
 * @param {Date|Object|string} timestamp - Date object, Firestore timestamp, or date string
 * @returns {Date|null} Parsed Date object or null if parsing fails
 */
export const parseTimestamp = (timestamp) => {
  // If it's already a Date object, return it
  if (timestamp instanceof Date) return timestamp;
  
  // Handle Firestore Timestamp
  if (timestamp && typeof timestamp === 'object') {
    if (timestamp._seconds !== undefined) {
      return new Date(timestamp._seconds * 1000);
    }
    if (timestamp.seconds !== undefined) {
      return new Date(timestamp.seconds * 1000);
    }
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
  }
  
  // Try parsing as a string or numeric timestamp
  const parsed = new Date(timestamp);
  
  // If parsing fails, return null
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Calculate duration between two dates
 * @param {Date|string} startDate - The start date
 * @param {Date|string} endDate - The end date
 * @returns {string} Duration string
 */
export const formatDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return '';
  
  try {
    const start = startDate instanceof Date ? startDate : new Date(startDate);
    const end = endDate instanceof Date ? endDate : new Date(endDate);
    
    const minutes = differenceInMinutes(end, start);
    const hours = differenceInHours(end, start);
    const days = differenceInDays(end, start);
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''}`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
  } catch (error) {
    console.error('Error calculating duration:', error);
    return '';
  }
};

/**
 * Format time duration between two dates (alternative implementation)
 * @param {Date|Object|string} startTime - Start time in any supported format
 * @param {Date|Object|string} endTime - End time in any supported format
 * @returns {string} Formatted duration string
 */
export const formatTimeDuration = (startTime, endTime) => {
  if (!startTime || !endTime) return "Unknown duration";
  
  try {
    const start = parseTimestamp(startTime);
    const end = parseTimestamp(endTime);
    
    // Validate parsed timestamps
    if (!start || !end) {
      console.error("Unable to parse timestamps:", { startTime, endTime });
      return "Unknown duration";
    }
    
    const diffMs = end - start;
    
    // Handle negative or zero duration
    if (diffMs <= 0) {
      return "Less than a minute";
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const remainingMins = diffMins % 60;
    
    if (diffHours > 0) {
      return `${diffHours} hr ${remainingMins} min`;
    } else {
      return `${diffMins} min`;
    }
  } catch (e) {
    console.error("Error calculating duration:", e);
    return "Unknown duration";
  }
};

/**
 * Format a date and time to a readable string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return '';
    
    return dateObj.toLocaleString();
  } catch (error) {
    console.error('Error formatting date time:', error);
    return '';
  }
};

/**
 * Format a date to a short string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted short date string
 */
export const formatShortDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return '';
    
    return dateObj.toLocaleDateString();
  } catch (error) {
    console.error('Error formatting short date:', error);
    return '';
  }
};

/**
 * Get relative time from now
 * @param {Date|string} date - The date to compare
 * @returns {string} Relative time string (e.g., "2 days ago")
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return '';
    
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Check if a date is in the past
 * @param {Date|string} date - The date to check
 * @returns {boolean} True if the date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return false;
    
    return dateObj < new Date();
  } catch (error) {
    console.error('Error checking if date is past:', error);
    return false;
  }
};

/**
 * Check if a date is within a certain number of days from now
 * @param {Date|string} date - The date to check
 * @param {number} days - Number of days from now
 * @returns {boolean} True if the date is within the specified days
 */
export const isWithinDays = (date, days) => {
  if (!date) return false;
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return false;
    
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return dateObj <= futureDate && dateObj >= new Date();
  } catch (error) {
    console.error('Error checking if date is within days:', error);
    return false;
  }
};

/**
 * Get days until a date
 * @param {Date|string} date - The target date
 * @returns {number} Number of days until the date (negative if past)
 */
export const getDaysUntil = (date) => {
  if (!date) return 0;
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return 0;
    
    return differenceInDays(dateObj, new Date());
  } catch (error) {
    console.error('Error calculating days until:', error);
    return 0;
  }
};

/**
 * Format a date for API submission (ISO string)
 * @param {Date|string} date - The date to format
 * @returns {string} ISO date string
 */
export const formatForAPI = (date) => {
  if (!date) return null;
  
  try {
    const dateObj = parseTimestamp(date);
    if (!dateObj) return null;
    
    return dateObj.toISOString();
  } catch (error) {
    console.error('Error formatting date for API:', error);
    return null;
  }
};