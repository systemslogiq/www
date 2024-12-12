require('dotenv').config();
const sgMail = require('@sendgrid/mail');

async function verifySetup() {
  try {
    console.log('\n1. Checking environment variables...');
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not set');
    }

    console.log('✓ Environment variables present');

    console.log('\n2. Validating SendGrid API key...');
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✓ SendGrid API key format valid');

    console.log('\n3. Testing email sending...');
    try {
      const msg = {
        to: ADMIN_EMAIL,
        from: ADMIN_EMAIL, // Must be verified sender
        subject: 'Contact Form Setup Test',
        text: [
          'This is a test email to verify the contact form setup.',
          '',
          'Configuration Details:',
          '- Admin Email: ' + ADMIN_EMAIL,
          '',
          'If you receive this email, the setup is working correctly.',
        ].join('\n'),
      };

      await sgMail.send(msg);
      console.log('✓ Test email sent successfully');
      console.log('  Check your inbox at ' + ADMIN_EMAIL);
    } catch (error) {
      console.error('\nEmail sending failed. Common issues:');
      console.error('1. Invalid SendGrid API key');
      console.error('2. Sender email not verified in SendGrid');
      console.error('3. SendGrid account restrictions');
      
      if (error.response) {
        console.error('\nSendGrid API Error:');
        console.error('Status code:', error.response.status);
        console.error('Body:', error.response.body);
        
        if (error.response.status === 403) {
          throw new Error('SendGrid API key does not have permission to send email');
        } else if (error.response.status === 401) {
          throw new Error('Invalid SendGrid API key');
        } else {
          throw new Error(`SendGrid API error: ${error.response.body.message || error.message}`);
        }
      } else {
        throw error;
      }
    }

    console.log('\n✅ All checks passed! Your setup is working correctly.');
  } catch (error) {
    console.error('\n❌ Setup verification failed:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

verifySetup();
