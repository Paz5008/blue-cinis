import type { Meta, StoryObj } from '@storybook/react'
import EventCard from '@/components/features/gallery/EventCard';

const formatDate = (d: Date | string) => {
  const dd = typeof d === 'string' ? new Date(d) : d
  return dd.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const meta = {
  title: 'Cards/EventCard',
  component: EventCard,
  parameters: { layout: 'padded' },
  args: {
    event: { id: 'e1', title: "Vernissage d'été", image: '/event.webp', date: new Date(), location: 'Nantes' },
    formatDate,
  }
} satisfies Meta<typeof EventCard>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const NoImage: Story = { args: { event: { id: 'e2', title: 'Lecture publique', date: new Date(), location: 'Angers' } } }


export const Grid: Story = {
  render: (args: any) => (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <EventCard {...args} />
      <EventCard {...args} event={{ ...(args as any).event, title: 'Un évènement au titre exceptionnellement long pour tester le line-clamp' }} />
      <EventCard {...args} event={{ ...(args as any).event, image: undefined }} />
      <EventCard {...args} event={{ ...(args as any).event, location: 'Angers' }} />
      <EventCard {...args} event={{ ...(args as any).event, location: 'Tours' }} />
      <EventCard {...args} event={{ ...(args as any).event, location: 'Saumur' }} />
    </div>
  )
}
