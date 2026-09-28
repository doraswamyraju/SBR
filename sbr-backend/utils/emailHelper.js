const nodemailer = require('nodemailer');

/**
 * Shared transporter factory that handles standard SMTP and SSL (port 465) configurations
 */
const getTransporter = () => {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = parseInt(process.env.SMTP_PORT || '587');
    const isSecure = process.env.SMTP_SECURE === 'true' || port === 465;
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: port,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== 'false',
      }
    });
  }
  return null;
};

const getFromAddress = () => {
  if (process.env.SMTP_FROM) return process.env.SMTP_FROM;
  const name = process.env.SMTP_FROM_NAME || 'Sri Balaji Renewables';
  const email = process.env.SMTP_USER || 'no-reply@sribalajirenewables.com';
  return `"${name}" <${email}>`;
};

/**
 * Send a review request email to the customer
 * @param {string} toEmail - Customer email address
 * @param {string} customerName - Customer name
 * @param {string} serviceType - Service request type
 * @param {string} [reviewUrl] - Custom Google Review URL
 */
const sendReviewEmail = async (toEmail, customerName, serviceType, reviewUrl) => {
  try {
    const transporter = getTransporter();
    const finalReviewUrl = reviewUrl || 'https://g.page/r/CbdJS-IzWTe2EBE/review';

    if (!transporter) {
      console.log('Notice: SMTP credentials not set in .env. Logging email request details in console fallback mode.');
      console.log(`[Email Fallback] To: ${toEmail}`);
      console.log(`[Email Fallback] Subject: Please leave a review for Sri Balaji Renewables`);
      console.log(`[Email Fallback] Body: Hello ${customerName}, please leave a review at ${finalReviewUrl}`);
      return;
    }

    const mailOptions = {
      from: getFromAddress(),
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
    console.log('Review email sent successfully: %s', info.messageId);
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
    const transporter = getTransporter();

    if (!transporter) {
      console.log('Notice: SMTP credentials not set in .env. Logging password reset email details in console fallback mode.');
      console.log(`[Email Fallback - Password Reset] To: ${toEmail}`);
      console.log(`[Email Fallback - Password Reset] Name: ${userName}, Role: ${role}`);
      console.log(`[Email Fallback - Password Reset] Temporary Password: ${tempPassword}`);
      return;
    }

    const mailOptions = {
      from: getFromAddress(),
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

/**
 * Send ticket creation confirmation to customer
 */
const sendTicketConfirmationEmail = async (toEmail, customerName, request) => {
  if (!toEmail) return;
  const requestId = request._id || request.id;
  const serviceType = request.serviceType || 'Solar Service';
  const address = request.customerAddress || 'Customer Address';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Sri Balaji Renewables</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>We have successfully received your service request. Our dispatch team is reviewing it and will assign a technician shortly.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc;">
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Ticket ID:</td><td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace;">#${String(requestId).slice(-6).toUpperCase()}</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Service Type:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${serviceType}</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Address:</td><td style="padding: 10px; border: 1px solid #e2e8f0;">${address}</td></tr>
        <tr><td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">Status:</td><td style="padding: 10px; border: 1px solid #e2e8f0; color: #f59e0b; font-weight: bold;">${request.status || 'Pending'}</td></tr>
      </table>
      <p>You can track the progress of your service request live in your SBR mobile app or web portal.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">Sri Balaji Renewables - Clean Energy Solutions</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromAddress(),
        to: toEmail,
        subject: `Service Request Received #${String(requestId).slice(-6).toUpperCase()} - Sri Balaji Renewables`,
        html
      });
    } else {
      console.log(`[Email Fallback - Ticket Created] To: ${toEmail}, Request: ${requestId}`);
    }
  } catch (err) {
    console.error('Error sending ticket confirmation email:', err.message);
  }
};

/**
 * Send agent assigned notification email to customer
 */
const sendAgentAssignedEmail = async (toEmail, customerName, agentName, agentPhone, request) => {
  if (!toEmail) return;
  const requestId = request._id || request.id;
  const serviceType = request.serviceType || 'Solar Service';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Sri Balaji Renewables</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Good news! A certified technician has been assigned to your service request.</p>
      <div style="background-color: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <h4 style="margin: 0 0 8px 0; color: #15803d;">Assigned Technician:</h4>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #0f172a;">${agentName || 'Field Technician'}</p>
        ${agentPhone ? `<p style="margin: 4px 0 0 0; color: #475569;">Contact: <a href="tel:${agentPhone}" style="color: #0284c7; text-decoration: none; font-weight: bold;">${agentPhone}</a></p>` : ''}
      </div>
      <p><strong>Ticket ID:</strong> #${String(requestId).slice(-6).toUpperCase()} (${serviceType})</p>
      <p>You can track the technician's route and location in real time via the SBR mobile app.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">Sri Balaji Renewables Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromAddress(),
        to: toEmail,
        subject: `Technician Assigned to Ticket #${String(requestId).slice(-6).toUpperCase()} - Sri Balaji Renewables`,
        html
      });
    } else {
      console.log(`[Email Fallback - Technician Assigned] To: ${toEmail}, Agent: ${agentName}`);
    }
  } catch (err) {
    console.error('Error sending agent assigned email:', err.message);
  }
};

