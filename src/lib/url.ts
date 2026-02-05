const DEFAULT_MAX_LENGTH = 1024;

export interface NormalizeCmsUrlOptions {
  allowRelative?: boolean;
  allowData?: boolean;
  allowMailto?: boolean;
  maxLength?: number;
}

const isAllowedDataScheme = (value: string): boolean =>
  /^data:image\/[a-z0-9.+-]+;base64,/i.test(value);

export const normalizeCmsUrl = (
  input: unknown,
  {
    allowRelative = true,
    allowData = true,
    allowMailto = true,
    maxLength = DEFAULT_MAX_LENGTH,
  }: NormalizeCmsUrlOptions = {},
): string | undefined => {
  if (typeof input !== 'string') return undefined;
  const trimmed = input.trim();
  if (!trimmed) return undefined;
  if (trimmed.length > maxLength) return undefined;

  const lower = trimmed.toLowerCase();

  if (lower.startsWith('https://')) return trimmed;

  if (lower.startsWith('http://')) {
    const rest = trimmed.slice(7);
    return rest ? `https://${rest}` : undefined;
  }

  if (allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('./'))) {
    return trimmed;
  }

  if (allowMailto && lower.startsWith('mailto:')) {
    return trimmed;
  }

  if (allowData && isAllowedDataScheme(lower)) {
    return trimmed;
  }

  if (lower.startsWith('//')) {
    const rest = trimmed.slice(2);
    return rest ? `https://${rest}` : undefined;
  }

  return undefined;
};

export const isValidCmsUrl = (
  input: unknown,
  options?: NormalizeCmsUrlOptions,
): boolean => normalizeCmsUrl(input, options) !== undefined;
