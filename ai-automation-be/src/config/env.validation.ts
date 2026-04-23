import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3001),

  // Database (Supabase PostgreSQL)
  DATABASE_URL: Joi.string().required(),

  // Supabase
  SUPABASE_URL: Joi.string().uri().required(),
  SUPABASE_ANON_KEY: Joi.string().required(),
  SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),

  // AI Provider (Gemini via OpenAI-compatible API)
  OPENAI_API_KEY: Joi.string().required(),
  GEMINI_BASE_URL: Joi.string().uri().optional(),
  GEMINI_MODEL: Joi.string().optional(),

  // Facebook (Phase 09)
  FB_APP_ID: Joi.string().optional(),
  FB_APP_SECRET: Joi.string().optional(),
  FB_VERIFY_TOKEN: Joi.string().optional(),
  FB_PAGE_ACCESS_TOKEN: Joi.string().optional(),

  // Security
  ENCRYPTION_KEY: Joi.string().min(32).optional(),
});
