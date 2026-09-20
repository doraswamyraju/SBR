const nodemailer = require('nodemailer');

/**
 * Send a review request email to the customer
 * @param {string} toEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} serviceType - Service request type
 * @param {string} [reviewUrl] - Custom Google Review URL
 */
const sendReviewEmail = async (toEmail, customerName, serviceType, reviewUrl) => {
  try {
    let transporter;
    const finalReviewUrl = reviewUrl || 'https://g.page/r/CbdJS-IzWTe2EBE/review';

    // Check if SMTP details are defined in .env
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('Notice: SMTP credentials not set in .env. Logging email request details in console fallback mode.');
      console.log(`[Email Fallback] To: ${toEmail}`);
      console.log(`[Email Fallback] Subject: Please leave a review for Sri Balaji Renewables`);
      console.log(`[Email Fallback] Body: Hello ${customerName}, please leave a review at ${finalReviewUrl}`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Sri Balaji Renewables" <no-reply@sribalajirenewables.com>',
      to: toEmail,
      subject: 'Please rate your service with Sri Balaji Renewables',
      text: `Hello ${customerName},

Thank you for choosing Sri Balaji Renewables!
Your service request for ${serviceType} has been completed.

We would appreciate it if you could take a moment to leave us a review on Google Maps (GMB) using this link:
${finalReviewUrl}

Best regards,
Sri Balaji Renewables Team`,
      html: `<p>Hello <strong>${customerName}</strong>,</p>
<p>Thank you for choosing Sri Balaji Renewables!</p>
<p>Your service request for <strong>${serviceType}</strong> has been completed.</p>
<p>We would appreciate it if you could take a moment to leave us a review on Google Maps (GMB) by clicking the link below:</p>
<p><a href="${finalReviewUrl}" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Leave a Review</a></p>
<p>Best regards,<br>Sri Balaji Renewables Team</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
  } catch (error) {
    console.error('Error sending review email:', error.message);
  }
};

/**
 * Send a password reset email to the user
 * @param {string} toEmail - User email address
 * @param {string} userName - User name
 * @param {string} tempPassword - Temporary password or reset info
 * @param {string} role - User role
 */
const sendPasswordResetEmail = async (toEmail, userName, tempPassword, role = 'User') => {
  try {
    let transporter;

    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      console.log('Notice: SMTP credentials not set in .env. Logging password reset email details in console fallback mode.');
      console.log(`[Email Fallback - Password Reset] To: ${toEmail}`);
      console.log(`[Email Fallback - Password Reset] Name: ${userName}, Role: ${role}`);
      console.log(`[Email Fallback - Password Reset] Temporary Password: ${tempPassword}`);
      return;
    }

    const mailOptions = {
      from: process.env.SMTP_FROM || '"Sri Balaji Renewables" <no-reply@sribalajirenewables.com>',
      to: toEmail,
      subject: 'Your Password has been Reset - Sri Balaji Renewables',
      text: `Hello ${userName},

Your account password for Sri Balaji Renewables has been reset by the System Administrator.

Your New Temporary Password: ${tempPassword}

Please log in to your account and change your password immediately in your profile settings.

Best regards,
Sri Balaji Renewables Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0284c7; margin-top: 0;">Sri Balaji Renewables</h2>
          <p>Hello <strong>${userName}</strong>,</p>
          <p>Your account password for Sri Balaji Renewables (Role: <strong>${role}</strong>) has been reset by the administrator.</p>
          <div style="background-color: #f8fafc; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #475569;">Your Temporary Password:</p>
            <p style="margin: 8px 0 0 0; font-size: 20px; font-weight: bold; font-family: monospace; color: #0f172a; letter-spacing: 1px;">${tempPassword}</p>
          </div>
          <p>Please log in to your account using this temporary password and update it to a new password of your choice.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; margin: 0;">This is an automated message from Sri Balaji Renewables. If you did not request this, please contact your administrator.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully: %s', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error.message);
  }
};

module.exports = { sendReviewEmail, sendPasswordResetEmail };

