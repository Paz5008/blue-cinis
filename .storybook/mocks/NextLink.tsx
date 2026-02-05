import * as React from 'react'

// Simple mock for next/link in Storybook
const Link = ({ href, children, ...rest }: any) => {
  return <a href={href as string} {...rest}>{children}</a>
}
export default Link
