export interface EnvConfig {
  DATABASE_URL: string
  JWT_SECRET: string
  JWT_EXPIRES_IN: string
  PORT: number
  API_URL: string
  CORS_ORIGINS: string[]
  NODE_ENV: 'development' | 'production' | 'test'
  LOG_LEVEL?: string
  SENTRY_DSN?: string
}

export function getEnvConfig(): EnvConfig {
  return {
    DATABASE_URL: process.env.DATABASE_URL || '',
    JWT_SECRET: process.env.JWT_SECRET || '',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
    PORT: Number(process.env.PORT) || 3000,
    API_URL: process.env.API_URL || 'http://localhost:3000',
    CORS_ORIGINS: (process.env.CORS_ORIGINS || '').split(',').map(o => o.trim()).filter(Boolean),
    NODE_ENV: (process.env.NODE_ENV as EnvConfig['NODE_ENV']) || 'development',
    LOG_LEVEL: process.env.LOG_LEVEL || 'debug',
    SENTRY_DSN: process.env.SENTRY_DSN,
  }
}
