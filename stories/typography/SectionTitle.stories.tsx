import type { Meta, StoryObj } from '@storybook/react'
import { SectionTitle } from '../../components/typography'

const meta = {
  title: 'Typography/SectionTitle',
  component: SectionTitle,
  parameters: { layout: 'centered' },
  args: { children: 'Titre de section – Blue Cinis' },
} satisfies Meta<typeof SectionTitle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AsH1: Story = { args: { as: 'h1' } }
export const CustomClass: Story = { args: { className: 'text-center' } }
