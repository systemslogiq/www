const { google } = require('googleapis');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// These will be set as environment variables in the Cloud Function
const CREDENTIALS = process.env.CREDENTIALS ? JSON.parse(process.env.CREDENTIALS) : null;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Verify required environment variables and credentials
function checkEnvironment() {
  if (!CREDENTIALS) {
    throw new Error('Missing required credentials configuration');
  }
  if (!ADMIN_EMAIL) {
    throw new Error('Missing required admin email configuration');
  }

  // Verify required service account fields
  const requiredFields = ['client_email', 'private_key', 'project_id'];
  for (const field of requiredFields) {
    if (!CREDENTIALS[field]) {
      throw new Error('Invalid credentials configuration');
    }
  }

  // Verify private key format
  if (!CREDENTIALS.private_key.includes('BEGIN PRIVATE KEY')) {
    throw new Error('Invalid credentials configuration');
  }
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Sanitize input to prevent injection
function sanitizeInput(str) {
  return str
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim();
}

async function sendMail(name, email, messageText) {
  try {
    checkEnvironment();

    // Initialize service account auth
    const auth = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      ['https://www.googleapis.com/auth/gmail.send'],
      ADMIN_EMAIL
    );

    // Create Gmail API client
    const gmail = google.gmail({
      version: 'v1',
      auth,
    });

    // Create email message with proper headers
    const message = [
      'From: Contact Form <' + ADMIN_EMAIL + '>',
      'To: ' + ADMIN_EMAIL,
      'Subject: New Contact Form Submission from ' + sanitizeInput(name),
      'Content-Type: text/plain; charset=utf-8',
      '',
      'Name: ' + sanitizeInput(name),
      'Email: ' + sanitizeInput(email),
      'Message: ' + sanitizeInput(messageText),
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
          raw: encodedMessage,
        },
      });

      console.log('Email sent successfully');
      return result.data;
    } catch (error) {
      console.error('Email sending failed:', error.message);
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error:', error.message);
    throw error;
  }
}

exports.handleFormSubmission = async (req, res) => {
  // Set CORS headers for all requests
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://systemslogiq.com',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '3600',
    'X-RateLimit-Limit': '100',
    'X-RateLimit-Remaining': '99',
    'X-RateLimit-Reset': new Date(Date.now() + 3600000).toISOString()
		};

  // Set all headers
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.set(key, value);
  });

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

    // Validate required fields
    if (!name || !email || !messageText) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Validate input lengths
    if (name.length > 100 || email.length > 100 || messageText.length > 5000) {
      res.status(400).json({ error: 'Input exceeds maximum length' });
      return;
    }

    await sendMail(name, email, messageText);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    // Send generic error message to client
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};

