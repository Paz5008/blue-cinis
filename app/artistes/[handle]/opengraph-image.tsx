import { ImageResponse } from 'next/og';
import { prisma } from '@/lib/prisma';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: { id: string } }) {
  const artist = await prisma.artist.findUnique({ where: { id: params.id } });
  const name = artist?.name || 'Artiste';
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111827',
          color: 'white',
          fontSize: 64,
          fontWeight: 700,
          padding: 40,
        }}
      >
        {name}
      </div>
    ),
    { ...size }
  );
}
