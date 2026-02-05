import pino from 'pino'

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

export const logger = pino({
  level,
  redact: {
    paths: [
      'req.headers.authorization',
      'body.password',
      'body.pass',
      'body.token',
      'email',
      'buyerEmail',
      'phone',
      'buyerPhone',
    ],
    remove: true,
  },
  base: undefined,
})

// Child loggers per module for structured logging
export const apiLogger = logger.child({ module: 'api' })
export const cmsLogger = logger.child({ module: 'cms' })
export const editorLogger = logger.child({ module: 'editor' })
export const actionsLogger = logger.child({ module: 'actions' })
export const paymentsLogger = logger.child({ module: 'payments' })
export const dataLogger = logger.child({ module: 'data' })
