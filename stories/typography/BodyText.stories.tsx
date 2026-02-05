import type { Meta, StoryObj } from '@storybook/react'
import { BodyText } from '../../components/typography'

const meta = {
  title: 'Typography/BodyText',
  component: BodyText,
  parameters: { layout: 'centered' },
  args: { children: 'Texte de paragraphe standard. Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
} satisfies Meta<typeof BodyText>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AsSpan: Story = { args: { as: 'span' } }
export const Muted: Story = { args: { className: 'text-body-subtle' } }
