import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { mailer } from "@/lib/mailer";
import { env } from "@/env";
import { LeadStatus } from "@prisma/client";
import { leadsLimiter, getIpFromHeaders } from "@/lib/ratelimit";
import { createInMemorySlidingWindowLimiter } from "@/lib/localRateLimit";
import { verifyServerRecaptcha, isRecaptchaRequired } from "@/lib/serverRecaptcha";

const intakeSchema = z.object({
  type: z.enum(["client", "artist"]),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  portfolio: z.string().url().optional(),
  artStyle: z.string().optional(),
  message: z.string().optional(),
  recaptchaToken: z.string().optional(),
  manualHumanCheck: z.boolean().optional(),
});

function buildMessage(payload: z.infer<typeof intakeSchema>) {
  const lines: string[] = [
    `Source: ${payload.type}`,
    payload.portfolio ? `Portfolio: ${payload.portfolio}` : null,
    payload.artStyle ? `Style: ${payload.artStyle}` : null,
    payload.message ? `Message:\n${payload.message}` : null,
  ].filter(Boolean) as string[];
  return lines.join("\n");
}

const fallbackIpLimiter = createInMemorySlidingWindowLimiter({ max: 5, windowMs: 60_000 });
const fallbackEmailLimiter = createInMemorySlidingWindowLimiter({ max: 3, windowMs: 300_000 });

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = intakeSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const ip = getIpFromHeaders(req.headers);

    const ipIdentifier = `registration-intake:ip:${ip}`;
    const ipLimit = leadsLimiter
      ? await leadsLimiter.limit(ipIdentifier)
      : fallbackIpLimiter.limit(ipIdentifier);
    if (!ipLimit.success) {
      const retryAfter = Math.max(1, Math.ceil((ipLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Trop de demandes, réessayez plus tard." },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    const emailIdentifier = `registration-intake:email:${data.email.toLowerCase()}`;
    const emailLimit = leadsLimiter
      ? await leadsLimiter.limit(emailIdentifier)
      : fallbackEmailLimiter.limit(emailIdentifier);
    if (!emailLimit.success) {
      const retryAfter = Math.max(1, Math.ceil((emailLimit.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Trop de demandes pour cet email, réessayez plus tard." },
        { status: 429, headers: { "Retry-After": retryAfter.toString() } },
      );
    }

    const manualBypass = env.NODE_ENV !== "production" && Boolean(data.manualHumanCheck);
    if (isRecaptchaRequired() && !data.recaptchaToken && !manualBypass) {
      return NextResponse.json({ error: "reCAPTCHA requis" }, { status: 400 });
    }
    const captchaOk = manualBypass
      ? true
      : await verifyServerRecaptcha({
        token: data.recaptchaToken,
        manualBypass,
        scope: "api.registration-intake",
      });
    if (!captchaOk) {
      return NextResponse.json({ error: "reCAPTCHA invalide" }, { status: 400 });
    }

    const leadMessage = buildMessage(data);

    const duplicateRecentThreshold = new Date(Date.now() - 15 * 60 * 1000);
    const duplicateLead = await prisma.lead.findFirst({
      where: {
        email: data.email,
        createdAt: { gte: duplicateRecentThreshold },
        message: leadMessage,
      },
    });
    if (duplicateLead) {
      return NextResponse.json({ ok: true, duplicate: true }, { status: 202 });
    }

    await prisma.lead.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        message: leadMessage,
        status: LeadStatus.new,
      },
    });

    const notifyEmail = env.SALES_EMAIL;
    if (notifyEmail && mailer.isConfigured()) {
      await mailer.send({
        to: notifyEmail,
        subject: `[Blue Cinis] Nouvelle demande ${data.type === "artist" ? "artiste" : "client"}`,
        text: `Nom: ${data.name}\nEmail: ${data.email}\nTéléphone: ${data.phone || "non fourni"}\n${leadMessage}`,
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("registration-intake", error);
    return NextResponse.json({ error: "registration_intake_failed" }, { status: 500 });
  }
}
