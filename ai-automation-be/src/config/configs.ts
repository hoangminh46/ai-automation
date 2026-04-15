import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
}));

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const supabaseConfig = registerAs('supabase', () => ({
  url: process.env.SUPABASE_URL,
  anonKey: process.env.SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
}));

// Dùng OpenAI SDK với Gemini endpoint (OpenAI-compatible API)
export const openaiConfig = registerAs('openai', () => ({
  apiKey: process.env.OPENAI_API_KEY,
  baseUrl:
    process.env.GEMINI_BASE_URL ||
    'https://generativelanguage.googleapis.com/v1beta/openai/',
  model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
}));

export const facebookConfig = registerAs('facebook', () => ({
  appId: process.env.FB_APP_ID,
  appSecret: process.env.FB_APP_SECRET,
  verifyToken: process.env.FB_VERIFY_TOKEN,
}));
