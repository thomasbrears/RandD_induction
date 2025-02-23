import mailjet from 'node-mailjet';
import 'dotenv/config';

// Initialize Mailjet API connection
const MailJetConnection = mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

// Helper function for generating the default email template
export const generateDefaultEmailTemplate = (bodyContent, { 
  logoUrl = 'https://dev-aut-events-induction.vercel.app/images/AUTEventsInductionPortal.jpg', 
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
  try {
    // Use the default email template for the content with optional customization
    const htmlContent = generateDefaultEmailTemplate(bodyContent, options);
    
    const messageData = {
      From: {
        Email: 'aut-events-induction-portal@pricehound.tech',
        Name: 'AUT Events Induction Portal',
      },
      To: [
        {
          Email: toEmail,
        },
      ],
      Subject: subject,
      HTMLPart: htmlContent,
    };

    // Add Reply-To if provided
    if (replyToEmail) {
      messageData.ReplyTo = {
        Email: replyToEmail,
      };
    }

    // Add CC emails if provided
    if (ccEmails.length > 0) {
      messageData.Cc = ccEmails.map(email => ({ Email: email }));
    }

    const request = MailJetConnection.post('send', { version: 'v3.1' }).request({
      Messages: [messageData],
    });

    const result = await request;
    console.log('Email sent successfully:', result.body);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error; // Re-throw to allow caller to handle the error
  }
};