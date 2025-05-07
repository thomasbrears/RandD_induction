import { submitContactForm } from './ContactApi';
 import { getAuth } from 'firebase/auth';
 
 /**
  * Formats feedback data into a structured message for the contact form API
  * @param {Object} feedbackData - The feedback form data
  * @returns {String} Formatted feedback message
  */
 const formatFeedbackMessage = (feedbackData) => {
   const ratingMap = {
     1: '😞 Negative',
     2: '😐 Neutral',
     3: '😊 Positive'
   };
 
   const usabilityMap = {
     veryEasy: 'Very easy - I had no issues',
     easy: 'Easy - I had minor issues',
     neutral: 'Neutral',
     difficult: 'Difficult - I had several issues',
     veryDifficult: 'Very difficult - I had many issues'
   };
 
   const clarityMap = {
     veryClear: 'Very clear and helpful',
     mostlyClear: 'Mostly clear and helpful',
     somewhatClear: 'Somewhat clear and helpful',
     notClear: 'Not clear or helpful'
   };
 
   // Build structured message
   return `
    ${feedbackData.inductionName ? `Induction Name: ${feedbackData.inductionName}` : ''}

    ${feedbackData.overallRating ? `Overall Rating: ${ratingMap[feedbackData.overallRating] || 'Not provided'}` : ''}
    
    ${feedbackData.websiteUsability ? `Website Usability: ${usabilityMap[feedbackData.websiteUsability] || 'Not provided'}` : ''}
    
    ${feedbackData.contentClarity ? `Content Clarity: ${clarityMap[feedbackData.contentClarity] || 'Not provided'}` : ''}
    
    ${feedbackData.detailedFeedback ? `Comments: ${feedbackData.detailedFeedback}` : 'No additional comments provided.'}
    
    ${feedbackData.inductionId ? `Induction ID: ${feedbackData.inductionId}` : ''}
      `.trim();
 };
 
 export const submitFeedback = async (feedbackData) => {
   try {
     // Get current user auth token if available
     const auth = getAuth();
     let token = null;
     let userId = null;
     
     if (auth.currentUser) {
       token = await auth.currentUser.getIdToken();
       userId = auth.currentUser.uid;
     }
     
     // Extract required fields or set defaults
     const fullName = feedbackData.fullName || 'INVALID NAME';
     const email = feedbackData.email || 'INVALIDEMAIL-NOREPLY@brears.xyz';
     
     // Create subject line with rating for better visibility
     const ratingEmoji = {
       1: '😞',
       2: '😐',
       3: '😊'
     }[feedbackData.overallRating] || '';
     
     // Format data for contact API
     const contactData = {
       fullName: fullName,
       email: email,
       subject: `${ratingEmoji} Induction Feedback: ${feedbackData.inductionName || feedbackData.inductionId || ' '}`,
       message: formatFeedbackMessage(feedbackData),
       
       // Special tag to identify this as feedback rather than a contact form submission
       formType: 'feedback',
       
       // Additional metadata
       feedbackData,
       userId,
       source: 'induction-feedback',
       contactType: feedbackData.department || 'general',
       
       // Flag to indicate not to send user confirmation email
       skipUserConfirmation: true
     };
          
     // Submit using existing contact API
     const response = await submitContactForm(contactData, token);
     
     return response;
   } catch (error) {
     console.error('Error submitting feedback:', error);
     throw error;
   }
 };