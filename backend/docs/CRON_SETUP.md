# Cron Job Setup for Overdue Induction Status Updates

This document explains how to set up and use the cron job endpoint for automatically updating induction statuses to "Overdue" when due dates pass.

## Purpose

The overdue status update cron job helps administrators by:
- Automatically identifying inductions with passed due dates
- Changing their status to "Overdue" without manual intervention
- Sending email notifications to users with overdue inductions
- Maintaining accurate reporting and dashboards

## Endpoint Details

**URL Pattern:** `https://your-api-domain.com/api/cron/update-overdue?apiKey=YOUR_API_KEY`

- **Method:** GET
- **Authentication:** API Key (passed as a URL parameter)
- **Required Parameters:** `apiKey`

## Security Setup

### 1. Set the API Key in Environment Variables

Add the following to your `.env` file:

```
CRON_API_KEY=your-long-random-secure-key
```

For security:
- Use a long, random string (32+ characters)
- Do not reuse passwords or tokens from other systems
- Keep this key secret and treat it as sensitive information

Example of generating a secure key:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Alternative using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Never commit the actual API key to version control

Ensure your `.env` file is included in `.gitignore` to prevent accidentally committing the key.

## Setting Up the Cron Job

### Option 1: Using a Dedicated Cron Service (Recommended)

Services like Cronitor, EasyCron, or cron-job.org provide:
- Reliability monitoring
- Failure notifications
- Execution logs

Example setup:
1. Create an account with your preferred cron service
2. Set up a new cron job with:
   - URL: `https://your-api-domain.com/api/cron/update-overdue?apiKey=YOUR_API_KEY`
   - Schedule: Daily at midnight (or your preferred time): `0 0 * * *`
   - Method: GET

### Option 2: Using Vercel Cron Jobs

If your application is hosted on Vercel:

1. Add the following to your `vercel.json` file:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-overdue?apiKey=YOUR_API_KEY",
      "schedule": "0 0 * * *"
    }
  ]
}
```

Note: This requires a Vercel Pro account or higher.

### Option 3: Using Linux Cron with curl

If you have access to a Linux server:

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at midnight)
0 0 * * * curl -s "https://your-api-domain.com/api/cron/update-overdue?apiKey=YOUR_API_KEY" > /dev/null 2>&1
```

## Recommended Execution Schedule

- **Standard Schedule:** Daily at midnight (`0 0 * * *`)
- **Alternative Schedule:** Multiple times per day (e.g., `0 */6 * * *` for every 6 hours)

## Testing the Endpoint

You can test the endpoint by:

1. Manually visiting the URL in a browser with the correct API key
2. Using curl from the command line:

```bash
curl "https://your-api-domain.com/api/cron/update-overdue?apiKey=YOUR_API_KEY"
```

A successful response will look like:

```json
{
  "success": true,
  "updated": 5,
  "message": "5 inductions marked as overdue",
  "updatedInductions": [
    {
      "id": "induction123",
      "userId": "user456",
      "inductionName": "Health and Safety",
      "dueDate": "2023-01-15T00:00:00.000Z"
    },
    ...
  ]
}
```

## Security Considerations

1. **API Key Protection**: 
   - Never share the API key publicly
   - Rotate the key periodically
   - Monitor for unauthorized access attempts

2. **Access Logs**:
   - Review access logs periodically
   - Look for unexpected or repeated calls to the endpoint

3. **Rate Limiting**:
   - Consider implementing rate limiting if necessary

4. **IP Restriction**:
   - For additional security, consider restricting access to specific IP addresses

## Troubleshooting

If the cron job doesn't appear to be working:

1. Check the API key is correct
2. Verify the cron schedule is set correctly
3. Check server logs for errors
4. Test the endpoint manually to ensure it's working
5. Verify that the environment variables are properly set

## Support

For any issues with the cron job setup, please contact the system administrator.
