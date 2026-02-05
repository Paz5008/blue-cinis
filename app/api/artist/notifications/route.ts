import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const frequencyEnum = z.enum(['instant', 'daily', 'weekly']);

const channelSchema = z.object({
  email: z.boolean(),
  sms: z.boolean(),
  frequency: frequencyEnum,
});

const preferencesSchema = z.object({
  sales: channelSchema,
  leads: channelSchema,
});

const defaultPreferences: z.infer<typeof preferencesSchema> = {
  sales: { email: true, sms: false, frequency: 'instant' },
  leads: { email: true, sms: false, frequency: 'daily' },
};

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: { notificationPreferences: true },
    });
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    let prefs = defaultPreferences;
    if (artist.notificationPreferences) {
      const parsed = preferencesSchema.safeParse(artist.notificationPreferences);
      if (parsed.success) {
        prefs = {
          sales: { ...defaultPreferences.sales, ...parsed.data.sales },
          leads: { ...defaultPreferences.leads, ...parsed.data.leads },
        };
      }
    }
    return NextResponse.json(prefs, { status: 200 });
  } catch (error) {
    console.error('GET /api/artist/notifications error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || session.user.role !== 'artist') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const artist = await prisma.artist.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!artist) {
      return NextResponse.json({ error: 'Artist not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = preferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.artist.update({
      where: { id: artist.id },
      data: { notificationPreferences: parsed.data },
      select: { notificationPreferences: true },
    });

    return NextResponse.json(updated.notificationPreferences || defaultPreferences, { status: 200 });
  } catch (error) {
    console.error('PUT /api/artist/notifications error', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
