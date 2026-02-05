import { randomUUID } from 'crypto'
import type { Headers } from 'next/dist/compiled/@edge-runtime/primitives'

export function getRequestId(headers: Headers): string {
  const existing = headers.get('x-request-id') || headers.get('x-correlation-id')
  return existing || randomUUID()
}
