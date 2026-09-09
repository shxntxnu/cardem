// Stage 1: Domain Discovery & Ontology Synthesis

export async function runStage1(rawPrompt, llmProvider, heuristicProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are the Lead Requirements Analyst and Product Discovery Architect in an enterprise Autonomous SDLC Inception Engine.
Analyze the user's software idea and extract a formal Domain Ontology.

OUTPUT SCHEMA (JSON):
{
  "project_id": "short_unique_slug",
  "project_name": "Full Title of System",
  "version": "1.0.0",
  "description": "Comprehensive scope and purpose description",
  "domain_type": "logistics|rental|ecommerce|social|health|fintech|general",
  "actors": [
    { "name": "ActorName", "category": "Human_Primary|Human_Secondary|External_System", "role": "Responsibilities" }
  ],
  "boundary_constraints": [
    "List of boundary constraints and business invariants"
  ]
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, `Raw Software Idea:\n${rawPrompt}`);
    } catch (err) {
      console.warn(`[Stage 1] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  return heuristicProvider.synthesizeOntology(rawPrompt);
}
