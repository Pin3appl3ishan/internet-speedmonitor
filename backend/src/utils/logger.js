import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
});

export { logger };

// Example usage:
// logger.info('Info message');
// logger.error('Error message', { error: err });
// logger.debug('Debug message', { data: someData });
