import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mailer } from "@/lib/mailer";
import { env } from "@/env";
import { clientRegistrationLimiter, getIpFromHeaders } from "@/lib/ratelimit";

const registrationSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères")
    .refine((v) => /[A-Za-z]/.test(v) && /[0-9]/.test(v), {
      message: "Le mot de passe doit contenir au moins une lettre et un chiffre",
    }),
  recaptchaToken: z.string().min(1, "Le token reCAPTCHA est requis"),
});

async function verifyRecaptcha(token: string) {
  try {
    const secret = env.RECAPTCHA_SECRET_KEY;
    if (!secret) return true;
    const verification = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const captchaResult = await verification.json();
    return Boolean(captchaResult.success);
  } catch {
    return true;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (clientRegistrationLimiter) {
      const ip = getIpFromHeaders(req.headers);
      const rl = await clientRegistrationLimiter.limit(`clientreg:${ip}`);
      if (!rl.success) {
        return NextResponse.json(
          { error: "Trop de demandes, réessayez plus tard." },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }

    const payload = await req.json();
    const parsed = registrationSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password, recaptchaToken } = parsed.data;

    const captchaOk = await verifyRecaptcha(recaptchaToken);
    if (!captchaOk) {
      return NextResponse.json({ error: "reCAPTCHA invalide" }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Un compte avec cet email existe déjà." }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const activationToken = crypto.randomBytes(32).toString("hex");
    const activationTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 48);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.client,
        isActive: false,
        activationToken,
        activationTokenExpiresAt,
      },
    });

    const baseUrl =
      env.NEXTAUTH_URL ||
      env.DOMAIN ||
      process.env.NEXTAUTH_URL ||
      process.env.DOMAIN ||
      "http://localhost:3000";
    const activationUrl = `${baseUrl}/activate?token=${encodeURIComponent(activationToken)}`;

    await mailer.send({
      to: email,
      subject: `Activation de votre compte - ${name}`,
      text: `Bonjour ${name},

Merci de vous être inscrit sur Blue Cinis.

Veuillez activer votre compte en cliquant sur le lien ci-dessous :
${activationUrl}

Si vous n'avez pas initié cette inscription, veuillez ignorer cet email.

Cordialement,
L'équipe Blue Cinis`,
    });

    return NextResponse.json(
      {
        message: "Inscription réussie. Veuillez vérifier votre email pour activer votre compte.",
        user: { id: newUser.id },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
  }
}

