'use client';
/*
  Lightweight editor sandbox page used by E2E to validate the Editor UX without auth.
  It renders the Editor with mocked artist and artworks data so Playwright can
  interact with the UI (palette, canvas, publish guard, theme switch, etc.).
  This page is not linked anywhere and is safe to keep in production; it does not
  persist anything by itself. Network calls (PUT /api/artist/customization/[key], etc.)
  are intercepted in E2E tests.
*/
import Editor from '../../../components/dashboard/EditorLazy';

export default function EditorSandboxPage() {
  const initialContent = { blocks: [], theme: {}, meta: {} }
  const oeuvreOptions = [
    { id: 'a1', title: 'Oeuvre A', imageUrl: '', price: 100 },
    { id: 'a2', title: 'Oeuvre B', imageUrl: '', price: 200 },
    { id: 'a3', title: 'Oeuvre C', imageUrl: '', price: 300 },
  ]
  const artistData = {
    id: 'sandbox-artist',
    slug: 'sandbox-artist',
    name: 'Artiste Test',
    photoUrl: '',
    biography: 'Bio test',
    artworks: oeuvreOptions.map(({ id, title, imageUrl }) => ({ id, title, imageUrl })),
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="px-4 py-2 border-b bg-white">
        <h1 className="text-base font-semibold">Sandbox Éditeur</h1>
      </div>
      <div className="flex-1 min-h-0 overflow-auto bg-white">
        <Editor
          initialContent={initialContent as any}
          oeuvreOptions={oeuvreOptions as any}
          artistData={artistData as any}
          previewUrl={undefined}
          initialPublicationStatus={'draft'}
          pageKey={'profile'}
          artistHasStripe={false}
        />
      </div>
    </div>
  )
}
