import * as Sentry from '@sentry/nextjs';

if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  const enableReplay = (process.env.NEXT_PUBLIC_SENTRY_ENABLE_REPLAY || '').toLowerCase() === 'true';
  const integrations = [
    Sentry.browserTracingIntegration(),
    ...(enableReplay ? [Sentry.replayIntegration()] : []),
  ];

  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE || process.env.NEXT_PUBLIC_APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA,
    tracesSampleRate: Number(process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE || 0.1),
    replaysOnErrorSampleRate: enableReplay
      ? Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE || 0.1)
      : 0,
    replaysSessionSampleRate: enableReplay
      ? Number(process.env.NEXT_PUBLIC_SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0.0)
      : 0,
    integrations,
  });
}
