import type { Meta, StoryObj } from '@storybook/react'
import ArtworkCard from '@/components/features/gallery/ArtworkCard';

const meta = {
  title: 'Cards/ArtworkCard',
  component: ArtworkCard,
  parameters: { layout: 'padded' },
  args: {
    artwork: {
      id: '1',
      title: "Paysage ligérien",
      imageUrl: '/gallery.webp',
      price: 1800,
      artistId: 'a1',
      artistName: 'Aurore Martin',
      dimensions: '80 x 60 cm',
      year: '2024',
      isAvailable: true,
      artistHasStripe: true,
      artistEnableCommerce: true,
    },
    showDescription: true,
  }
} satisfies Meta<typeof ArtworkCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const WithoutPrice: Story = { args: { showPrice: false } }
export const SoldOut: Story = { args: { artwork: { ...(meta.args as any).artwork, isAvailable: false } } }


export const Grid: Story = {
  render: (args: any) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <ArtworkCard {...args} />
      <ArtworkCard {...args} artwork={{ ...(args as any).artwork, title: `Titre d'œuvre très très long pour tester le line-clamp sur deux lignes, avec des détails supplémentaires` }} />
      <ArtworkCard {...args} artwork={{ ...(args as any).artwork, isAvailable: false }} />
      <ArtworkCard {...args} artwork={{ ...(args as any).artwork, artistHasStripe: false }} />
      <ArtworkCard {...args} showPrice={false} />
      <ArtworkCard {...args} showDescription={false} />
    </div>
  )
}
