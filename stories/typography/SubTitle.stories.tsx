import type { Meta, StoryObj } from '@storybook/react'
import { SubTitle } from '../../components/typography'

const meta = {
  title: 'Typography/SubTitle',
  component: SubTitle,
  parameters: { layout: 'centered' },
  args: { children: 'Sous-titre de section' },
} satisfies Meta<typeof SubTitle>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}
export const AsH4: Story = { args: { as: 'h4' } }