/**
 * Send service completion invoice and review email
 */
const sendServiceCompletedInvoiceEmail = async (toEmail, customerName, request, reviewUrl) => {
  if (!toEmail) return;
  const requestId = request._id || request.id;
  const serviceType = request.serviceType || 'Solar Service';
  const finalAmount = request.finalAmount || request.paymentAmount || 0;
  const finalReviewUrl = reviewUrl || 'https://g.page/r/CbdJS-IzWTe2EBE/review';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0284c7; margin-top: 0;">Sri Balaji Renewables</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your service request <strong>#${String(requestId).slice(-6).toUpperCase()}</strong> (${serviceType}) has been successfully completed!</p>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #0f172a;">Billing Summary</h4>
        <p style="margin: 4px 0; color: #475569;">Service Charges: ₹${request.serviceCharge || 0}</p>
        <p style="margin: 4px 0; color: #475569;">Components / Parts: ₹${request.inventoryTotal || 0}</p>
        ${request.discount ? `<p style="margin: 4px 0; color: #16a34a;">Discount: -₹${request.discount}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #cbd5e1; margin: 8px 0;" />
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0f172a;">Total Paid: ₹${finalAmount} (${request.paymentMethod || 'Cash'})</p>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <p style="margin-bottom: 12px; font-size: 15px; font-weight: 500;">How was your service experience? Please leave us a review:</p>
        <a href="${finalReviewUrl}" style="display:inline-block;padding:12px 24px;background-color:#22c55e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">Leave Google Review ⭐⭐⭐⭐⭐</a>
      </div>

      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
      <p style="font-size: 12px; color: #64748b; margin: 0;">Sri Balaji Renewables - Thank you for supporting clean solar energy!</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromAddress(),
        to: toEmail,
        subject: `Service Completed & Receipt #${String(requestId).slice(-6).toUpperCase()} - Sri Balaji Renewables`,
        html
      });
    } else {
      console.log(`[Email Fallback - Invoice & Review] To: ${toEmail}, Total: ₹${finalAmount}`);
    }
  } catch (err) {
    console.error('Error sending service completed invoice email:', err.message);
  }
};

const sendReferralRewardEmail = async (toEmail, customerName, refereeName, rewardAmount, currentBalance) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #059669;">Referral Reward Credited! 🎉</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Great news! Your friend <strong>${refereeName}</strong> has completed a purchase with Sri Balaji Renewables.</p>
      <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 16px; color: #065f46;">Reward Credited: <strong>₹${rewardAmount}</strong></p>
        <p style="margin: 6px 0 0 0; font-size: 14px; color: #047857;">Total Referral Balance: ₹${currentBalance}</p>
      </div>
      <p>You can claim your cash payout anytime directly from the SBR App (Rewards section via UPI or Bank Transfer).</p>
      <p>Best regards,<br>Sri Balaji Renewables Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromAddress(),
        to: toEmail,
        subject: `Referral Reward Credited: ₹${rewardAmount} - Sri Balaji Renewables`,
        html
      });
    } else {
      console.log(`[Email Fallback - Referral Reward] To: ${toEmail}, Reward: ₹${rewardAmount}`);
    }
  } catch (err) {
    console.error('Error sending referral reward email:', err.message);
  }
};

const sendReferralPayoutEmail = async (toEmail, customerName, amount, payoutMethod, transactionRef) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #2563eb;">Referral Payout Disbursed 💸</h2>
      <p>Hello <strong>${customerName}</strong>,</p>
      <p>Your payout claim of <strong>₹${amount}</strong> has been successfully processed.</p>
      <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 15px; color: #1e40af;">Amount: <strong>₹${amount}</strong></p>
        <p style="margin: 4px 0; color: #1e40af;">Method: ${payoutMethod}</p>
        <p style="margin: 4px 0; color: #1e40af;">Transaction Reference / UTR: <strong>${transactionRef || 'Completed'}</strong></p>
      </div>
      <p>Thank you for partnering with Sri Balaji Renewables!</p>
      <p>Best regards,<br>Sri Balaji Renewables Finance Team</p>
    </div>
  `;

  try {
    const transporter = getTransporter();
    if (transporter) {
      await transporter.sendMail({
        from: getFromAddress(),
        to: toEmail,
        subject: `SBR Referral Payout Processed - ₹${amount}`,
        html
      });
    } else {
      console.log(`[Email Fallback - Referral Payout] To: ${toEmail}, Amount: ₹${amount}`);
    }
  } catch (err) {
    console.error('Error sending referral payout email:', err.message);
  }
};

module.exports = {
  sendReviewEmail,
  sendPasswordResetEmail,
  sendTicketConfirmationEmail,
  sendAgentAssignedEmail,
  sendServiceCompletedInvoiceEmail,
  sendReferralRewardEmail,
  sendReferralPayoutEmail
};
