# SDLC Automation 04: Tooling & Ecosystem Integration Guide

## Executive Summary
This document specifies the tooling infrastructure and integration hooks required to connect the **Autonomous SDLC Inception Engine (ASIE)** with modern engineering ecosystems, including:
1. **Automated CLI Runner** (`asie` execution runtime)
2. **Headless Diagram Compilation** (Mermaid CLI $\to$ SVG/PNG)
3. **Project Management Sync** (Automated Jira & Linear Backlog Generation)
4. **Git Repository & Documentation Automation** (GitHub Actions / Markdown Publishing)
5. **PlanCraft Studio Interoperability** (Instant JSON Blueprint Hydration)

---

## 1. CLI Automation Architecture (`asie-cli`)

The pipeline can be executed as an automated Node.js or Python CLI command:

```bash
# Run full automated SDLC inception from a prompt string
npx asie-planner --prompt "Build a peer-to-peer EV charging station rental platform" --output ./docs/sdlc

# Or run from an existing idea brief file
npx asie-planner --file ./product_idea.txt --export-jira --export-plancraft
```

### Reference Node.js Orchestrator Pipeline (`orchestrator.js`)
```javascript
import { OpenAI } from 'openai';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function runStage(agentName, systemPrompt, userContext, responseFormat) {
  console.log(`🚀 Invoking ${agentName}...`);
  const response = await openai.chat.completions.create({
    model: 'gpt-4o', // or gemini-1.5-pro / claude-3-5-sonnet
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: JSON.stringify(userContext) }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
}

export async function executeInceptionPipeline(rawIdeaPrompt, outputDir) {
  // Stage 1: Domain Ontology
  const ontology = await runStage('Domain Discovery Agent', ONTOLOGY_PROMPT, { raw_idea: rawIdeaPrompt });

  // Stage 2: Multi-Tier Layered Architecture
  const architecture = await runStage('Enterprise Architect Agent', ARCHITECTURE_PROMPT, { ontology });

  // Stage 3: Data Engineering & ERD
  const erd = await runStage('Data Engineer Agent', ERD_PROMPT, { ontology, architecture });

  // Stage 4: Behavioral & Structural Flows
  const diagrams = await runStage('Flow Modeler Agent', FLOWS_PROMPT, { architecture, erd });

  // Stage 5: Agile User Stories & Story Points
  const backlog = await runStage('Agile Scrum Master', STORIES_PROMPT, { architecture, diagrams });

  // Stage 6: Strategic Roadmap & Tech Debt
  const roadmap = await runStage('DevOps Strategist', ROADMAP_PROMPT, { architecture, diagrams });

  // Compile Unified Blueprint
  const blueprint = {
    id: ontology.project_id || 'system_plan',
    name: ontology.project_name || 'Automated System Plan',
    version: '1.0.0',
    description: ontology.description,
    targetStack: architecture.target_stack,
    architecture,
    erd,
    diagrams,
    stories: backlog.stories,
    roadmap: roadmap.horizons
  };

  // Persist PlanCraft JSON for Web App
  await fs.ensureDir(outputDir);
  await fs.writeJson(path.join(outputDir, 'project_blueprint.json'), blueprint, { spaces: 2 });

  // Compile Master Markdown Document
  const markdownSpec = compileToMarkdown(blueprint);
  await fs.writeFile(path.join(outputDir, 'SDLC_PLANNING_SPECIFICATION.md'), markdownSpec);

  console.log(`✅ Inception Complete! Artifacts written to: ${outputDir}`);
  return blueprint;
}
```

---

## 2. Headless Mermaid Diagram Compilation (SVG/PNG)

To generate standalone image assets for corporate wiki publishing, the engine incorporates `@mermaid-js/mermaid-cli` (`mmdc`):

```bash
# Install Mermaid CLI globally or in CI
npm install -g @mermaid-js/mermaid-cli

# Automatically compile generated Mermaid ERD to high-resolution SVG
mmdc -i ./docs/sdlc/erd.mmd -o ./docs/sdlc/assets/erd_diagram.svg -t dark -b transparent

# Compile Sequence diagram to PNG
mmdc -i ./docs/sdlc/sequence_auth.mmd -o ./docs/sdlc/assets/auth_sequence.png -w 2048
```

---

## 3. Jira & Linear Automated Backlog Sync

Rather than requiring manual card creation, the engine syncs generated User Stories, Story Points, and Gherkin Acceptance Criteria directly to issue tracking systems:

### Linear GraphQL Sync Example
```javascript
async function syncStoryToLinear(story, teamId) {
  const query = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id title url }
      }
    }
  `;

  const variables = {
    input: {
      teamId,
      title: `[${story.id}] ${story.title}`,
      description: `### User Story Statement\n${story.statement}\n\n### Acceptance Criteria (Gherkin)\n\`\`\`gherkin\n${story.acceptance_criteria.join('\n\n')}\n\`\`\``,
      estimate: story.points, // Fibonacci score
      priority: story.priority === 'Must' ? 1 : story.priority === 'Should' ? 2 : 3
    }
  };

  const res = await fetch('https://api.linear.app/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': process.env.LINEAR_API_KEY
    },
    body: JSON.stringify({ query, variables })
  });

  return res.json();
}
```

---

## 4. GitHub Actions CI/CD Inception Workflow

Engineers can trigger automated SDLC planning simply by creating a GitHub Issue tagged with `sdlc:inception`:

```yaml
name: Automated SDLC Inception Engine

on:
  issues:
    types: [opened, labeled]

jobs:
  plan-system:
    if: contains(github.event.issue.labels.*.name, 'sdlc:inception')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Autonomous SDLC Inception
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          npx asie-planner \
            --prompt "${{ github.event.issue.body }}" \
            --output ./docs/planning/${{ github.event.issue.number }}

      - name: Commit Generated SDLC Artifacts
        run: |
          git config --global user.name "ASIE-Bot"
          git config --global user.email "bot@antigravity.internal"
          git add ./docs/planning/
          git commit -m "docs(sdlc): auto-generate inception specification for issue #${{ github.event.issue.number }}"
          git push

      - name: Comment Plan Link on Issue
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '### 📐 SDLC Planning Specification Generated!\n\nView the complete architectural specification in [SDLC_PLANNING_SPECIFICATION.md](./docs/planning/' + context.issue.number + '/SDLC_PLANNING_SPECIFICATION.md).'
            });
```
