const { google } = require('googleapis');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// These will be set as environment variables in the Cloud Function
const CREDENTIALS = process.env.CREDENTIALS ? JSON.parse(process.env.CREDENTIALS) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // The admin email that has permission to impersonate the group

// Verify required environment variables and credentials
function checkEnvironment() {
  if (!CREDENTIALS) {
    throw new Error(
      'CREDENTIALS environment variable is not set. For local testing, ensure you have created a .env file with the CREDENTIALS variable.'
    );
  }
  if (!ADMIN_EMAIL) {
    throw new Error(
      'ADMIN_EMAIL environment variable is not set. For local testing, ensure you have set this in your .env file.'
    );
  }

  // Verify required service account fields
  const requiredFields = ['client_email', 'private_key', 'project_id'];
  for (const field of requiredFields) {
    if (!CREDENTIALS[field]) {
      throw new Error(`Service account credentials missing required field: ${field}`);
    }
  }

  // Verify private key format
  if (!CREDENTIALS.private_key.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid private key format in service account credentials');
  }
}

// Log initialization status
console.log('Initializing contact form handler with admin email:', ADMIN_EMAIL);

async function sendMail(name, email, messageText) {
  try {
    checkEnvironment();

    // Initialize service account auth
    const auth = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/gmail.send'],
      ADMIN_EMAIL  // User to impersonate
    );

    // Create Gmail API client
    const gmail = google.gmail({
      version: 'v1',
      auth
    });

    // Create email message with proper headers
    const message = [
      'From: Contact Form <' + ADMIN_EMAIL + '>',
      'To: ' + ADMIN_EMAIL,
      'Subject: New Contact Form Submission from ' + name,
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Name: ' + name,
      'Email: ' + email,
      'Message: ' + messageText
    ].join('\n');

    // Encode the message
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    try {
      // Send email using Gmail API
      const result = await gmail.users.messages.send({
        userId: ADMIN_EMAIL,
        requestBody: {
          raw: encodedMessage
        }
      });
      
      console.log('Email sent successfully:', result.data);
      return result.data;
    } catch (error) {
      console.error('Failed to send email. Common issues:');
      console.error('1. Service account domain-wide delegation not configured correctly');
      console.error('2. Gmail API not enabled in Google Cloud Console');
      console.error('3. Insufficient service account permissions');
      console.error('\nError details:', error.message);
      throw error;
    }
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

exports.handleFormSubmission = async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', 'https://systemslogiq.com');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  try {
    const { name, email, message: messageText } = req.body;

    if (!name || !email || !messageText) {
      res.status(400).send('Missing required fields');
      return;
    }

    await sendMail(name, email, messageText);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};
