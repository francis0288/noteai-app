import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always respond with success to prevent user enumeration
  if (!user) {
    return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
  }

  // Invalidate any existing tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;

  // In dev: log to console. In prod: send email via nodemailer.
  if (process.env.SMTP_HOST) {
    const nodemailer = await import("nodemailer");
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: process.env.SMTP_FROM ?? "noreply@noteai.app",
      to: user.email,
      subject: "Reset your NoteAI password",
      text: `Click to reset your password: ${resetUrl}\n\nThis link expires in 1 hour.`,
      html: `<p>Click to reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    });
  } else {
    console.log(`[DEV] Password reset URL for ${user.email}: ${resetUrl}`);
  }

  return NextResponse.json({ message: "If that email exists, a reset link has been sent." });
}
