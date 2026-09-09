#!/usr/bin/env node
import readline from 'node:readline';
import path from 'node:path';
import { runSdlcInception } from './index.js';
import { config } from './config.js';

// Parse command line arguments
const args = process.argv.slice(2);
let ideaArg = '';
let outputArg = '';
let useLlmArg = undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--idea' && args[i + 1]) {
    ideaArg = args[++i];
  } else if (args[i] === '--output' && args[i + 1]) {
    outputArg = args[++i];
  } else if (args[i] === '--offline') {
    useLlmArg = false;
  } else if (args[i] === '--llm') {
    useLlmArg = true;
  } else if (!args[i].startsWith('--') && !ideaArg) {
    ideaArg = args[i];
  }
}

async function startInteractive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║        AUTONOMOUS SDLC INCEPTION ENGINE (ASIE) CLI         ║');
  console.log('║   Transform any software idea into an SDLC specification   ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const idea = await question('💡 Enter your software idea or system prompt:\n> ');
  if (!idea.trim()) {
    console.log('❌ Error: Idea prompt cannot be empty.');
    rl.close();
    process.exit(1);
  }

  const defaultOut = path.resolve('generated_specs');
  const outInput = await question(`\n📂 Enter output directory (default: ${defaultOut}):\n> `);
  const targetOutput = outInput.trim() ? path.resolve(outInput.trim()) : defaultOut;

  rl.close();

  try {
    await runSdlcInception(idea, { outputDir: targetOutput, useLlm: useLlmArg });
  } catch (err) {
    console.error('❌ Execution failed:', err);
    process.exit(1);
  }
}

if (ideaArg) {
  const targetOutput = outputArg ? path.resolve(outputArg) : config.defaultOutputDir;
  runSdlcInception(ideaArg, { outputDir: targetOutput, useLlm: useLlmArg })
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Execution failed:', err);
      process.exit(1);
    });
} else {
  startInteractive();
}
