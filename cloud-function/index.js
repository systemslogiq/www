const sgMail = require('@sendgrid/mail');

// Load environment variables from .env file in development
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// These will be set as environment variables in the Cloud Function
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'noreply@systemslogiq.com';

// Email templates for different languages
const emailTemplates = {
  en: {
    subject: 'Thank You for Contacting SystemsLogiq',
    greeting: 'Dear',
    thankYou: 'Thank you for reaching out to SystemsLogiq. We have received your message and will get back to you as soon as possible.',
    messageLabel: 'For your records, here is a copy of your message:',
    signature: 'Best regards,\nThe SystemsLogiq Team'
  },
  de: {
    subject: 'Vielen Dank für Ihre Kontaktaufnahme mit SystemsLogiq',
    greeting: 'Sehr geehrte(r)',
    thankYou: 'Vielen Dank für Ihre Nachricht an SystemsLogiq. Wir haben Ihre Nachricht erhalten und werden uns schnellstmöglich bei Ihnen melden.',
    messageLabel: 'Zu Ihrer Information finden Sie hier eine Kopie Ihrer Nachricht:',
    signature: 'Mit freundlichen Grüßen\nIhr SystemsLogiq Team'
  },
  es: {
    subject: 'Gracias por Contactar a SystemsLogiq',
    greeting: 'Estimado/a',
    thankYou: 'Gracias por contactar a SystemsLogiq. Hemos recibido su mensaje y nos pondremos en contacto con usted lo antes posible.',
    messageLabel: 'Para sus registros, aquí está una copia de su mensaje:',
    signature: 'Saludos cordiales,\nEl Equipo de SystemsLogiq'
  },
  fr: {
    subject: 'Merci d\'avoir Contacté SystemsLogiq',
    greeting: 'Cher/Chère',
    thankYou: 'Merci d\'avoir contacté SystemsLogiq. Nous avons bien reçu votre message et nous vous répondrons dans les plus brefs délais.',
    messageLabel: 'Pour vos dossiers, voici une copie de votre message :',
    signature: 'Cordialement,\nL\'équipe SystemsLogiq'
  }
};

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

// Get email template based on language
function getEmailTemplate(language) {
  return emailTemplates[language] || emailTemplates.en; // Default to English if language not supported
}

async function sendMail(name, email, messageText, language = 'en') {
  try {
    checkEnvironment();

    // Initialize SendGrid with API key
    sgMail.setApiKey(SENDGRID_API_KEY);

    // Get email template for the specified language
    const template = getEmailTemplate(language);

    // Create notification email for admins
    const notificationMsg = {
      to: [ADMIN_EMAIL, SENDER_EMAIL], // Send to both emails
      from: {
        email: SENDER_EMAIL,
        name: 'SystemsLogiq Contact Form'
      },
      replyTo: email, // Set reply-to as the contact form submitter's email
      subject: `New Contact Form Submission from ${sanitizeInput(name)}`,
      text: `Name: ${sanitizeInput(name)}\nEmail: ${sanitizeInput(email)}\nMessage: ${sanitizeInput(messageText)}`,
      html: `
        <p><strong>Name:</strong> ${sanitizeInput(name)}</p>
        <p><strong>Email:</strong> ${sanitizeInput(email)}</p>
        <p><strong>Message:</strong></p>
        <p>${sanitizeInput(messageText).replace(/\n/g, '<br>')}</p>
      `
    };

    // Create thank you email for the submitter using the appropriate language template
    const thankYouMsg = {
      to: email,
      from: {
        email: SENDER_EMAIL,
        name: 'SystemsLogiq'
      },
      subject: template.subject,
      text: `${template.greeting} ${sanitizeInput(name)},

${template.thankYou}

${template.messageLabel}

${sanitizeInput(messageText)}

${template.signature}`,
      html: `
        <p>${template.greeting} ${sanitizeInput(name)},</p>
        <p>${template.thankYou}</p>
        <p>${template.messageLabel}</p>
        <blockquote style="border-left: 2px solid #ccc; margin: 10px 0; padding: 10px;">
          ${sanitizeInput(messageText).replace(/\n/g, '<br>')}
        </blockquote>
        <p>${template.signature.replace(/\n/g, '<br>')}</p>
      `
    };

    try {
      // Send both emails
      await Promise.all([
        sgMail.send(notificationMsg),
        sgMail.send(thankYouMsg)
      ]);
      
      console.log('Emails sent successfully');
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
    const { name, email, message: messageText, language } = req.body;

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

    await sendMail(name, email, messageText, language);
    res.status(200).json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Error:', error.message);
    // Send generic error message to client
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
};
