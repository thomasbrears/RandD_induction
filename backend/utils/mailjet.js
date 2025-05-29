import mailjet from 'node-mailjet';
import 'dotenv/config';
import { db } from "../firebase.js";

// Initialise Mailjet API connection
const initializeMailjet = () => {
  try {
    if (!process.env.MJ_APIKEY_PUBLIC || !process.env.MJ_APIKEY_PRIVATE) {
      console.error("WARNING: Mailjet API keys are not properly set in environment variables!");
    }
    
    return mailjet.apiConnect(
      process.env.MJ_APIKEY_PUBLIC,
      process.env.MJ_APIKEY_PRIVATE
    );
  } catch (error) {
    console.error("Failed to initialize Mailjet client:", error);
    throw new Error(`Mailjet initialization error: ${error.message}`);
  }
};

const MailJetConnection = initializeMailjet();

// Get email settings from database
const getEmailSettings = async () => {
  try {
    const snapshot = await db.collection("emailSettings").get();
    if (snapshot.empty) {
      // Return default settings if none exist
      return {
        defaultFrom: "auteventsinductionportal@gmail.com",
        defaultReplyTo: "autevents@brears.xyz",
        defaultCc: ["manager@brears.xyz"]
      };
    }
    
    return snapshot.docs[0].data();
  } catch (error) {
    console.error("Error fetching email settings:", error);
    // Return default settings on error
    return {
      defaultFrom: "auteventsinductionportal@gmail.com",
      defaultReplyTo: "autevents@brears.xyz",
      defaultCc: ["manager@brears.xyz"]
    };
  }
};

// Helper function for generating the default email template (unchanged)
export const generateDefaultEmailTemplate = (bodyContent, { 
  logoUrl = 'https://inductions.autevents.co.nz/images/AUTEventsInductionPortal.jpg', 
  logoAlt = 'AUT Events Induction Portal',
  backgroundColor = '#f4f4f4',
  containerBackgroundColor = '#ffffff',
  headerBackgroundColor = '#000000',
  textColor = '#333333'
} = {}) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background-color: ${backgroundColor};
        }
        .email-container {
          background-color: ${containerBackgroundColor};
          max-width: 600px;
          margin: 0 auto;
          border: 1px solid #e0e0e0;
          border-radius: 10px;
          overflow: hidden;
        }
        .email-header {
          background-color: ${headerBackgroundColor};
          padding: 20px;
          text-align: center;
        }
        .email-header img {
          max-width: 200px;
        }
        .email-body {
          padding: 20px;
          color: ${textColor};
        }
        h1 {
          font-size: 24px;
          color: ${textColor};
        }
        p {
          font-size: 16px;
          line-height: 1.5;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          margin: 20px 0;
          color: #fff;
          background-color: ${headerBackgroundColor};
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <img src="${logoUrl}" alt="${logoAlt}">
        </div>
        <div class="email-body">
          ${bodyContent}
        </div>
      </div>
    </body>
    </html>
  `;
};

// Function to send email
export const sendEmail = async (toEmail, subject, bodyContent, replyToEmail = null, ccEmails = [], options = {}) => {
  console.log(`Sending email to: ${toEmail}`);
  
  try {
    if (!toEmail) {
      throw new Error('Recipient email address is required');
    }
    
    // Get email settings from database
    const emailSettings = await getEmailSettings();
    
    // Use provided emails or fall back to settings from database
    const fromEmail = options.fromEmail || emailSettings.defaultFrom;
    const replyTo = replyToEmail || emailSettings.defaultReplyTo;
    
    const shouldUseCc = ccEmails && ccEmails.length > 0;
    const ccList = shouldUseCc ? ccEmails : [];
    
    // Use the default email template for the content with optional customization
    const htmlContent = generateDefaultEmailTemplate(bodyContent, options);
    
    const messageData = {
      From: {
        Email: fromEmail,
        Name: 'AUT Events Induction Portal',
      },
      To: [
        {
          Email: toEmail,
        },
      ],
      Subject: subject,
      HTMLPart: htmlContent,
      TextPart: bodyContent.replace(/<[^>]*>/g, ''),
    };

    // Add Reply-To if provided
    if (replyTo) {
      messageData.ReplyTo = {
        Email: replyTo,
      };
    }

    // Only add CC emails if they actually exist
    if (ccList.length > 0) {
      messageData.Cc = ccList.map(email => ({ Email: email }));
    }
    
    const requestPayload = {
      Messages: [messageData],
    };

    try {
      const request = await MailJetConnection.post('send', { version: 'v3.1' }).request(requestPayload);
        
      // Check if response contains errors
      if (request.body && request.body.Messages && request.body.Messages[0]) {
        const messageStatus = request.body.Messages[0].Status;
        if (messageStatus !== 'success') {
          console.error('Message was not successful:', messageStatus);
          throw new Error(`Mailjet message status: ${messageStatus}`);
        }
      }
      
      return request.body;
    } catch (apiError) {
      console.error('Mailjet API error:', apiError);
      console.error('Error details:', apiError.response?.body || 'No response body');
      
      // Try to extract useful error information
      const errorMessage = apiError.response?.body?.ErrorMessage || 
                          apiError.response?.body?.ErrorInfo || 
                          apiError.message || 
                          'Unknown Mailjet API error';
      
      throw new Error(`Mailjet API error: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error in sendEmail function:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
};