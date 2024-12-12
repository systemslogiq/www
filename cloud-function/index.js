const sgMail = require('@sendgrid/mail');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// These will be set as environment variables in the Cloud Function
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@systemslogiq.com';

// Verify required environment variables
function checkEnvironment() {
  if (!SENDGRID_API_KEY) {
    throw new Error('Missing required SendGrid API key configuration');
  }
  if (!ADMIN_EMAIL) {
    throw new Error('Missing required admin email configuration');
  }
  if (!SENDER_EMAIL) {
    throw new Error('Missing required sender email configuration');
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

    // Initialize SendGrid with API key
    sgMail.setApiKey(SENDGRID_API_KEY);

    // Create email message
    const msg = {
      to: ADMIN_EMAIL,
      from: {
        email: SENDER_EMAIL,
        name: 'SystemsLogiq Contact Form'
      },
      replyTo: email, // Set reply-to as the contact form submitter's email
      subject: `New Contact Form Submission from ${sanitizeInput(name)}`,
      text: `Name: ${sanitizeInput(name)}\nEmail: ${sanitizeInput(email)}\nMessage: ${sanitizeInput(messageText)}`,
      // Add HTML version for better email client compatibility
      html: `
        <p><strong>Name:</strong> ${sanitizeInput(name)}</p>
        <p><strong>Email:</strong> ${sanitizeInput(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizeInput(messageText).replace(/\n/g, '<br>')}</p>
      `
    };

    try {
      await sgMail.send(msg);
      console.log('Email sent successfully');
      return { success: true };
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
