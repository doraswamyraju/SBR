const nodemailer = require('nodemailer');

/**
 * Send a review request email to the customer
 * @param {string} toEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} serviceType - Service request type
 */
const sendReviewEmail = async (toEmail, customerName, serviceType) => {
  try {
    let transporter;

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
      console.log(`[Email Fallback] Body: Hello ${customerName}, please leave a review at https://g.page/r/CbdJS-IzWTe2EBE/review`);
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
https://g.page/r/CbdJS-IzWTe2EBE/review

Best regards,
Sri Balaji Renewables Team`,
      html: `<p>Hello <strong>${customerName}</strong>,</p>
<p>Thank you for choosing Sri Balaji Renewables!</p>
<p>Your service request for <strong>${serviceType}</strong> has been completed.</p>
<p>We would appreciate it if you could take a moment to leave us a review on Google Maps (GMB) by clicking the link below:</p>
<p><a href="https://g.page/r/CbdJS-IzWTe2EBE/review" style="display:inline-block;padding:10px 20px;background-color:#4CAF50;color:white;text-decoration:none;border-radius:5px;font-weight:bold;">Leave a Review</a></p>
<p>Best regards,<br>Sri Balaji Renewables Team</p>`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: %s', info.messageId);
  } catch (error) {
    console.error('Error sending review email:', error.message);
  }
};

module.exports = { sendReviewEmail };
