# SystemsLogiq Contact Form Handler

This Cloud Function handles contact form submissions from the SystemsLogiq website, sending emails through the info@systemslogiq.com Google Group using Gmail API and service account authentication.

## Prerequisites

- Google Cloud Platform account
- Google Workspace admin access
- Node.js 16 or higher
- Google Cloud CLI installed

## Setup Instructions

### 1. Google Cloud Project Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the required APIs:
   - Navigate to "APIs & Services > Library"
   - Search for and enable:
     - Gmail API
     - Cloud Functions API

### 2. Service Account Setup

1. Go to "IAM & Admin > Service Accounts"
2. Click "Create Service Account"
3. Fill in the details:
   - Service account name: "contact-form-handler"
   - Service account ID: will auto-generate
   - Description: "Service account for handling contact form submissions"
4. Click "Create and Continue"
5. Skip role assignment
6. Click "Done"
7. Find your new service account in the list and click on it
8. Go to the "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose JSON format
11. Click "Create" - this will download your service account key file
12. Save this file as `service-account-key.json` in the cloud-function directory

### 3. Domain-wide Delegation Setup

This is the most critical part of the setup. Follow these steps exactly:

1. Go to [Google Workspace Admin Console](https://admin.google.com)
2. Navigate to Security > API Controls
3. Find "Domain-wide Delegation" and click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Configure the delegation:
   - Find your client_id in service-account-key.json
   - Client ID: Copy the exact client_id from the file
   - OAuth Scopes: Copy and paste these exact scopes:
     ```
     https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly
     ```
6. Click "Authorize"

Important Notes:

- The client_id must exactly match what's in your service-account-key.json
- The scopes must be exactly as shown above (no extra spaces)
- The service account email should end with @[project-id].iam.gserviceaccount.com

### 4. Admin Email Setup

1. Choose a Google Workspace admin email that will be used for sending
2. This admin must have:
   - Super admin or necessary admin privileges
   - Permission to send email as the group
   - Access to the Gmail API

### 5. Local Development Setup

1. Install dependencies:

   ```bash
   cd cloud-function
   npm install
   ```

2. Create .env file:

   ```bash
   # Create .env with proper escaping
   python3 -c '
   import json
   creds = json.load(open("service-account-key.json"))
   print(f"CREDENTIALS={json.dumps(json.dumps(creds))}")
   ' > .env

   # Add admin email
   echo "ADMIN_EMAIL=your-admin@systemslogiq.com" >> .env
   ```

### 6. Verify Setup

Run the verification script to check your configuration:

```bash
npm run verify
```

If you see "Insufficient Permission" error:

1. Verify Domain-wide Delegation:

   - Check client_id matches exactly
   - Verify scopes are exactly as shown above
   - Ensure admin email has proper permissions

2. Common Issues:
   - Wrong client_id in delegation setup
   - Missing or incorrect scopes
   - Admin email doesn't have sufficient privileges
   - Gmail API not enabled
   - Service account key file incorrect

### 7. Deployment

Deploy using the existing .env file:

```bash
# Deploy the function using environment variables from .env
gcloud functions deploy handleFormSubmission \
  --runtime nodejs16 \
  --trigger-http \
  --allow-unauthenticated \
  --region us-central1 \
  --env-vars-file .env \
  --set-cors-allowed-origins="https://systemslogiq.com"
```

Note: The .env file created during setup already contains the properly formatted environment variables needed for deployment.

### Troubleshooting

If verification fails, check:

1. Service Account Setup:

   - Verify service-account-key.json contains correct data
   - Ensure Gmail API is enabled
   - Check service account is not disabled

2. Domain-wide Delegation:

   - Confirm client_id matches service account
   - Verify scopes are exactly correct
   - Check admin console for delegation status

3. Admin Email:

   - Verify it's a proper admin account
   - Check it has necessary permissions
   - Ensure it can access Gmail API

4. Common Errors:
   - "Insufficient Permission": Check domain-wide delegation setup
   - "Invalid Grant": Verify scopes and client_id
   - "API Not Enabled": Enable Gmail API in Cloud Console

## Support

For issues:

1. Run verification script for detailed diagnostics
2. Check Cloud Function logs
3. Verify all setup steps carefully
4. Ensure admin email has proper permissions

## Security Notes

- Keep service-account-key.json secure
- Don't commit credentials to version control
- Use minimum required scopes
- Regularly rotate service account keys
