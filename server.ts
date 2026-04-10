import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import twilio from "twilio";
import { Resend } from "resend";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize external services lazily
  let twilioClient: any = null;
  let resendClient: Resend | null = null;

  const getTwilio = () => {
    if (!twilioClient) {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!accountSid || !authToken) {
        throw new Error("Twilio credentials missing. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN.");
      }
      twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
  };

  const getResend = () => {
    if (!resendClient) {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) {
        throw new Error("Resend API key missing. Please set RESEND_API_KEY.");
      }
      resendClient = new Resend(apiKey);
    }
    return resendClient;
  };

  // Mock database for users
  const mockUsers: Record<string, { password: string; isFirstLogin: boolean; role?: string; name?: string }> = {
    "student@demo.com": {
      password: "password123",
      isFirstLogin: false,
      role: "student",
      name: "Arjun (Demo Student)"
    },
    "parent@demo.com": {
      password: "password123",
      isFirstLogin: false,
      role: "parent",
      name: "Mr. Sharma (Demo Parent)"
    },
    "admin@demo.com": {
      password: "admin",
      isFirstLogin: false,
      role: "admin",
      name: "Admin User"
    }
  };

  // API Routes
  app.post("/api/notify-student", async (req, res) => {
    try {
      const { studentName, studentEmail, studentPhone, parentName, parentEmail, parentPhone, className } = req.body;

      // Generate a temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      if (studentEmail) {
        mockUsers[studentEmail] = { password: tempPassword, isFirstLogin: true };
      }
      if (parentEmail) {
        mockUsers[parentEmail] = { password: tempPassword, isFirstLogin: true };
      }

      const emailSubject = `Welcome to ${className}!`;
      const emailHtml = `
        <h2>Welcome to ${className}!</h2>
        <p>Dear ${studentName} and ${parentName},</p>
        <p>You have been successfully enrolled in ${className}. We are excited to have you on board!</p>
        <p><strong>Your temporary login credentials:</strong></p>
        <p>Password: <code>${tempPassword}</code></p>
        <p><em>Note: You will be required to change this password upon your first login.</em></p>
        <p>Best regards,<br/>Curriculum Admin</p>
      `;

      const smsBody = `Welcome to ${className}, ${studentName}! Your temporary password is: ${tempPassword}. You must change it on first login.`;

      const notifications = [];

      // Send Emails
      try {
        const resend = getResend();
        const emailPromises = [];
        if (studentEmail) {
          emailPromises.push(resend.emails.send({
            from: 'Admin <onboarding@resend.dev>',
            to: studentEmail,
            subject: emailSubject,
            html: emailHtml
          }));
        }
        if (parentEmail) {
          emailPromises.push(resend.emails.send({
            from: 'Admin <onboarding@resend.dev>',
            to: parentEmail,
            subject: emailSubject,
            html: emailHtml
          }));
        }
        await Promise.all(emailPromises);
        notifications.push("Emails sent successfully.");
      } catch (e: any) {
        console.error("Email error:", e);
        notifications.push(`Email skipped/failed: ${e.message}`);
      }

      // Send SMS
      try {
        const twilio = getTwilio();
        const twilioPhone = process.env.TWILIO_PHONE_NUMBER; // e.g., +1234567890
        const smsPromises = [];
        
        const handleSmsError = (e: any, phone: string, body: string) => {
          if (e.code === 21608) {
            console.log(`\n=== MOCK SMS (Twilio Trial Restriction) ===\nTo: ${phone}\nBody: ${body}\n===========================================\n`);
            return { status: 'mocked', to: phone };
          }
          throw e;
        };

        if (studentPhone && twilioPhone) {
          smsPromises.push(
            twilio.messages.create({
              body: smsBody,
              from: twilioPhone,
              to: studentPhone
            }).catch((e: any) => handleSmsError(e, studentPhone, smsBody))
          );
        }
        if (parentPhone && twilioPhone) {
          smsPromises.push(
            twilio.messages.create({
              body: smsBody,
              from: twilioPhone,
              to: parentPhone
            }).catch((e: any) => handleSmsError(e, parentPhone, smsBody))
          );
        }
        
        if (smsPromises.length > 0) {
          const results = await Promise.all(smsPromises);
          const mockedCount = results.filter(r => r && r.status === 'mocked').length;
          
          if (mockedCount === results.length) {
            notifications.push("SMS mocked successfully (Twilio trial limits). Check server console.");
          } else if (mockedCount > 0) {
            notifications.push(`SMS sent (${mockedCount} mocked due to Twilio limits).`);
          } else {
            notifications.push("SMS sent successfully.");
          }
        }
      } catch (e: any) {
        console.error("SMS error:", e);
        notifications.push(`SMS skipped/failed: ${e.message}`);
      }

      res.json({ success: true, notifications });
    } catch (error: any) {
      console.error("Notification error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/login", (req, res) => {
    const { email, password } = req.body;
    
    // Check our mock database
    const user = mockUsers[email];
    if (user) {
      if (user.password === password) {
        if (user.isFirstLogin) {
          return res.json({ success: true, requirePasswordReset: true });
        }
        return res.json({ 
          success: true, 
          token: "mock-jwt-token",
          user: {
            email,
            name: user.name,
            role: user.role
          }
        });
      }
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Fallback for default mock login if not in our mock DB
    if (email === "student@school.edu" && password === "password") {
      return res.json({ 
        success: true, 
        token: "mock-jwt-token",
        user: { email, name: "Default Student", role: "student" }
      });
    }

    res.status(401).json({ error: "Invalid credentials" });
  });

  app.post("/api/reset-password", (req, res) => {
    const { email, oldPassword, newPassword } = req.body;
    
    const user = mockUsers[email];
    if (!user || user.password !== oldPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Update password and clear first login flag
    mockUsers[email] = {
      password: newPassword,
      isFirstLogin: false
    };

    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
