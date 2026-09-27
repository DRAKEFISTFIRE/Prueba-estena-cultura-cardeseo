import "dotenv/config";
import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1),
  APP_BASE_URL: z.string().url(),

  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM: z.string().min(1),

  JWT_SECRET: z.string().min(32),
  CODE_PEPPER: z.string().min(16),
  WEBHOOK_SECRET: z.string().min(16)
});

export const env = schema.parse(process.env);