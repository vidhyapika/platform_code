import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  if (!resendClient) resendClient = new Resend(apiKey);
  return resendClient;
}

function getFrom(): string {
  return process.env.RESEND_FROM || "Vidhyapika <onboarding@resend.dev>";
}

function getAppUrl(): string {
  return (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function getLoginUrlForRole(role: string): string {
  const base = getAppUrl();
  if (role === "parent") return `${base}/parent/login`;
  if (role === "admin") return `${base}/admin/login`;
  return `${base}/login`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(`[EMAIL MOCK] To: ${to}\nSubject: ${subject}\n---\n${html}\n---`);
    return;
  }

  const { error } = await resend.emails.send({
    from: getFrom(),
    to: [to],
    subject,
    html,
  });

  if (error) {
    throw new Error(error.message);
  }
}

function buildEnrollmentHtml(params: {
  recipientName: string;
  className: string;
  loginEmail: string;
  tempPassword: string;
}): string {
  const { recipientName, className, loginEmail, tempPassword } = params;
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#4F46E5;">Welcome to ${className}!</h2>
      <p>Dear ${recipientName},</p>
      <p>You have been successfully enrolled in <strong>${className}</strong> on Vidhyapika, your AI-powered math learning platform.</p>
      <h3>Login Credentials</h3>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Login Email</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${loginEmail}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Temporary Password</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace;">${tempPassword}</td></tr>
      </table>
      <p style="color:#EF4444;"><strong>Important:</strong> You must change this password on your first login.</p>
      <p>Best regards,<br/><strong>Vidhyapika Team</strong></p>
    </div>
  `;
}

export async function sendEnrollmentNotifications(params: {
  studentName: string;
  studentEmail?: string;
  studentPhone?: string;
  parentName: string;
  parentEmail?: string;
  parentPhone?: string;
  className: string;
  tempPassword: string;
  parentTempPassword?: string;
}): Promise<string[]> {
  const {
    studentName,
    studentEmail,
    parentName,
    parentEmail,
    className,
    tempPassword,
    parentTempPassword,
  } = params;

  const subject = `Welcome to ${className} — Vidhyapika`;

  const results: string[] = [];
  const targets = [
    {
      email: studentEmail,
      label: "student",
      name: studentName,
      loginEmail: studentEmail,
      password: tempPassword,
    },
    {
      email: parentEmail,
      label: "parent",
      name: parentName || "Parent",
      loginEmail: parentEmail,
      password: parentTempPassword ?? tempPassword,
    },
  ];

  for (const { email, label, name, loginEmail, password } of targets) {
    if (!email || !loginEmail) continue;
    try {
      const html = buildEnrollmentHtml({
        recipientName: name,
        className,
        loginEmail,
        tempPassword: password,
      });
      await sendEmail(email, subject, html);
      results.push(`Enrollment email sent to ${label} (${email}).`);
    } catch (e: any) {
      results.push(`Email to ${label} failed: ${e.message}`);
    }
  }

  return results;
}

export async function sendFlaggedAlert(params: {
  adminEmail: string;
  studentName: string;
  studentEmail: string;
  topicName: string;
  subTopicName?: string;
  flagType: string;
  attemptCount: number;
}): Promise<void> {
  const { adminEmail, studentName, studentEmail, topicName, subTopicName, flagType, attemptCount } =
    params;

  const subject = `[Vidhyapika] Student Needs Attention: ${studentName}`;
  const context = subTopicName ? `Sub-topic: ${subTopicName} (in ${topicName})` : `Topic: ${topicName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#EF4444;">Student Flagged for Review</h2>
      <p>A student has been flagged after failing ${attemptCount} attempts and requires your attention.</p>
      <table style="border-collapse:collapse;width:100%;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Student</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${studentName} (${studentEmail})</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Context</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${context}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Type</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${flagType}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Attempts</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${attemptCount} (all failed)</td></tr>
      </table>
      <p>Please review this student's progress in the admin portal.</p>
      <p>Best regards,<br/><strong>Vidhyapika System</strong></p>
    </div>
  `;

  await sendEmail(adminEmail, subject, html);
}

export async function sendPasswordResetEmail(params: {
  email: string;
  name: string;
  tempPassword: string;
  role?: string;
  loginUrl?: string;
}): Promise<void> {
  const { email, name, tempPassword, role } = params;
  const loginUrl = params.loginUrl ?? getLoginUrlForRole(role ?? "student");
  const subject = "Vidhyapika — Password Reset";
  const html = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
      <h2 style="color:#4F46E5;">Password Reset</h2>
      <p>Hi ${name},</p>
      <p>Your password has been reset. Use the credentials below to log in, then change your password immediately.</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0;">
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Login Email</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;">${email}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e5e7eb;background:#f9fafb;"><strong>Temporary Password</strong></td>
            <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace;">${tempPassword}</td></tr>
      </table>
      <p><a href="${loginUrl}" style="color:#4F46E5;font-weight:bold;">Sign in to Vidhyapika</a></p>
      <p style="color:#EF4444;"><strong>Important:</strong> You must change this password on your first login.</p>
      <p>Best regards,<br/><strong>Vidhyapika Team</strong></p>
    </div>
  `;
  await sendEmail(email, subject, html);
}
