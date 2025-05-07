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
 * Format time duration between two dates
 * @param {Date|Object|string} startTime - Start time in any supported format
 * @param {Date|Object|string} endTime - End time in any supported format
 * @returns {string} Formatted duration string
 */
export const formatDuration = (startTime, endTime) => {
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