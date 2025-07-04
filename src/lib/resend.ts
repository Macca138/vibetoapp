import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required');
}

export const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
export const EMAIL_CONFIG = {
  from: process.env.EMAIL_FROM || 'VibeToApp <noreply@vibetoapp.com>',
  replyTo: process.env.EMAIL_REPLY_TO || 'support@vibetoapp.com',
  baseUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
};

// Email templates
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface ExportCompletedEmailData {
  userName: string;
  projectName: string;
  format: 'pdf' | 'markdown';
  downloadUrl: string;
  fileSize: string;
  expiresAt: Date;
}

export interface ExportFailedEmailData {
  userName: string;
  projectName: string;
  format: 'pdf' | 'markdown';
  errorMessage: string;
  supportUrl: string;
}

export function createExportCompletedEmail(data: ExportCompletedEmailData): EmailTemplate {
  const formatName = data.format.toUpperCase();
  const expirationDate = data.expiresAt.toLocaleDateString();
  
  const subject = `Your ${formatName} export for "${data.projectName}" is ready!`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .success-icon {
          background: #10b981;
          color: white;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .content {
          margin: 30px 0;
        }
        .project-info {
          background: #f8fafc;
          border-left: 4px solid #6366f1;
          padding: 20px;
          margin: 20px 0;
          border-radius: 0 8px 8px 0;
        }
        .download-button {
          display: inline-block;
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
          transition: transform 0.2s;
        }
        .download-button:hover {
          transform: translateY(-2px);
        }
        .file-details {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }
        .detail-label {
          font-weight: 500;
          color: #374151;
        }
        .detail-value {
          color: #6b7280;
        }
        .warning {
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning-title {
          font-weight: 600;
          color: #92400e;
          margin-bottom: 5px;
        }
        .warning-text {
          color: #b45309;
          font-size: 14px;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
        .social-links {
          margin: 15px 0;
        }
        .social-links a {
          color: #6366f1;
          text-decoration: none;
          margin: 0 10px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VibeToApp</div>
          <div class="success-icon">✓</div>
          <div class="title">Export Ready!</div>
          <div class="subtitle">Your ${formatName} export has been generated successfully</div>
        </div>

        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <p>Great news! Your ${formatName} export for "<strong>${data.projectName}</strong>" is now ready for download.</p>

          <div class="project-info">
            <h3 style="margin-top: 0; color: #1f2937;">Project: ${data.projectName}</h3>
            <p style="margin-bottom: 0; color: #6b7280;">
              We've successfully generated your project report in ${formatName} format with all your workflow progress and responses.
            </p>
          </div>

          <div style="text-align: center;">
            <a href="${data.downloadUrl}" class="download-button">
              📥 Download Your ${formatName}
            </a>
          </div>

          <div class="file-details">
            <h4 style="margin-top: 0; color: #374151;">File Details</h4>
            <div class="detail-row">
              <span class="detail-label">Format:</span>
              <span class="detail-value">${formatName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">File Size:</span>
              <span class="detail-value">${data.fileSize}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Generated:</span>
              <span class="detail-value">${new Date().toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Expires:</span>
              <span class="detail-value">${expirationDate}</span>
            </div>
          </div>

          <div class="warning">
            <div class="warning-title">⏰ Important Notice</div>
            <div class="warning-text">
              This download link will expire on <strong>${expirationDate}</strong>. 
              Please download your file before this date to avoid losing access.
            </div>
          </div>

          <p>
            If you have any questions or need assistance, feel free to reach out to our support team.
          </p>

          <p>
            Happy building!<br>
            The VibeToApp Team
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} VibeToApp. All rights reserved.</p>
          <div class="social-links">
            <a href="${EMAIL_CONFIG.baseUrl}">Dashboard</a> •
            <a href="${EMAIL_CONFIG.baseUrl}/pricing">Pricing</a> •
            <a href="mailto:${EMAIL_CONFIG.replyTo}">Support</a>
          </div>
          <p style="font-size: 12px; margin-top: 15px;">
            You received this email because you requested an export for your project.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${data.userName},

Your ${formatName} export for "${data.projectName}" is ready!

Download your file: ${data.downloadUrl}

File Details:
- Format: ${formatName}
- Size: ${data.fileSize}
- Generated: ${new Date().toLocaleDateString()}
- Expires: ${expirationDate}

Important: This download link expires on ${expirationDate}. Please download your file before this date.

If you need help, contact us at ${EMAIL_CONFIG.replyTo}

Best regards,
The VibeToApp Team

© ${new Date().getFullYear()} VibeToApp. All rights reserved.
  `.trim();

  return { subject, html, text };
}

export function createExportFailedEmail(data: ExportFailedEmailData): EmailTemplate {
  const formatName = data.format.toUpperCase();
  const subject = `Export failed for "${data.projectName}"`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${subject}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f8fafc;
        }
        .container {
          background: white;
          border-radius: 12px;
          padding: 30px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #6366f1;
          margin-bottom: 10px;
        }
        .error-icon {
          background: #ef4444;
          color: white;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 30px;
          margin-bottom: 20px;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 10px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 16px;
        }
        .content {
          margin: 30px 0;
        }
        .error-details {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          border-radius: 8px;
          padding: 15px;
          margin: 20px 0;
        }
        .error-title {
          font-weight: 600;
          color: #991b1b;
          margin-bottom: 5px;
        }
        .error-message {
          color: #dc2626;
          font-size: 14px;
          font-family: monospace;
          background: #ffffff;
          padding: 10px;
          border-radius: 4px;
          margin-top: 10px;
        }
        .retry-button {
          display: inline-block;
          background: linear-gradient(to right, #6366f1, #8b5cf6);
          color: white;
          text-decoration: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 0;
        }
        .support-button {
          display: inline-block;
          background: transparent;
          color: #6366f1;
          text-decoration: none;
          padding: 15px 30px;
          border: 2px solid #6366f1;
          border-radius: 8px;
          font-weight: 600;
          font-size: 16px;
          text-align: center;
          margin: 20px 10px;
        }
        .footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 20px;
          margin-top: 30px;
          text-align: center;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">VibeToApp</div>
          <div class="error-icon">✗</div>
          <div class="title">Export Failed</div>
          <div class="subtitle">We encountered an issue generating your ${formatName} export</div>
        </div>

        <div class="content">
          <p>Hi ${data.userName},</p>
          
          <p>We're sorry, but we encountered an issue while generating your ${formatName} export for "<strong>${data.projectName}</strong>".</p>

          <div class="error-details">
            <div class="error-title">What happened?</div>
            <p style="margin: 10px 0; color: #6b7280;">
              Our system encountered an error during the export process. This is usually temporary and can be resolved by trying again.
            </p>
            <div class="error-message">${data.errorMessage}</div>
          </div>

          <p>
            <strong>What you can do:</strong>
          </p>
          <ul style="color: #6b7280;">
            <li>Try generating the export again - most issues are temporary</li>
            <li>Check that your project has sufficient workflow data to export</li>
            <li>Contact our support team if the problem persists</li>
          </ul>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${EMAIL_CONFIG.baseUrl}/projects/${data.projectName}" class="retry-button">
              🔄 Try Export Again
            </a>
            <a href="${data.supportUrl}" class="support-button">
              🛠️ Contact Support
            </a>
          </div>

          <p>
            We apologize for the inconvenience and appreciate your patience as we work to resolve this issue.
          </p>

          <p>
            Best regards,<br>
            The VibeToApp Team
          </p>
        </div>

        <div class="footer">
          <p>© ${new Date().getFullYear()} VibeToApp. All rights reserved.</p>
          <p style="font-size: 12px; margin-top: 15px;">
            You received this email because an export you requested encountered an error.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
Hi ${data.userName},

We're sorry, but your ${formatName} export for "${data.projectName}" failed to generate.

Error: ${data.errorMessage}

What you can do:
- Try generating the export again (most issues are temporary)
- Check that your project has sufficient workflow data
- Contact support if the problem persists: ${data.supportUrl}

Try again: ${EMAIL_CONFIG.baseUrl}/projects/${data.projectName}

We apologize for the inconvenience.

Best regards,
The VibeToApp Team
  `.trim();

  return { subject, html, text };
}

// Send email function
export async function sendEmail({
  to,
  subject,
  html,
  text,
  attachments,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}) {
  try {
    const result = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      attachments,
      replyTo: EMAIL_CONFIG.replyTo,
    });

    return { success: true, id: result.data?.id, result };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}