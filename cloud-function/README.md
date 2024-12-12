# SystemsLogiq Contact Form Handler

This Cloud Function handles contact form submissions from the SystemsLogiq website, sending emails through SendGrid.

## Prerequisites

- Node.js 16 or higher
- Google Cloud CLI installed
- SendGrid account
- Google Cloud Platform account
- Domain access for DNS configuration

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

2. Domain Authentication (Important to prevent email spoofing warnings):
   - Go to Settings > Sender Authentication
   - Click "Authenticate Your Domain"
   - Enter your domain (e.g., systemslogiq.com)
   - Follow the DNS configuration steps:
     - Add all provided CNAME records to your domain's DNS
     - Add the custom SPF record if requested
     - Add the DKIM records
     - Wait up to 48 hours for DNS changes to propagate
   - Verify the records are properly configured in SendGrid

3. Configure Sender Identity:
   - While in Sender Authentication:
     - Verify your sender email (e.g., noreply@systemslogiq.com)
     - This email must be from the authenticated domain
     - Complete any additional verification steps

4. Create API Key:
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
   # Create .env with SendGrid configuration
   echo "SENDGRID_API_KEY=your_sendgrid_api_key_here" > .env
   echo "ADMIN_EMAIL=your-admin@systemslogiq.com" >> .env
   echo "SENDER_EMAIL=noreply@systemslogiq.com" >> .env
   ```

### 4. Verify Setup

Run the verification script to check your configuration:

```bash
npm run verify
```

If you see a "spoofing" warning in Gmail:
1. Ensure you've completed the domain authentication steps in SendGrid
2. Verify all DNS records are properly configured
3. Wait up to 48 hours for DNS changes to propagate
4. Run the verification script again

Common Issues:
1. Invalid SendGrid API key
2. Sender email not verified
3. Domain authentication incomplete
4. DNS records not properly configured
5. Missing environment variables

### 5. Deployment

Deploy the function:

```bash
# Deploy the function using environment variables from .env.yaml
gcloud functions deploy handleFormSubmission --runtime nodejs18 --trigger-http --allow-unauthenticated --region us-central1 --env-vars-file .env.yaml
```

Note: Ensure your .env.yaml file contains the proper SendGrid API key, admin email, and sender email.

### Troubleshooting

If verification fails, check:

1. SendGrid Setup:
   - Verify API key is correct
   - Ensure sender email is verified
   - Check domain authentication status
   - Verify DNS records are properly configured
   - Check SendGrid account status

2. Environment Variables:
   - Check SENDGRID_API_KEY is set
   - Verify ADMIN_EMAIL is correct
   - Verify SENDER_EMAIL is correct
   - Ensure no extra spaces in values

3. Email Spoofing Warnings:
   - Complete domain authentication in SendGrid
   - Verify all DNS records are added correctly
   - Use a sender email from the authenticated domain
   - Wait for DNS propagation (up to 48 hours)

4. Common Errors:
   - "Unauthorized": Check SendGrid API key
   - "Forbidden": Verify sender email and domain
   - "Invalid API key": Check API key format
   - "Sender not verified": Complete sender verification

## Support

For issues:

1. Run verification script for detailed diagnostics
2. Check Cloud Function logs
3. Verify SendGrid dashboard for email status
4. Check domain authentication status
5. Verify DNS record configuration

## Security Notes

- Keep SendGrid API key secure
- Don't commit credentials to version control
- Use restricted API key permissions
- Regularly rotate API keys
- Monitor SendGrid security settings
- Keep DNS records up to date
- Use authenticated domains for sending
