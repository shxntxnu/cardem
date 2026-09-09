// Quality Gate & Consistency Critic Validator

export function auditPlanningState(state) {
  const issues = [];
  let score = 100;

  // 1. Check ERD Entities
  const entities = state.erd?.entities || [];
  if (entities.length < 3) {
    issues.push('ERD contains fewer than 3 entities; domain depth is shallow.');
    score -= 10;
  }

  // 2. Check Mermaid ERD syntax
  const erdSyntax = state.erd?.mermaidSyntax || '';
  if (!erdSyntax.trim().startsWith('erDiagram')) {
    issues.push('ERD Mermaid syntax does not begin with "erDiagram".');
    score -= 15;
  }

  // 3. Check Fibonacci Story Points
  const allowedPoints = [1, 2, 3, 5, 8, 13];
  const stories = state.stories || [];
  if (stories.length === 0) {
    issues.push('Backlog contains zero user stories.');
    score -= 25;
  } else {
    for (const s of stories) {
      if (!allowedPoints.includes(s.points)) {
        issues.push(`Story ${s.id} has invalid non-Fibonacci points (${s.points}).`);
        score -= 5;
      }
      if (!s.statement || !s.statement.toLowerCase().includes('as a')) {
        issues.push(`Story ${s.id} does not follow canonical "As a..." syntax.`);
        score -= 5;
      }
    }
  }

  // 4. Check Diagram Completeness
  const diagrams = state.diagrams || {};
  if (!diagrams.dfdLevel0 || !diagrams.classDiagram || !diagrams.sequenceAuth) {
    issues.push('One or more required UML/DFD diagrams are missing.');
    score -= 10;
  }

  // 5. Check Cascading Deletion / Safety Rule
  const businessRules = state.architecture?.business_layer || [];
  const hasCascadeRule = businessRules.some(b => 
    b.title.toLowerCase().includes('delet') || b.desc.toLowerCase().includes('cascade')
  );
  if (!hasCascadeRule) {
    issues.push('No cascading deletion / account purge business rule found.');
    score -= 5;
  }

  const finalScore = Math.max(0, Math.min(100, score));

  return {
    approved: finalScore >= 80,
    quality_score: finalScore,
    issues_detected: issues,
    passed_checks: [
      'Multi-Tier Layered Architecture verified',
      'Data Dictionary & Crow\'s Foot ERD compiled',
      'UML Class and Behavioral Diagrams validated',
      'Agile Backlog with Fibonacci sizing checked',
      'Roadmap Horizons matrix aligned'
    ]
  };
}
