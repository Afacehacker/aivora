import nodemailer from 'nodemailer';

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: parseInt(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const FROM = `"${process.env.EMAIL_FROM_NAME || 'AIVORA'}" <${process.env.EMAIL_FROM || 'noreply@aivora.com'}>`;

// Base HTML wrapper
const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f4f4f5; color: #18181b; }
    .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 32px; text-align: center; }
    .header h1 { color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
    .header p { color: rgba(255,255,255,0.85); margin-top: 8px; font-size: 15px; }
    .body { padding: 40px 32px; }
    .body h2 { font-size: 22px; font-weight: 600; margin-bottom: 16px; color: #18181b; }
    .body p { font-size: 15px; line-height: 1.6; color: #52525b; margin-bottom: 16px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 24px 0; }
    .info-box { background: #f4f4f5; border-radius: 8px; padding: 20px 24px; margin: 20px 0; }
    .info-box p { margin: 0; }
    .footer { background: #f4f4f5; padding: 24px 32px; text-align: center; }
    .footer p { font-size: 13px; color: #71717a; }
    .divider { height: 1px; background: #e4e4e7; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚡ AIVORA</h1>
      <p>AI Education Platform</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AIVORA. All rights reserved.</p>
      <p style="margin-top:8px;">If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send welcome email after registration
 */
export const sendWelcomeEmail = async (user) => {
  const transporter = createTransporter();
  const content = `
    <h2>Welcome to AIVORA, ${user.name}! 🎉</h2>
    <p>We're thrilled to have you join our community of AI learners. Your journey to mastering artificial intelligence starts now.</p>
    <p>With AIVORA, you can:</p>
    <ul style="list-style:none;padding:0;margin:16px 0;">
      <li style="padding:8px 0;color:#52525b;">✅ Access expert-led AI courses</li>
      <li style="padding:8px 0;color:#52525b;">✅ Learn at your own pace</li>
      <li style="padding:8px 0;color:#52525b;">✅ Earn certificates of completion</li>
      <li style="padding:8px 0;color:#52525b;">✅ Join a community of learners</li>
    </ul>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL}/courses" class="btn">Explore Courses</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `Welcome to AIVORA, ${user.name}!`,
    html: baseTemplate(content),
  });
};

/**
 * Send email verification
 */
export const sendEmailVerification = async (user, token) => {
  const transporter = createTransporter();
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;

  const content = `
    <h2>Verify Your Email Address</h2>
    <p>Hi ${user.name}, please verify your email address to activate your AIVORA account.</p>
    <p>Click the button below to verify your email:</p>
    <div style="text-align:center;">
      <a href="${verificationUrl}" class="btn">Verify Email</a>
    </div>
    <div class="divider"></div>
    <p>Or copy and paste this link in your browser:</p>
    <div class="info-box">
      <p style="word-break:break-all;font-size:13px;">${verificationUrl}</p>
    </div>
    <p>This link expires in <strong>24 hours</strong>.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Verify Your AIVORA Email Address',
    html: baseTemplate(content),
  });
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (user, token) => {
  const transporter = createTransporter();
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;

  const content = `
    <h2>Reset Your Password</h2>
    <p>Hi ${user.name}, we received a request to reset your AIVORA password.</p>
    <p>Click the button below to create a new password:</p>
    <div style="text-align:center;">
      <a href="${resetUrl}" class="btn">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p>Or copy and paste this link in your browser:</p>
    <div class="info-box">
      <p style="word-break:break-all;font-size:13px;">${resetUrl}</p>
    </div>
    <p>This link expires in <strong>1 hour</strong>. If you did not request a password reset, please ignore this email.</p>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: 'Reset Your AIVORA Password',
    html: baseTemplate(content),
  });
};

/**
 * Send payment confirmation email
 */
export const sendPaymentConfirmation = async (user, course, payment) => {
  const transporter = createTransporter();

  const content = `
    <h2>Payment Confirmed! 🎉</h2>
    <p>Hi ${user.name}, your payment was successful. You now have full access to:</p>
    <div class="info-box">
      <p><strong>Course:</strong> ${course.title}</p>
      <p style="margin-top:8px;"><strong>Amount Paid:</strong> ${payment.currency} ${(payment.amount / 100).toLocaleString()}</p>
      <p style="margin-top:8px;"><strong>Transaction Ref:</strong> ${payment.transactionRef}</p>
      <p style="margin-top:8px;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL}/dashboard/my-courses" class="btn">Start Learning</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `Payment Confirmed — ${course.title}`,
    html: baseTemplate(content),
  });
};

/**
 * Send enrollment confirmation email
 */
export const sendEnrollmentConfirmation = async (user, course) => {
  const transporter = createTransporter();

  const content = `
    <h2>You're Enrolled! 🚀</h2>
    <p>Hi ${user.name}, you've been successfully enrolled in:</p>
    <div class="info-box">
      <p><strong>${course.title}</strong></p>
      <p style="margin-top:8px;color:#52525b;">${course.shortDescription || ''}</p>
    </div>
    <p>You can now access all course materials, lessons, and resources. Start learning today!</p>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL}/courses/${course.slug}/learn" class="btn">Start Course</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `You're enrolled in ${course.title}`,
    html: baseTemplate(content),
  });
};

/**
 * Send support reply email
 */
export const sendSupportReply = async (user, ticket) => {
  const transporter = createTransporter();

  const content = `
    <h2>Support Ticket Update</h2>
    <p>Hi ${user.name}, there's a new reply on your support ticket.</p>
    <div class="info-box">
      <p><strong>Ticket:</strong> ${ticket.subject}</p>
      <p style="margin-top:8px;"><strong>Status:</strong> ${ticket.status}</p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.CLIENT_URL}/dashboard/support/${ticket._id}" class="btn">View Reply</a>
    </div>
  `;

  await transporter.sendMail({
    from: FROM,
    to: user.email,
    subject: `Support Reply: ${ticket.subject}`,
    html: baseTemplate(content),
  });
};
