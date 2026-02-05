import * as Sentry from '@sentry/nextjs';

if (process.env.SENTRY_DSN) {
  const integrations = [
    Sentry.captureConsoleIntegration({ levels: ['error'] }),
  ];

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    integrations,
    beforeSend(event) {
      const scrub = (obj: any) => {
        if (!obj || typeof obj !== 'object') return obj
        for (const k of Object.keys(obj)) {
          const lk = k.toLowerCase()
          if (['email','buyeremail','password','pass','phone','buyerphone'].includes(lk)) {
            obj[k] = '[redacted]'
          } else if (obj[k] && typeof obj[k] === 'object') {
            scrub(obj[k])
          }
        }
        return obj
      }
      try {
        if (event.request && (event.request as any).headers) scrub((event.request as any).headers)
        if (event.user) scrub(event.user as any)
        if (event.extra) scrub(event.extra as any)
        if (event.contexts) scrub(event.contexts as any)
      } catch {}
      return event
    },
  });
}
