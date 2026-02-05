export const runtime = 'nodejs'
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { uploadsLimiter, getIpFromHeaders } from '@/lib/ratelimit';
import { uploadImageFile, getCloudinaryConfig } from '@/lib/uploads'
import path from 'path';
import fs from 'fs/promises';
import { env } from '@/env'
const AUTHENTICATED = env.CLOUDINARY_AUTHENTICATED === 'true'

import { prisma } from '@/lib/prisma';


/**
 * POST /api/uploads
 * Upload d'un fichier image et création d'une entrée MediaLibrary.
 */
export async function POST(request: NextRequest) {
  try {
    if (uploadsLimiter) {
      const ip = getIpFromHeaders(request.headers);
      const rl = await uploadsLimiter.limit(`uploads:${ip}`);
      if (!rl.success) {
        return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: { 'Retry-After': '60' } });
      }
    }
    const session = await auth();
    if (!session || session.user.role !== 'artist' || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    /* centralized in uploadImageFile: size and mime checks */

    try {
      const out = await uploadImageFile(file)

      // Coherence: Create MediaLibrary entry
      let mediaEntry;
      try {
        mediaEntry = await prisma.mediaLibrary.create({
          data: {
            userId: session.user.id,
            fileUrl: out.url,
            fileType: out.mimeType || file.type,
            width: out.width,
            height: out.height,
            sizeKb: out.sizeKb,
            altText: file.name
          }
        });
      } catch (dbErr: any) {
        console.error('Failed to create MediaLibrary record:', dbErr);
        await fs.writeFile('upload_debug.log', `DB Error: ${dbErr?.message}\n`, { flag: 'a' }).catch(() => { });
        // We don't block the upload if DB fails, but we should probably warn or return just the URL?
        // Optimally, we want the ID.
      }

      return NextResponse.json({
        ...out,
        id: mediaEntry?.id // Return ID for frontend to associate
      }, { status: 201 })

    } catch (e: any) {
      if (e?.message === 'too_large') return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 })
      if (e?.message === 'invalid_type') return NextResponse.json({ error: 'Invalid file type. Allowed: png, jpg, jpeg, webp, gif' }, { status: 400 })
      if (e?.message === 'cloudinary_required') {
        return NextResponse.json({ error: 'Cloud storage unavailable' }, { status: 503 })
      }
      // Re-throw to main catcher for logging
      throw e;
    }

  } catch (error: any) {
    console.error('Upload error:', error);
    await fs.writeFile('upload_debug.log', `Route Error: ${error?.message || error}\n`, { flag: 'a' }).catch(() => { });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

/**
 * GET /api/uploads
 * Liste des médias (Cloudinary si dispo, sinon /public/uploads)
 */
export async function GET(_request: NextRequest) {
  const session = await auth();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Coherence: Only artist (or admin?) sees their own files? 
  // Requirement: "uniquement celle de mon compte"
  const role = session.user.role;
  if (role !== 'artist' && role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const userId = session.user.id;

    // Fetch from Database for strict isolation
    const dbMedia = await prisma.mediaLibrary.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100
    });

    const media = dbMedia.map(m => ({
      id: m.id,
      name: m.altText || m.fileUrl.substring(m.fileUrl.lastIndexOf('/') + 1),
      url: m.fileUrl,
      width: m.width,
      height: m.height
    }));

    return NextResponse.json({ media }, { status: 200 });

  } catch (error) {
    console.error('Liste des uploads error:', error);
    return NextResponse.json({ media: [] }, { status: 200 }); // Return empty on error to avoid breaking UI
  }
}
