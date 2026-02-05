export function maskEmail(email?: string | null) {
  if (!email) return null
  const [local, domain] = email.split('@')
  if (!domain) return '***'
  if (local.length <= 2) {
    const prefix = local[0] ?? '*'
    return `${prefix}***@${domain}`
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

export function maskName(name?: string | null) {
  if (!name) return null
  const trimmed = name.trim()
  if (!trimmed) return null
  if (trimmed.length <= 2) return `${trimmed[0] ?? '*'}***`
  return `${trimmed[0]}***${trimmed[trimmed.length - 1]}`
}

export function maskPhone(phone?: string | null) {
  if (!phone) return null
  const digits = (phone.match(/\d/g) || []).length
  const toMask = Math.max(0, digits - 2)
  let maskedDigits = 0
  return phone.replace(/\d/g, (digit) => {
    maskedDigits += 1
    return maskedDigits <= toMask ? '*' : digit
  })
}

export function redactLongText(message?: string | null, limit = 240) {
  if (!message) return null
  if (message.length <= limit) return message
  return `${message.slice(0, Math.max(0, limit - 3))}...`
}
