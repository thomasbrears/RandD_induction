import mailjet from 'node-mailjet';
import 'dotenv/config';

const mj = mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

export const sendEmail = async (toEmail, subject, htmlContent, replyToEmail = null, ccEmails = []) => {
  try {
    const messageData = {
      From: {
        // Email: 'noreply@r-and-d-induction.mailjetapi.com',
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

    const request = mj.post('send', { version: 'v3.1' }).request({
      Messages: [messageData],
    });

    const result = await request;
    console.log('Email sent successfully:', result.body);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};