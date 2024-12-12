const { google } = require('googleapis');
const nodemailer = require('nodemailer');

// These will be set as environment variables in the Cloud Function
const CREDENTIALS = JSON.parse(process.env.CREDENTIALS);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL; // The admin email that has permission to impersonate the group

async function sendMail(name, email, message) {
		try {
				const auth = new google.auth.GoogleAuth({
      credentials: CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/gmail.send'],
    });

				// Create a client that can impersonate the admin account
				const client = await auth.getClient();
				google.options({ auth: client });

    // Set up Gmail API with domain-wide delegation
    const gmail = google.gmail({
						version: 'v1',
      auth: client,
      subject: ADMIN_EMAIL // The admin email that will impersonate the group
    });

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: ADMIN_EMAIL,
        serviceClient: client,
      },
    });

    const mailOptions = {
      from: 'Website Contact Form <info@systemslogiq.com>',
      to: 'info@systemslogiq.com',
      subject: `New Contact Form Submission from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `,
    };

    const result = await transport.sendMail(mailOptions);
    return result;
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
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      res.status(400).send('Missing required fields');
      return;
    }

    await sendMail(name, email, message);
    res.status(200).json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
};

