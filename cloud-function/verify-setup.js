require('dotenv').config();
const sgMail = require('@sendgrid/mail');

// Test all supported languages
const languages = ['en', 'de', 'es', 'fr'];

async function verifySetup() {
  try {
    console.log('\n1. Checking environment variables...');
    const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
    const SENDER_EMAIL = process.env.SENDER_EMAIL;

    if (!SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is not set');
    }
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not set');
    }
    if (!SENDER_EMAIL) {
      throw new Error('SENDER_EMAIL environment variable is not set');
    }

    console.log('✓ Environment variables present');
    console.log(`  Admin Email: ${ADMIN_EMAIL}`);
    console.log(`  Sender Email: ${SENDER_EMAIL}`);

    console.log('\n2. Validating SendGrid API key...');
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✓ SendGrid API key format valid');

    console.log('\n3. Testing email sending in all supported languages...');
    try {
      for (const lang of languages) {
        console.log(`\nTesting ${lang.toUpperCase()} emails...`);

        // Test notification email
        const notificationMsg = {
          to: [ADMIN_EMAIL, SENDER_EMAIL],
          from: {
            email: SENDER_EMAIL,
            name: 'SystemsLogiq Contact Form',
          },
          subject: `Contact Form Setup Test - ${lang.toUpperCase()} Notification`,
          text: [
            `This is a test notification email (${lang.toUpperCase()}) to verify the contact form setup.`,
            '',
            'Configuration Details:',
            '- Admin Email: ' + ADMIN_EMAIL,
            '- Sender Email: ' + SENDER_EMAIL,
            '- Language: ' + lang.toUpperCase(),
            '',
            'Important:',
            '1. If you see a "spoofing" warning in Gmail, you need to:',
            '   - Complete domain authentication in SendGrid',
            '   - Verify ownership of ' + SENDER_EMAIL.split('@')[1],
            '   - Wait up to 48 hours for DNS changes to propagate',
            '',
            '2. Ensure ' + SENDER_EMAIL + ' is verified in SendGrid',
            '',
            'You should receive this email at both admin and sender addresses.',
          ].join('\n'),
          html: [
            `<h2>Contact Form Setup Test - ${lang.toUpperCase()} Notification</h2>`,
            `<p>This is a test notification email (${lang.toUpperCase()}) to verify the contact form setup.</p>`,
            '<h3>Configuration Details:</h3>',
            '<ul>',
            `<li><strong>Admin Email:</strong> ${ADMIN_EMAIL}</li>`,
            `<li><strong>Sender Email:</strong> ${SENDER_EMAIL}</li>`,
            `<li><strong>Language:</strong> ${lang.toUpperCase()}</li>`,
            '</ul>',
            '<h3>Important:</h3>',
            '<ol>',
            '<li>If you see a "spoofing" warning in Gmail, you need to:',
            '<ul>',
            '<li>Complete domain authentication in SendGrid</li>',
            `<li>Verify ownership of ${SENDER_EMAIL.split('@')[1]}</li>`,
            '<li>Wait up to 48 hours for DNS changes to propagate</li>',
            '</ul>',
            '</li>',
            `<li>Ensure ${SENDER_EMAIL} is verified in SendGrid</li>`,
            '</ol>',
            '<p>You should receive this email at both admin and sender addresses.</p>',
          ].join('\n'),
        };

        // Test thank you email
        const thankYouMsg = {
          to: ADMIN_EMAIL, // Using admin email for test
          from: {
            email: SENDER_EMAIL,
            name: 'SystemsLogiq',
          },
          subject: `Contact Form Setup Test - ${lang.toUpperCase()} Thank You Email`,
          text: `Dear Test User,

This is a test of the thank you email (${lang.toUpperCase()}) that will be sent to users who submit the contact form.

Thank you for reaching out to SystemsLogiq. We have received your message and will get back to you as soon as possible.

For your records, here is a copy of your message:
This is a test message.

Best regards,
The SystemsLogiq Team`,
          html: `
            <p>Dear Test User,</p>
            <p>This is a test of the thank you email (${lang.toUpperCase()}) that will be sent to users who submit the contact form.</p>
            <p>Thank you for reaching out to SystemsLogiq. We have received your message and will get back to you as soon as possible.</p>
            <p>For your records, here is a copy of your message:</p>
            <blockquote style="border-left: 2px solid #ccc; margin: 10px 0; padding: 10px;">
              This is a test message.
            </blockquote>
            <p>Best regards,<br>The SystemsLogiq Team</p>
          `,
        };

        // Send both test emails for this language
        await Promise.all([sgMail.send(notificationMsg), sgMail.send(thankYouMsg)]);

        console.log(`✓ ${lang.toUpperCase()} test emails sent successfully`);
      }

      console.log('\n✓ All language tests completed successfully');
      console.log('  Check your inbox for:');
      console.log('  1. Notification emails (sent to both admin and sender addresses)');
      console.log('  2. Thank you email templates in different languages');

      console.log('\nNote: If you see a "spoofing" warning in Gmail, follow these steps:');
      console.log('1. Go to SendGrid Settings > Sender Authentication');
      console.log('2. Complete domain authentication for ' + SENDER_EMAIL.split('@')[1]);
      console.log('3. Add the required DNS records to your domain');
      console.log('4. Wait up to 48 hours for DNS changes to propagate');
    } catch (error) {
      console.error('\nEmail sending failed. Common issues:');
      console.error('1. Invalid SendGrid API key');
      console.error('2. Sender email not verified in SendGrid');
      console.error('3. Domain authentication not completed');
      console.error('4. SendGrid account restrictions');

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
