// Autonomous SDLC Inception Engine - Main Pipeline Orchestrator

import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';
import { HeuristicProvider } from './providers/heuristicProvider.js';
import { LlmProvider } from './providers/llmProvider.js';

import { runStage1 } from './engine/stage1_ontology.js';
import { runStage2 } from './engine/stage2_architecture.js';
import { runStage3 } from './engine/stage3_erd.js';
import { runStage4 } from './engine/stage4_flows.js';
import { runStage5 } from './engine/stage5_stories.js';
import { runStage6 } from './engine/stage6_roadmap.js';
import { auditPlanningState } from './engine/critic_validator.js';
import { compilePlanCraftJson, compileMasterMarkdown } from './engine/compiler.js';

export async function runSdlcInception(prompt, options = {}) {
  const outputDir = options.outputDir || config.defaultOutputDir;
  const useLlm = options.useLlm !== undefined ? options.useLlm : config.mode !== 'offline_only';

  const heuristic = new HeuristicProvider();
  const llm = new LlmProvider(config);

  const isLlmActive = useLlm && llm.hasValidKey();
  const engineLabel = isLlmActive ? `LLM Mode (${config.openaiApiKey ? 'OpenAI ' + config.openaiModel : config.geminiApiKey ? 'Gemini ' + config.geminiModel : 'Anthropic'})` : 'Offline Heuristic Mode (Zero API Key)';

  console.log('\n================================================================');
  console.log('🚀 AUTONOMOUS SDLC INCEPTION ENGINE (ASIE)');
  console.log(`🔧 Engine: ${engineLabel}`);
  console.log(`📂 Target Output: ${outputDir}`);
  console.log('================================================================\n');

  console.log('⏳ [1/6] Stage 1: Domain Discovery & Ontology Synthesis...');
  const ontology = await runStage1(prompt, llm, heuristic, isLlmActive);

  console.log(`✅ [1/6] Project Identified: "${ontology.project_name}" (${ontology.actors.length} actors mapped)`);

  console.log('⏳ [2/6] Stage 2: Multi-Tier Layered Architecture Design...');
  const architecture = await runStage2(ontology, llm, isLlmActive);
  console.log(`✅ [2/6] Architecture Formulated (${architecture.business_layer.length} business rules, ${architecture.functional_layer.length} REST endpoints)`);

  console.log('⏳ [3/6] Stage 3: Data Modeling & Crow\'s Foot Mermaid ERD...');
  const erd = await runStage3(ontology, architecture, llm, isLlmActive);
  console.log(`✅ [3/6] Data Dictionary & ERD Compiled (${erd.entities.length} entities)`);

  console.log('⏳ [4/6] Stage 4: Behavioral Flows & Structural UML Synthesis...');
  const diagrams = await runStage4(ontology, architecture, erd, llm, isLlmActive);
  console.log('✅ [4/6] UML Diagrams Synthesized (DFD Level 0/1, Class, Sequence)');

  console.log('⏳ [5/6] Stage 5: Agile User Stories & Fibonacci Sizing...');
  const stories = await runStage5(ontology, architecture, erd, diagrams, llm, isLlmActive);
  const totalPoints = stories.stories.reduce((acc, s) => acc + (s.points || 0), 0);
  console.log(`✅ [5/6] Backlog Generated (${stories.stories.length} stories, ${totalPoints} total story points)`);

  console.log('⏳ [6/6] Stage 6: Strategic Roadmap & Technical Debt Forecasting...');
  const roadmap = await runStage6(ontology, architecture, stories, llm, isLlmActive);
  console.log(`✅ [6/6] Roadmap Horizons Established (${roadmap.roadmap.length} initiatives)`);

  // Critic Quality Gate
  console.log('🔍 Running Stage 7: Quality Gate & Consistency Critic Audit...');
  const auditState = {
    ontology,
    architecture,
    erd,
    diagrams,
    stories: stories.stories,
    roadmap: roadmap.roadmap
  };
  const auditReport = auditPlanningState(auditState);
  console.log(`⭐ Audit Score: ${auditReport.quality_score}/100 [${auditReport.approved ? 'PASSED' : 'FLAGGED'}]`);

  // Compile Deliverables
  const planCraftJson = compilePlanCraftJson(ontology, architecture, erd, diagrams, stories, roadmap);
  const masterMarkdown = compileMasterMarkdown(planCraftJson, auditReport);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const jsonPath = path.join(outputDir, `${planCraftJson.id}_blueprint.json`);
  const mdPath = path.join(outputDir, `${planCraftJson.id}_SDLC_SPECIFICATION.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(planCraftJson, null, 2), 'utf8');
  fs.writeFileSync(mdPath, masterMarkdown, 'utf8');

  console.log('\n================================================================');
  console.log('🎉 INCEPTION COMPLETE! Specification Deliverables Created:');
  console.log(`📄 Markdown Spec: ${mdPath}`);
  console.log(`📦 PlanCraft JSON: ${jsonPath}`);
  console.log('================================================================\n');

  return {
    blueprint: planCraftJson,
    markdown: masterMarkdown,
    audit: auditReport,
    files: { jsonPath, mdPath }
  };
}
