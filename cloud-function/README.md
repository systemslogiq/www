# SystemsLogiq Contact Form Handler

This Cloud Function handles contact form submissions from the SystemsLogiq website, sending emails through SendGrid.

## Prerequisites

- Node.js 16 or higher
- Google Cloud CLI installed
- SendGrid account
- Google Cloud Platform account

## Setup Instructions

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Navigate to "APIs & Services > Library"
   - Search for and enable:
     - Cloud Functions API

### 2. SendGrid Setup

1. Create a [SendGrid account](https://signup.sendgrid.com/) if you don't have one
2. Verify your sender email:
   - Go to Settings > Sender Authentication
   - Follow the steps to verify your domain or at least your sender email
3. Create API Key:
   - Go to Settings > API Keys
   - Click "Create API Key"
   - Name: "SystemsLogiq Contact Form"
   - Permission: "Restricted Access" with "Mail Send" permissions
   - Save the API key securely - you won't be able to see it again

### 3. Local Development Setup

1. Install dependencies:

   ```bash
   cd cloud-function
   npm install
   ```

2. Create .env file:

   ```bash
   # Create .env with SendGrid API key and admin email
   echo "SENDGRID_API_KEY=your_sendgrid_api_key_here" > .env
   echo "ADMIN_EMAIL=your-admin@systemslogiq.com" >> .env
   ```

### 4. Verify Setup

Run the verification script to check your configuration:

```bash
npm run verify
```

If you see errors:

1. Common Issues:
   - Invalid SendGrid API key
   - Unverified sender email
   - SendGrid API access restricted
   - Missing environment variables

### 5. Deployment

Deploy the function:

```bash
# Deploy the function using environment variables from .env.yaml
gcloud functions deploy handleFormSubmission --runtime nodejs18 --trigger-http --allow-unauthenticated --region us-central1 --env-vars-file .env.yaml
```

Note: Ensure your .env.yaml file contains the proper SendGrid API key and admin email.

### Troubleshooting

If verification fails, check:

1. SendGrid Setup:
   - Verify API key is correct
   - Ensure sender email is verified
   - Check SendGrid account status
   - Verify API key has proper permissions

2. Environment Variables:
   - Check SENDGRID_API_KEY is set
   - Verify ADMIN_EMAIL is correct
   - Ensure no extra spaces in values

3. Common Errors:
   - "Unauthorized": Check SendGrid API key
   - "Forbidden": Verify sender email
   - "Invalid API key": Check API key format
   - "Sender not verified": Complete sender verification

## Support

For issues:

1. Run verification script for detailed diagnostics
2. Check Cloud Function logs
3. Verify SendGrid dashboard for email status
4. Ensure sender verification is complete

## Security Notes

- Keep SendGrid API key secure
- Don't commit credentials to version control
- Use restricted API key permissions
- Regularly rotate API keys
- Monitor SendGrid security settings
