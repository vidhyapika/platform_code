import { z } from "zod";
import { getUserByEmail, setUserPassword } from "../../../backend/repositories/userRepo";
import { hashPassword } from "../../../backend/services/auth";
import { getLoginUrlForRole, sendPasswordResetEmail } from "../../../backend/services/notifications";

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

function generateTempPassword() {
  const chars = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: Request) {
  try {
    const { email } = ForgotPasswordSchema.parse(await req.json().catch(() => ({})));

    const user = await getUserByEmail(email);
    if (user) {
      const tempPassword = generateTempPassword();
      await setUserPassword({
        email: user.email,
        passwordHash: await hashPassword(tempPassword),
        mustResetPassword: true,
      });
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name ?? user.email,
        tempPassword,
        role: user.role,
        loginUrl: getLoginUrlForRole(user.role),
      });
    }

    return Response.json({ success: true });
  } catch (e: any) {
    if (e?.name === "ZodError") {
      return Response.json({ error: "Validation error", details: e.issues }, { status: 400 });
    }
    console.error("[POST /api/forgot-password] error:", e?.message ?? e);
    return Response.json({ error: "Password reset request failed" }, { status: 500 });
  }
}
