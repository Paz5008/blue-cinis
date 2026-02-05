import { describe, it, expect } from 'vitest'

import { isAdmin } from '@/lib/authz'

describe('authz helpers', () => {
  it('treats classic admin role as admin', () => {
    expect(isAdmin({ role: 'admin', email: 'someone@example.com' })).toBe(true)
  })

  it('allows artist@example.com via override list', () => {
    expect(isAdmin({ role: 'artist', email: 'artist@example.com' })).toBe(true)
  })

  it('does not elevate arbitrary artists', () => {
    expect(isAdmin({ role: 'artist', email: 'other@example.com' })).toBe(false)
  })
})
