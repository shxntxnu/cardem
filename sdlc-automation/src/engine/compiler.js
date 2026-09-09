// Artifact Compiler: Synthesizes PlanCraft JSON and Master Markdown Specification

export function compilePlanCraftJson(ontology, architecture, erd, diagrams, stories, roadmap) {
  return {
    id: ontology.project_id || 'system_plan',
    name: ontology.project_name || 'System Architecture Plan',
    version: ontology.version || '1.0.0',
    description: ontology.description || '',
    targetStack: architecture.target_stack || {},
    architecture: {
      businessLayer: architecture.business_layer || [],
      dataLayer: architecture.data_layer || [],
      functionalLayer: architecture.functional_layer || []
    },
    erd: {
      entities: erd.entities || [],
      mermaidSyntax: erd.mermaidSyntax || 'erDiagram'
    },
    diagrams: {
      dfdLevel0: diagrams.dfdLevel0 || '',
      dfdLevel1: diagrams.dfdLevel1 || '',
      classDiagram: diagrams.classDiagram || '',
      sequenceAuth: diagrams.sequenceAuth || ''
    },
    stories: stories.stories || [],
    roadmap: roadmap.roadmap || []
  };
}

export function compileMasterMarkdown(blueprint, auditReport) {
  const dateStr = new Date().toISOString().split('T')[0];
  let md = `# ${blueprint.name} - SDLC Architecture & Planning Specification\n\n`;
  md += `> **SDLC Stage**: Inception & Architectural Synthesis  \n`;
  md += `> **Version**: ${blueprint.version}  \n`;
  md += `> **Generated Date**: ${dateStr}  \n`;
  md += `> **Quality Score**: ${auditReport.quality_score}/100 (${auditReport.approved ? 'APPROVED' : 'ACTION REQUIRED'})  \n\n`;
  md += `---\n\n`;

  // 1. Executive Summary & Scope
  md += `## 1. Executive Summary & Target Technology Stack\n\n`;
  md += `${blueprint.description}\n\n`;
  if (blueprint.targetStack) {
    md += `| Tier | Technology Components |\n| :--- | :--- |\n`;
    md += `| **Frontend** | ${blueprint.targetStack.frontend || 'N/A'} |\n`;
    md += `| **Backend** | ${blueprint.targetStack.backend || 'N/A'} |\n`;
    md += `| **Database** | ${blueprint.targetStack.database || 'N/A'} |\n`;
    md += `| **External / Cloud** | ${blueprint.targetStack.external || 'N/A'} |\n\n`;
  }

  // 2. Layered Architecture
  md += `## 2. Multi-Tier Layered Architecture Design\n\n`;
  md += `### 2.1 Business Layer Policies & Invariants\n\n`;
  (blueprint.architecture?.businessLayer || []).forEach(b => {
    md += `- **${b.title}**: ${b.desc}\n`;
  });

  md += `\n### 2.2 Data Layer Specifications\n\n`;
  md += `| Collection / Table | Storage Type | Cardinality | Indexing Strategy |\n| :--- | :--- | :--- | :--- |\n`;
  (blueprint.architecture?.dataLayer || []).forEach(d => {
    md += `| \`${d.collection}\` | ${d.type} | ${d.count} | ${d.index} |\n`;
  });

  md += `\n### 2.3 Functional Layer REST API Contracts\n\n`;
  md += `| Method | Path | Access | Responsibility |\n| :--- | :--- | :---: | :--- |\n`;
  (blueprint.architecture?.functionalLayer || []).forEach(f => {
    md += `| \`${f.method}\` | \`${f.path}\` | ${f.access} | ${f.desc} |\n`;
  });

  // 3. ERD & Data Dictionary
  md += `\n---\n\n## 3. Entity Relationship Modeling (ERD) & Data Dictionary\n\n`;
  if (blueprint.erd?.mermaidSyntax) {
    md += `\`\`\`mermaid\n${blueprint.erd.mermaidSyntax}\n\`\`\`\n\n`;
  }
  md += `### Data Dictionary\n\n`;
  (blueprint.erd?.entities || []).forEach(ent => {
    md += `#### Entity: \`${ent.name}\` (${ent.description || ''})\n\n`;
    md += `| Field Name | Type | Key |\n| :--- | :--- | :---: |\n`;
    (ent.fields || []).forEach(fld => {
      md += `| \`${fld.name}\` | ${fld.type} | ${fld.key || '-'} |\n`;
    });
    md += `\n`;
  });

  // 4. System Flows & Diagrams
  md += `---\n\n## 4. System Flows & Behavioral Modeling\n\n`;
  if (blueprint.diagrams?.dfdLevel0) {
    md += `### 4.1 Data Flow Diagram (DFD Level 0 - Context)\n\n\`\`\`mermaid\n${blueprint.diagrams.dfdLevel0}\n\`\`\`\n\n`;
  }
  if (blueprint.diagrams?.dfdLevel1) {
    md += `### 4.2 Data Flow Diagram (DFD Level 1 - Decomposition)\n\n\`\`\`mermaid\n${blueprint.diagrams.dfdLevel1}\n\`\`\`\n\n`;
  }
  if (blueprint.diagrams?.classDiagram) {
    md += `### 4.3 UML Class Diagram\n\n\`\`\`mermaid\n${blueprint.diagrams.classDiagram}\n\`\`\`\n\n`;
  }
  if (blueprint.diagrams?.sequenceAuth) {
    md += `### 4.4 Event Sequence Diagram\n\n\`\`\`mermaid\n${blueprint.diagrams.sequenceAuth}\n\`\`\`\n\n`;
  }

  // 5. Agile Stories
  md += `---\n\n## 5. Agile User Stories & Fibonacci Story Points\n\n`;
  const totalPoints = (blueprint.stories || []).reduce((acc, s) => acc + (parseInt(s.points) || 0), 0);
  md += `**Total Estimated Velocity**: **${totalPoints} Story Points** across **${(blueprint.stories || []).length} stories**.\n\n`;
  md += `| ID | Epic | Title | Points | Priority | Status | User Story Statement |\n| :--- | :---: | :--- | :---: | :---: | :---: | :--- |\n`;
  (blueprint.stories || []).forEach(s => {
    md += `| \`${s.id}\` | ${s.epic} | ${s.title} | ${s.points} pts | ${s.priority} | ${s.status} | ${s.statement} |\n`;
  });

  md += `\n### Acceptance Criteria (Sample Scenarios)\n\n`;
  (blueprint.stories || []).slice(0, 3).forEach(s => {
    md += `#### ${s.id}: ${s.title}\n`;
    (s.acceptance_criteria || []).forEach(crit => {
      md += `\`\`\`gherkin\n${crit}\n\`\`\`\n`;
    });
    md += `\n`;
  });

  // 6. Roadmap
  md += `---\n\n## 6. Strategic Growth Roadmap & Further Work\n\n`;
  md += `| Horizon | Initiative | Impact | Status | Description |\n| :--- | :--- | :---: | :---: | :--- |\n`;
  (blueprint.roadmap || []).forEach(r => {
    md += `| ${r.horizon} | **${r.title}** | ${r.impact} | ${r.status} | ${r.desc} |\n`;
  });

  return md;
}
