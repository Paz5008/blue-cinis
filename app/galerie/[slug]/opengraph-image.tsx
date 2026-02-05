import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const artwork = await prisma.artwork.findUnique({ where: { id: params.id } });
  const title = artwork?.title || 'Œuvre';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: 'white',
          fontSize: 64,
          fontWeight: 700,
          padding: 40,
        }}
      >
        {title}
      </div>
    ),
    { ...size }
  );
}
