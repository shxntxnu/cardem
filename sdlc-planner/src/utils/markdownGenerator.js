// Universal Markdown SDLC Planning Specification Compiler

export function generateMarkdownSpec(project) {
  const dateStr = new Date().toISOString().split('T')[0];
  
  let md = `# ${project.name} - System Development Life Cycle (SDLC) Planning Specification\n\n`;
  md += `> **Version**: ${project.version || '1.0.0'}  \n`;
  md += `> **Generated Date**: ${dateStr}  \n`;
  md += `> **Scope**: ${project.description || 'System Architecture Specification'}  \n\n`;
  md += `---\n\n`;

  // Target Stack
  if (project.targetStack) {
    md += `## 1. Target Technology Stack\n\n`;
    md += `| Tier | Selected Technologies |\n| :--- | :--- |\n`;
    md += `| **Frontend** | ${project.targetStack.frontend || 'N/A'} |\n`;
    md += `| **Backend** | ${project.targetStack.backend || 'N/A'} |\n`;
    md += `| **Database** | ${project.targetStack.database || 'N/A'} |\n`;
    md += `| **External Services** | ${project.targetStack.external || 'N/A'} |\n\n`;
  }

  // Layered Architecture
  md += `## 2. Multi-Tier Layered Architecture Design\n\n`;
  md += `### 2.1 Business Layer Policies & Domain Rules\n\n`;
  if (project.architecture?.businessLayer?.length) {
    project.architecture.businessLayer.forEach(b => {
      md += `- **${b.title}**: ${b.desc}\n`;
    });
  } else {
    md += `*No business layer rules configured.*\n`;
  }
  md += `\n### 2.2 Data Layer Specifications\n\n`;
  if (project.architecture?.dataLayer?.length) {
    md += `| Collection / Table | Storage Type | Relationship Cardinality | Indexing Strategy |\n| :--- | :--- | :--- | :--- |\n`;
    project.architecture.dataLayer.forEach(d => {
      md += `| \`${d.collection}\` | ${d.type} | ${d.count} | ${d.index} |\n`;
    });
  }
  md += `\n### 2.3 Functional Layer REST API Endpoints\n\n`;
  if (project.architecture?.functionalLayer?.length) {
    md += `| Method | Endpoint | Access | Purpose |\n| :--- | :--- | :--- | :--- |\n`;
    project.architecture.functionalLayer.forEach(f => {
      md += `| \`${f.method}\` | \`${f.path}\` | ${f.access} | ${f.desc} |\n`;
    });
  }
  md += `\n---\n\n`;

  // ERD
  md += `## 3. Entity Relationship Diagram (ERD)\n\n`;
  if (project.erd?.mermaidSyntax) {
    md += `\`\`\`mermaid\n${project.erd.mermaidSyntax}\n\`\`\`\n\n`;
  }
  if (project.erd?.entities?.length) {
    md += `### Data Dictionary\n\n`;
    project.erd.entities.forEach(ent => {
      md += `#### Entity: \`${ent.name}\` (${ent.description || ''})\n\n`;
      md += `| Field Name | Type | Key | Notes |\n| :--- | :--- | :---: | :--- |\n`;
      (ent.fields || []).forEach(fld => {
        md += `| \`${fld.name}\` | ${fld.type} | ${fld.key || '-'} | - |\n`;
      });
      md += `\n`;
    });
  }
  md += `---\n\n`;

  // System Flows & Diagrams
  md += `## 4. Behavioral & Structural Diagrams\n\n`;
  if (project.diagrams?.dfdLevel0) {
    md += `### 4.1 Data Flow Diagram (DFD Level 0 - Context)\n\n`;
    md += `\`\`\`mermaid\n${project.diagrams.dfdLevel0}\n\`\`\`\n\n`;
  }
  if (project.diagrams?.dfdLevel1) {
    md += `### 4.2 Data Flow Diagram (DFD Level 1 - Decomposition)\n\n`;
    md += `\`\`\`mermaid\n${project.diagrams.dfdLevel1}\n\`\`\`\n\n`;
  }
  if (project.diagrams?.classDiagram) {
    md += `### 4.3 UML Class Diagram\n\n`;
    md += `\`\`\`mermaid\n${project.diagrams.classDiagram}\n\`\`\`\n\n`;
  }
  if (project.diagrams?.sequenceAuth) {
    md += `### 4.4 Event Sequence Diagram\n\n`;
    md += `\`\`\`mermaid\n${project.diagrams.sequenceAuth}\n\`\`\`\n\n`;
  }
  md += `---\n\n`;

  // Agile User Stories & Story Points
  md += `## 5. Agile User Stories & Story Points Backlog\n\n`;
  if (project.stories?.length) {
    const totalPts = project.stories.reduce((acc, s) => acc + (parseInt(s.points) || 0), 0);
    md += `**Total Estimated Story Points**: **${totalPts} pts** across **${project.stories.length} stories**.\n\n`;
    md += `| Story ID | Epic | Title | Points | Priority | Status | User Story Statement |\n| :--- | :---: | :--- | :---: | :---: | :---: | :--- |\n`;
    project.stories.forEach(s => {
      md += `| \`${s.id}\` | ${s.epic} | ${s.title} | ${s.points} pts | ${s.priority} | ${s.status} | ${s.statement} |\n`;
    });
  }
  md += `\n---\n\n`;

  // Roadmap & Further Work
  md += `## 6. Architectural Horizons & Further Work\n\n`;
  if (project.roadmap?.length) {
    md += `| Horizon | Initiative / Feature | Impact | Status | Description |\n| :--- | :--- | :---: | :---: | :--- |\n`;
    project.roadmap.forEach(r => {
      md += `| ${r.horizon} | **${r.title}** | ${r.impact} | ${r.status} | ${r.desc} |\n`;
    });
  }

  return md;
}
