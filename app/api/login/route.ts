import { z } from "zod";
import { getUserByEmail, getUserByEmailAndRole } from "../../../backend/repositories/userRepo";
import { createAccessToken, verifyPassword } from "../../../backend/services/auth";

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  portal: z.enum(["student", "parent", "admin"]).optional(),
});

const PORTAL_ROLE: Record<string, string> = {
  student: "student",
  parent: "parent",
  admin: "admin",
};

const PORTAL_MISMATCH: Record<string, string> = {
  student: "This account is not a student account. Please use the parent or admin portal.",
  parent: "This account is not a parent account. Please use the student portal.",
  admin: "This account is not an admin account.",
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password, portal } = LoginSchema.parse(body);

    // Env-based admin login — bypasses Firestore, works even before Firestore is set up.
    const envAdminEmail =
      process.env.ADMIN_LOGIN_EMAIL || process.env.ADMIN_EMAIL;
    const envAdminPassword =
      process.env.ADMIN_LOGIN_PASSWORD || process.env.ADMIN_PASSWORD;

    if (
      envAdminEmail &&
      envAdminPassword &&
      email.toLowerCase() === envAdminEmail.toLowerCase()
    ) {
      if (password !== envAdminPassword) {
        return Response.json({ error: "Invalid credentials" }, { status: 401 });
      }

      if (portal && portal !== "admin") {
        return Response.json({ error: PORTAL_MISMATCH[portal] }, { status: 403 });
      }

      const token = await createAccessToken({
        sub: `env-admin:${envAdminEmail.toLowerCase()}`,
        email: envAdminEmail,
        role: "admin",
        name: "Admin",
      });

      return Response.json({
        success: true,
        token,
        user: { email: envAdminEmail, name: "Admin", role: "admin" },
      });
    }

    // Firestore-based login for students / parents
    const user = portal
      ? await getUserByEmailAndRole(email, PORTAL_ROLE[portal])
      : await getUserByEmail(email);
    if (!user) {
      console.warn(`[POST /api/login] 401: User not found for email ${email}${portal ? ` (portal=${portal})` : ""}`);
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.password_hash) {
      console.warn(`[POST /api/login] 401: User ${email} has no password hash set`);
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      console.warn(`[POST /api/login] 401: Password mismatch for ${email}`);
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (user.must_reset_password) {
      return Response.json({ success: true, requirePasswordReset: true });
    }

    if (portal) {
      const expectedRole = PORTAL_ROLE[portal];
      if (user.role !== expectedRole) {
        return Response.json({ error: PORTAL_MISMATCH[portal] }, { status: 403 });
      }
    }

    const token = await createAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return Response.json({
      success: true,
      token,
      user: { email: user.email, name: user.name, role: user.role },
    });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "email and password are required" }, { status: 400 });
    }
    console.error("[POST /api/login] error:", e?.message ?? e);
    return Response.json({ error: "Login failed" }, { status: 500 });
  }
}
