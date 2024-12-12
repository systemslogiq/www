require('dotenv').config();
const { google } = require('googleapis');

async function verifySetup() {
  try {
    console.log('\n1. Checking environment variables...');
    const CREDENTIALS = process.env.CREDENTIALS ? JSON.parse(process.env.CREDENTIALS) : null;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

    if (!CREDENTIALS) {
      throw new Error('CREDENTIALS environment variable is not set');
    }
    if (!ADMIN_EMAIL) {
      throw new Error('ADMIN_EMAIL environment variable is not set');
    }

    console.log('✓ Environment variables present');

    console.log('\n2. Validating service account credentials...');
    const requiredFields = ['client_email', 'private_key', 'project_id'];
    for (const field of requiredFields) {
      if (!CREDENTIALS[field]) {
        throw new Error(`Service account credentials missing required field: ${field}`);
      }
    }
    console.log('✓ Service account credentials valid');
    console.log(`  Project ID: ${CREDENTIALS.project_id}`);
    console.log(`  Client Email: ${CREDENTIALS.client_email}`);

    console.log('\n3. Testing service account authentication...');
    const auth = new google.auth.JWT(
      CREDENTIALS.client_email,
      null,
      CREDENTIALS.private_key,
      [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly', // Needed for getProfile
      ],
      ADMIN_EMAIL // User to impersonate
    );

    await auth.authorize();
    console.log('✓ Service account authentication successful');

    console.log('\n4. Testing Gmail API access...');
    const gmail = google.gmail({
      version: 'v1',
      auth,
    });

    try {
      const profile = await gmail.users.getProfile({ userId: ADMIN_EMAIL });
      console.log('✓ Gmail API access successful');
      console.log(`  Email address: ${profile.data.emailAddress}`);
    } catch (error) {
      console.error('\nGmail API access failed. Please check:');
      console.error('\n1. Domain-wide delegation setup in Google Workspace:');
      console.error('   - Go to admin.google.com > Security > API Controls');
      console.error('   - Find "Domain-wide Delegation"');
      console.error('   - Verify this client ID is listed:', CREDENTIALS.client_id);
      console.error('   - Ensure these exact scopes are authorized:');
      console.error('     https://www.googleapis.com/auth/gmail.send');
      console.error('     https://www.googleapis.com/auth/gmail.readonly');

      console.error('\n2. Service Account permissions:');
      console.error('   - Gmail API is enabled in Google Cloud Console');
      console.error('   - Service account has proper IAM roles');
      console.error('   - Service account is not disabled');

      console.error('\n3. Admin Email configuration:');
      console.error('   - Verify', ADMIN_EMAIL, 'is a Google Workspace admin');
      console.error('   - Admin has necessary privileges to be impersonated');

      if (error.message.includes('Delegation denied')) {
        throw new Error(
          'Domain-wide delegation not configured. Follow the steps above to set up delegation.'
        );
      } else if (error.message.includes('invalid_grant')) {
        throw new Error(
          'Service account authorization failed. Verify the scopes listed above are properly configured.'
        );
      } else if (error.message.includes('Insufficient Permission')) {
        throw new Error(
          'Service account lacks necessary permissions. Check admin privileges and delegation setup.'
        );
      } else {
        throw error;
      }
    }

    console.log('\n5. Testing email sending...');
    try {
      // Create test email message with proper headers
      const message = [
        'From: Contact Form <' + ADMIN_EMAIL + '>',
        'To: ' + ADMIN_EMAIL,
        'Subject: Contact Form Setup Test',
        'Content-Type: text/plain; charset=utf-8',
        '',
        'This is a test email to verify the contact form setup.',
        '',
        'Configuration Details:',
        '- Service Account: ' + CREDENTIALS.client_email,
        '- Project ID: ' + CREDENTIALS.project_id,
        '- Admin Email: ' + ADMIN_EMAIL,
        '',
        'If you receive this email, the setup is working correctly.',
      ].join('\n');

      // Encode the message
      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      // Send test email
      const result = await gmail.users.messages.send({
        userId: ADMIN_EMAIL,
        requestBody: {
          raw: encodedMessage,
        },
      });
      console.log('✓ Test email sent successfully');
      console.log(`  Message ID: ${result.data.id}`);
      console.log('  Check your inbox at ' + ADMIN_EMAIL);
    } catch (error) {
      console.error('\nEmail sending failed. Common issues:');
      console.error('1. Service account domain-wide delegation not configured correctly');
      console.error('2. Gmail API not enabled in Google Cloud Console');
      console.error('3. Insufficient service account permissions');
      console.error('\nError details:', error.message);
      throw error;
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
