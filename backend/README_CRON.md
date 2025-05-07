# Automated Overdue Induction Status Updates

This feature automatically updates induction statuses to "Overdue" when their due dates have passed. 

## How It Works

The system includes a secure API endpoint that can be called by a cron job to:

1. Find all incomplete inductions (status is not "complete")
2. Check if their due dates have passed
3. Update their status to "overdue"
4. Send notification emails to users with overdue inductions

## URL Structure

The endpoint follows this pattern:

```
https://your-domain.com/api/cron/update-overdue?apiKey=YOUR_SECRET_API_KEY
```

Where:
- `YOUR_SECRET_API_KEY` is the value of the environment variable `CRON_API_KEY`

## Security Implementation

This endpoint is secured with an API key rather than JWT authentication to make it easier to call from external cron job services. The security measures include:

1. **API Key Authentication**: The request must include the correct API key as a URL parameter
2. **Environment Variable Storage**: The API key is stored as an environment variable, not in code
3. **Logging**: Failed access attempts are logged for security monitoring

## Setup Instructions

### 1. Setting the API Key

Set the `CRON_API_KEY` environment variable with a long, secure random string:

```bash
# Add to your .env file
CRON_API_KEY=your-long-secure-random-string
```

You can generate a secure key with:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Vercel Cron Setup (Already Configured)

The project is already configured to run the cron job daily at midnight using Vercel's built-in cron functionality:

```json
"crons": [
  {
    "path": "/api/cron/update-overdue?apiKey=${CRON_API_KEY}",
    "schedule": "0 0 * * *"
  }
]
```

This will work automatically once deployed to Vercel with the required environment variable set.

### 3. Alternative Cron Setup (If Not Using Vercel)

If you're not using Vercel, or need additional cron scheduling, see the detailed instructions in [CRON_SETUP.md](./docs/CRON_SETUP.md) for:
- Setting up with dedicated cron services
- Using Linux crontab
- Other scheduling options

## Manual Testing

You can test the endpoint manually with:

```bash
# Replace with your actual domain and API key
curl "https://your-domain.com/api/cron/update-overdue?apiKey=your-api-key"
```

Expected successful response:

```json
{
  "success": true,
  "updated": 3,
  "message": "3 inductions marked as overdue",
  "updatedInductions": [
    {
      "id": "abc123",
      "userId": "user456",
      "inductionName": "Safety Training",
      "dueDate": "2023-04-15T00:00:00.000Z"
    },
    ...
  ]
}
```

## Troubleshooting

If the automatic updates aren't working:

1. Check the `CRON_API_KEY` environment variable is set correctly in Vercel
2. Verify that the cron job is running (check Vercel logs)
3. Test the endpoint manually to confirm it's functioning
4. Review server logs for any errors

## Admin Features

Administrators can:
- See overdue inductions in the dashboard
- Filter and sort by status including "overdue"
- Send additional reminders manually if needed
- View email logs to confirm notifications were sent

For more detailed information about this feature, please refer to the [CRON_SETUP.md](./docs/CRON_SETUP.md) documentation.
