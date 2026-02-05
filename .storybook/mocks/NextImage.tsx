import * as React from 'react'

// Simple mock for next/image in Storybook (Vite builder)
// Renders a native <img> with passed props
// Handles both string and imported image modules (src.src)
const NextImage = ({ src, alt = '', ...props }: any) => {
  const resolved = typeof src === 'string' ? src : (src?.src || '')
  return <img src={resolved} alt={alt} {...props} />
}
export default NextImage
