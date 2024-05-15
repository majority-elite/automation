import { Client } from '@notionhq/client';
import { z } from 'zod';

const notionEnvSchema = z.object({
  NOTION_TOKEN: z.string(),
});

const notionEnv = notionEnvSchema.parse({
  NOTION_TOKEN: process.env.NOTION_TOKEN,
});

export const notion = new Client({
  auth: notionEnv.NOTION_TOKEN,
});
