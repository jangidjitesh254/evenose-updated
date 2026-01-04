// EMAIL TEST SCRIPT
// Save as: backend/test-email.js
// Run: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Email Configuration...\n');
  
  console.log('📋 Current Settings:');
  console.log('HOST:', process.env.EMAIL_HOST);
  console.log('PORT:', process.env.EMAIL_PORT);
  console.log('USER:', process.env.EMAIL_USER);
  console.log('FROM:', process.env.EMAIL_FROM);
  console.log('');

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    }
  });

  try {
    // Verify connection
    console.log('🔍 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const info = await transporter.sendMail({
      from: `"Hackathon Platform" <${process.env.EMAIL_FROM}>`,
      to: "hello.naman0@gmail.com", // Send to yourself
      subject: '✅ Email Test Successful',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5;">
          <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
            <h1 style="color: #4F46E5;">🎉 Email Configuration Works!</h1>
            <p>Your email settings are correctly configured.</p>
            <p><strong>Host:</strong> ${process.env.EMAIL_HOST}</p>
            <p><strong>Port:</strong> ${process.env.EMAIL_PORT}</p>
            <p><strong>From:</strong> ${process.env.EMAIL_FROM}</p>
            <p>Coordinator invitations will now be sent successfully!</p>
          </div>
        </div>
      `
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('📬 Check your inbox at:', process.env.EMAIL_USER);
    console.log('');
    console.log('🎉 EMAIL CONFIGURATION IS WORKING!');

  } catch (error) {
    console.error('❌ Email test failed!');
    console.error('Error:', error.message);
    console.error('');
    
    // Provide specific troubleshooting
    if (error.message.includes('EAUTH')) {
      console.error('🔧 AUTHENTICATION FAILED');
      console.error('Solutions:');
      console.error('1. Check EMAIL_USER and EMAIL_PASSWORD are correct');
      console.error('2. For Hostinger: Enable "Allow less secure apps" in email settings');
      console.error('3. Try generating an app-specific password');
    } else if (error.message.includes('ECONNECTION') || error.message.includes('ETIMEDOUT')) {
      console.error('🔧 CONNECTION FAILED');
      console.error('Solutions:');
      console.error('1. Check EMAIL_HOST is correct: smtp.hostinger.com');
      console.error('2. Check EMAIL_PORT: Use 465 (SSL) or 587 (TLS)');
      console.error('3. Check firewall/antivirus blocking port');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🔧 SMTP SERVER NOT FOUND');
      console.error('Solutions:');
      console.error('1. Verify EMAIL_HOST spelling');
      console.error('2. Check DNS resolution');
      console.error('3. Try different SMTP server');
    }
  }
}

testEmail();