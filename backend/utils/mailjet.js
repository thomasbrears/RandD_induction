import mailjet from 'node-mailjet';
import 'dotenv/config';

const mj = mailjet.apiConnect(
  process.env.MJ_APIKEY_PUBLIC,
  process.env.MJ_APIKEY_PRIVATE
);

export const sendEmail = async (toEmail, subject, message) => {
    try{
        const request = mj.post('send', { version: 'v3.1' }).request({
          Messages: [
            {
              From: {
                Email: 'noreply@r-and-d-induction.mailjetapi.com',
                Name: 'Aut Events Induction',
              },
              To: [
                {
                  Email: toEmail,
                },
              ],
              Subject: subject,
              TextPart: message,
              HTMLPart: `<p>${message}</p>`,
            },
          ],
        });
        const result = await request;
        console.log('Email sent successfully:', result.body);
    }catch(error) {
        console.error('Error sending email:', error);
    }
};