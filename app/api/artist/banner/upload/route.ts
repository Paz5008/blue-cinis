import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

export async function POST(request: Request) {
    const session = await auth();

    if (!session || session.user.role !== 'artist') {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return new NextResponse('No file provided', { status: 400 });
        }

        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return new NextResponse('Invalid file type. Only JPEG, PNG, and WebP are allowed.', {
                status: 400,
            });
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return new NextResponse('File too large. Maximum size is 5MB.', { status: 400 });
        }

        // Generate unique filename
        const extension = file.name.split('.').pop() || 'jpg';
        const filename = `${randomUUID()}.${extension}`;

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Save file to public/uploads/banners
        const uploadDir = join(process.cwd(), 'public', 'uploads', 'banners');
        const filepath = join(uploadDir, filename);

        await writeFile(filepath, buffer);

        // Return public URL
        const publicUrl = `/uploads/banners/${filename}`;

        return NextResponse.json({ url: publicUrl });
    } catch (error) {
        console.error('[BANNER_UPLOAD]', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
