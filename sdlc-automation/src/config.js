import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Basic .env parser without external dependencies
function loadEnv() {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const idx = trimmed.indexOf('=');
        const key = trimmed.substring(0, idx).trim();
        const value = trimmed.substring(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = value.replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-pro',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20240620',
  mode: process.env.ASIE_MODE || 'auto',
  defaultOutputDir: process.env.ASIE_OUTPUT_DIR || path.join(rootDir, 'generated_specs'),
  verbose: process.env.ASIE_VERBOSE === 'true',
  qualityThreshold: parseInt(process.env.ASIE_QUALITY_THRESHOLD || '90', 10),
  linearApiKey: process.env.LINEAR_API_KEY || '',
  linearTeamId: process.env.LINEAR_TEAM_ID || '',
  jiraHost: process.env.JIRA_HOST || '',
  jiraEmail: process.env.JIRA_EMAIL || '',
  jiraApiToken: process.env.JIRA_API_TOKEN || '',
  jiraProjectKey: process.env.JIRA_PROJECT_KEY || 'DEV'
};
