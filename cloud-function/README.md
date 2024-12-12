# SystemsLogiq Contact Form Handler

This Cloud Function handles contact form submissions from the SystemsLogiq website, sending emails through the info@systemslogiq.com Google Group using Gmail API and domain-wide delegation.

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
5. Skip role assignment (we'll use domain-wide delegation)
6. Click "Done"
7. Find your new service account in the list and click on it
8. Go to the "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose JSON format
11. Click "Create" - this will download your service account key file
12. Save this file securely - you'll need it later

### 3. Configure Domain-Wide Delegation

1. Go to your [Google Workspace Admin Console](https://admin.google.com)
2. Navigate to Security > API Controls
3. Find "Domain-wide Delegation" and click "Manage Domain Wide Delegation"
4. Click "Add new"
5. Enter the following:
   - Client ID: [Your service account's client ID] (found in the JSON key file)
   - OAuth Scopes: https://www.googleapis.com/auth/gmail.send
6. Click "Authorize"

### 4. Prepare Admin Account

1. In Google Workspace Admin Console, ensure you have an admin account that will be used to send emails
2. This admin account needs to have permission to:
   - Send mail as the group (info@systemslogiq.com)
   - Access the Gmail API

### 5. Deploy Cloud Function

Prerequisites:
- Google Cloud CLI installed
- Python 3.x installed (required for JSON processing)
- Node.js 16 or higher

1. Prepare your local environment:
			```bash
			# Install Google Cloud CLI if not already installed
   brew install google-cloud-sdk   # For macOS
   # Or visit https://cloud.google.com/sdk/docs/install for other platforms
   
			# Initialize Google Cloud CLI and set your project
   gcloud init
   
   # Select your project
			gcloud config set project [YOUR_PROJECT_ID]
			
   # Navigate to the cloud-function directory
   cd cloud-function
   
   # Install dependencies
			npm install
			```

2. Test the function locally:
			```bash
			# Install the Functions Framework
			npm install -g @google-cloud/functions-framework
			
			# Place your service account key file in the cloud-function directory
			# Name it service-account-key.json
			
			# Create .env file for local testing (using Python since it's commonly available)
			python3 -c "import json; print(f'CREDENTIALS={json.dumps(json.load(open(\"service-account-key.json\")))}')" > .env
			echo "ADMIN_EMAIL=your-admin@systemslogiq.com" >> .env
			
			# Start the function locally
			functions-framework --target=handleFormSubmission
			
			# Test with curl in another terminal
			curl -X POST http://localhost:8080 \
					-H "Content-Type: application/json" \
					-d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
			```

3. Prepare for deployment:
			```bash
			# Verify you're in the correct project
			gcloud config get-value project
			
			# Enable required APIs
			gcloud services enable \
					cloudfunctions.googleapis.com \
					cloudbuild.googleapis.com \
					gmail.googleapis.com
			
			# Verify the service account key is valid JSON
			jq '.' service-account-key.json
			```

4. Deploy the function:
			```bash
			# Create a temporary credentials string using Python
			CREDS=$(python3 -c "import json; print(json.dumps(json.load(open('service-account-key.json'))))")
			
			# Deploy with all necessary configurations
			gcloud functions deploy handleFormSubmission \
					--runtime nodejs16 \
					--trigger-http \
					--allow-unauthenticated \
					--region us-central1 \
					--memory 256MB \
					--timeout 60s \
					--min-instances 0 \
					--max-instances 10 \
					--set-env-vars CREDENTIALS="$CREDS",ADMIN_EMAIL=[Your_Admin_Email] \
					--set-cors-allowed-origins="https://systemslogiq.com" \
					--ingress-settings=all
			```

5. Verify deployment:
			```bash
			# Get the function URL (save this for updating script.js)
			gcloud functions describe handleFormSubmission --format='get(httpsTrigger.url)'
			
			# Test the deployed function
			curl -X POST $(gcloud functions describe handleFormSubmission --format='get(httpsTrigger.url)') \
					-H "Content-Type: application/json" \
					-H "Origin: https://systemslogiq.com" \
					-d '{"name":"Test User","email":"test@example.com","message":"Test message"}'
			```

6. Monitor the function:
			```bash
			# View logs in real-time
			gcloud functions logs read handleFormSubmission --stream
			
			# View recent logs
			gcloud functions logs read handleFormSubmission --limit=50
			```

7. Important Notes:
			- Keep service-account-key.json secure and do not commit it to version control
			- Add service-account-key.json to .gitignore
			- The function URL needs to be updated in script.js after deployment
			- Memory and instance limits can be adjusted based on usage

8. Update Frontend Code:
			```bash
			# Get your function URL
			FUNCTION_URL=$(gcloud functions describe handleFormSubmission --format='get(httpsTrigger.url)')
			echo "Cloud Function URL: $FUNCTION_URL"
			```

			Update the fetch URL in script.js:
			```javascript
			// Find this section in script.js
			fetch('https://us-central1-[YOUR_PROJECT_ID].cloudfunctions.net/handleFormSubmission', {
			
			// Replace it with your actual function URL
			fetch('YOUR_FUNCTION_URL_HERE', {
			```

9. Troubleshooting:
			```bash
			# Check function status
			gcloud functions describe handleFormSubmission
			
			# View detailed deployment logs
			gcloud functions deploy handleFormSubmission --verbosity=debug
			
			# Test CORS configuration
			curl -X OPTIONS $(gcloud functions describe handleFormSubmission --format='get(httpsTrigger.url)') \
					-H "Origin: https://systemslogiq.com" \
					-H "Access-Control-Request-Method: POST" \
					-H "Access-Control-Request-Headers: Content-Type"
			
			# Common issues:
			# 1. CORS errors - Check the --set-cors-allowed-origins matches your domain
			# 2. Permission denied - Verify service account permissions
			# 3. Email not sending - Check ADMIN_EMAIL environment variable
			```

### 6. Update Frontend Code

1. Open `script.js`
2. Replace the Cloud Function URL:
   ```javascript
   fetch('https://us-central1-[YOUR_PROJECT_ID].cloudfunctions.net/handleFormSubmission', {
   ```

## Testing

1. Fill out the contact form on the website
2. Check info@systemslogiq.com for the received email
3. Verify that success/error messages appear appropriately

## Troubleshooting

### Common Issues

1. **Error: Insufficient Permission**
   - Verify domain-wide delegation is properly configured
   - Check the OAuth scopes are correct
   - Ensure admin email has proper permissions

2. **Error: Invalid Service Account Configuration**
   - Verify CREDENTIALS environment variable is properly set
   - Check service account JSON is properly formatted
   - Ensure service account has domain-wide delegation enabled

3. **CORS Error**
   - Verify the website domain matches the CORS configuration in the Cloud Function
   - Check browser console for specific CORS error messages

### Monitoring

1. View Cloud Function logs:
   ```bash
   gcloud functions logs read handleFormSubmission
   ```

2. Monitor function performance:
   - Go to Google Cloud Console
   - Navigate to Cloud Functions
   - Select handleFormSubmission
   - View monitoring metrics

## Security Considerations

- Service account credentials are stored as environment variables
- Domain-wide delegation is limited to only the necessary Gmail API scope
- CORS is configured to only accept requests from systemslogiq.com
- Input validation is implemented on both frontend and backend
- HTTPS is enforced for all communications

## Maintenance

### Rotating Service Account Keys

It's good practice to periodically rotate service account keys:

1. Create a new key in the Google Cloud Console
2. Update the Cloud Function environment variables:
   ```bash
   gcloud functions deploy handleFormSubmission \
     --update-env-vars CREDENTIALS=[New_Credentials_JSON]
   ```
3. Delete the old key from Google Cloud Console

### Updating Dependencies

1. Update package.json versions
2. Test locally
3. Redeploy the function

## Support

For issues or questions:
1. Check the Cloud Function logs
2. Review the troubleshooting section
3. Contact the development team

## License

This project is proprietary and confidential to SystemsLogiq.








