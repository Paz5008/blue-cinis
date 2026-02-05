import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { mailer } from "@/lib/mailer";
import { env } from "@/env";
import { artistRegistrationLimiter, getIpFromHeaders } from "@/lib/ratelimit";
import { parseArtistRegistrationFormData } from "@/lib/registration/artist";
import { logger } from "@/lib/logger";

async function verifyRecaptcha(token: string) {
  const secret = env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    logger.error({ surface: "api.artist-registration" }, "Missing reCAPTCHA secret");
    return false;
  }
  if (!token) {
    return false;
  }

  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = await res.json();
    return Boolean(data.success);
  } catch (error) {
    logger.error({ surface: "api.artist-registration", err: error }, "reCAPTCHA verification failed");
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    if (artistRegistrationLimiter) {
      const ip = getIpFromHeaders(req.headers);
      const rl = await artistRegistrationLimiter.limit(`artistreg:${ip}`);
      if (!rl.success) {
        return NextResponse.json(
          { error: "Trop de demandes, réessayez plus tard." },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }

    const formData = await req.formData();
    const parsed = parseArtistRegistrationFormData(formData);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { name, email, password, phone, portfolio, artStyle, message, recaptchaToken } = parsed.data;

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
        role: Role.artist,
        isActive: false,
        activationToken,
        activationTokenExpiresAt,
      },
    });

    const newArtist = await prisma.artist.create({
      data: {
        name,
        phone: phone ?? null,
        portfolio: portfolio ?? null,
        artStyle,
        biography: message,
        userId: newUser.id,
      },
    });

    const baseUrl =
      env.NEXTAUTH_URL ||
      env.DOMAIN ||
      process.env.NEXTAUTH_URL ||
      process.env.DOMAIN ||
      "http://localhost:3000";
    const activationUrl = `${baseUrl}/activate?token=${encodeURIComponent(activationToken)}`;
    const adminEmail = env.SALES_EMAIL || env.SMTP_USER || "";

    if (adminEmail) {
      await mailer.send({
        to: adminEmail,
        subject: `Nouvelle demande d'inscription artiste - ${name}`,
        html: `
          <p>Une nouvelle demande d'inscription artiste a été soumise.</p>
          <ul>
            <li><strong>Nom :</strong> ${name}</li>
            <li><strong>Email :</strong> ${email}</li>
            <li><strong>Style artistique :</strong> ${artStyle}</li>
            ${portfolio ? `<li><strong>Portfolio :</strong> ${portfolio}</li>` : ""}
            ${phone ? `<li><strong>Téléphone :</strong> ${phone}</li>` : ""}
          </ul>
          ${message ? `<p><strong>Message :</strong><br/>${message}</p>` : ""}
        `,
      });
    }

    await mailer.send({
      to: email,
      subject: "Activation de votre compte artiste",
      text: `Bonjour ${name},

Votre demande d'inscription en tant qu'artiste sur Blue Cinis a été reçue.
Veuillez activer votre compte en cliquant sur le lien ci-dessous (valable 48h) :
${activationUrl}

Nous reviendrons vers vous sous 48h après vérification de votre éligibilité.

Cordialement,
L'équipe Blue Cinis`,
    });

    return NextResponse.json(
      {
        message: "Inscription réussie. Un email de confirmation vous a été envoyé.",
        user: { id: newUser.id },
        artist: { id: newArtist.id },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Erreur lors de l'inscription artiste:", error);
    return NextResponse.json({ error: "Erreur lors de la création du compte" }, { status: 500 });
  }
}
