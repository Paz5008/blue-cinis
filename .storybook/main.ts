import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: [
    '../stories/**/*.stories.@(js|jsx|ts|tsx)'
  ],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions'
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {}
  },
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    // Mock Next.js modules that rely on a Next runtime during Storybook
    // Prevents runtime errors like ENOENT on .next/routes-manifest.json
    // when components import next/image or next/link in Storybook
    // (Vite builder does not run Next dev server).
    config.resolve.alias = [
      ...(config.resolve.alias || []),
      { find: 'next/image', replacement: path.resolve(__dirname, './mocks/NextImage.tsx') },
      { find: 'next/link', replacement: path.resolve(__dirname, './mocks/NextLink.tsx') },
    ]
    return config
  }
}
export default config
