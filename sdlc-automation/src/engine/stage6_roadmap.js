// Stage 6: Strategic Roadmap & Technical Debt Forecasting

export async function runStage6(ontology, architecture, stories, llmProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are a Principal DevOps and Enterprise Cloud Architect.
Formulate a post-launch architectural roadmap across 3 growth horizons and document baseline technical debt risks.

OUTPUT SCHEMA (JSON):
{
  "roadmap": [
    {
      "id": "r1",
      "horizon": "Horizon 1 (0-3 Months)|Horizon 2 (3-6 Months)|Horizon 3 (6-12 Months)",
      "title": "Initiative Title",
      "impact": "Critical|High|Medium|Low",
      "status": "Planned",
      "desc": "Scope and rationale"
    }
  ],
  "technical_debt": [
    {
      "id": "TD-01",
      "area": "Area Name",
      "risk": "Risk description",
      "severity": "CRITICAL|HIGH|MEDIUM",
      "remediation": "Remediation tactic"
    }
  ]
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, JSON.stringify({ ontology, architecture }, null, 2));
    } catch (err) {
      console.warn(`[Stage 6] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  // Heuristic roadmap synthesis
  const roadmap = [
    {
      id: 'r1',
      horizon: 'Horizon 1 (0-3 Months)',
      title: 'Dual-Token Refresh Architecture & Rate Limiting',
      impact: 'High',
      status: 'Planned',
      desc: 'Implement 15-minute access tokens with 7-day rotated HttpOnly refresh tokens in Redis. Add express-rate-limit.'
    },
    {
      id: 'r2',
      horizon: 'Horizon 1 (0-3 Months)',
      title: 'Keyset / Cursor-Based Query Pagination',
      impact: 'High',
      status: 'Planned',
      desc: 'Enforce keyset pagination with cursor and limit across all catalog endpoints to eliminate unbounded query heap exhaustion.'
    },
    {
      id: 'r3',
      horizon: 'Horizon 2 (3-6 Months)',
      title: 'WebSockets Real-Time Push Notification Engine',
      impact: 'High',
      status: 'Planned',
      desc: 'Integrate Socket.io cluster with Redis pub/sub adapter for instant status and transaction push alerts.'
    },
    {
      id: 'r4',
      horizon: 'Horizon 2 (3-6 Months)',
      title: 'Distributed Redis Cache & Full-Text Search',
      impact: 'Medium',
      status: 'Planned',
      desc: 'Deploy Redis cluster for resource caching and integrate Elasticsearch / Atlas Search for fuzzy queries.'
    },
    {
      id: 'r5',
      horizon: 'Horizon 3 (6-12 Months)',
      title: 'Microservices Decomposition & Apache Kafka Event Log',
      impact: 'Critical',
      status: 'Planned',
      desc: 'Decompose monolithic services into Auth, Resource, and Transaction microservices communicating via an Apache Kafka distributed bus.'
    }
  ];

  const technicalDebt = [
    {
      id: 'TD-01',
      area: 'Query Performance',
      risk: 'Unbounded find queries risk memory leaks at scale.',
      severity: 'HIGH',
      remediation: 'Implement mandatory limit & cursor pagination middleware.'
    },
    {
      id: 'TD-02',
      area: 'Authentication Lifecycle',
      risk: 'Static long-lived JWT tokens cannot be revoked immediately.',
      severity: 'HIGH',
      remediation: 'Migrate to short-lived access tokens + Redis token blacklisting.'
    }
  ];

  return { roadmap, technical_debt: technicalDebt };
}
