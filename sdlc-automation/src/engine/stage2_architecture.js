// Stage 2: Multi-Tier Layered Architecture Synthesis

export async function runStage2(ontology, llmProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are an Enterprise System Architect specializing in scalable 3-tier architectures.
Given the Domain Ontology, design the multi-tier architecture across:
1. target_stack: { frontend, backend, database, external }
2. business_layer: array of { id, title, desc }
3. data_layer: array of { collection, type, count, index }
4. functional_layer: array of { method, path, access, desc }

OUTPUT SCHEMA (JSON):
{
  "target_stack": {
    "frontend": "e.g. React 18, Redux Toolkit, CSS System",
    "backend": "e.g. Node.js, Express, JWT, Express-Validator",
    "database": "e.g. PostgreSQL / MongoDB Atlas",
    "external": "e.g. Stripe, AWS S3, SendGrid"
  },
  "business_layer": [
    { "id": "b1", "title": "Rule Title", "desc": "Rule description and invariants" }
  ],
  "data_layer": [
    { "collection": "users", "type": "Root Document / Table", "count": "1:N", "index": "email Unique" }
  ],
  "functional_layer": [
    { "method": "POST", "path": "/api/...", "access": "Public|Private|Admin", "desc": "Endpoint description" }
  ]
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, JSON.stringify(ontology, null, 2));
    } catch (err) {
      console.warn(`[Stage 2] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  // Heuristic synthesis based on domain type
  const isDocDb = ontology.domain_type === 'social';
  const dbName = isDocDb ? 'MongoDB Atlas, Mongoose 9.x ODM' : 'PostgreSQL 16, Prisma ORM';
  const targetStack = {
    frontend: 'React 18, Redux Toolkit, React-Router v6, CSS System',
    backend: 'Node.js, Express 5.x, JWT Authentication, Express-Validator',
    database: dbName,
    external: 'Stripe Payments, AWS S3 Media Storage, SendGrid Email'
  };

  const businessLayer = [
    {
      id: 'b1',
      title: 'Identity Verification & Credential Hardening',
      desc: 'Email serves as unique account handle; passwords salted with bcrypt factor 10. Sessions governed by stateless HMAC-SHA256 JWT tokens.'
    },
    {
      id: 'b2',
      title: 'State Transition & Domain Integrity Invariant',
      desc: 'Mutations require strict ownership assertion (req.user.id matches resource.user). State transitions adhere to finite state machine rules.'
    },
    {
      id: 'b3',
      title: 'Idempotency & Concurrent Conflict Resolution',
      desc: 'Financial and booking operations require client-generated idempotency keys. Double-booking or duplicate actions are rejected with HTTP 400/409.'
    },
    {
      id: 'b4',
      title: 'Cascading Account Deletion Policy',
      desc: 'User account deletion triggers atomic cascade purging user credentials, profiles, authored content, and associated subdocuments.'
    }
  ];

  const dataLayer = [
    { collection: 'users', type: isDocDb ? 'Root Document' : 'Table', count: '1:N with domain records', index: '{ email: 1 } (Unique)' },
    { collection: 'profiles', type: isDocDb ? 'Root Document' : 'Table', count: '1:1 with users', index: '{ user: 1 } (Unique)' },
    { collection: 'core_resources', type: isDocDb ? 'Root Document' : 'Table', count: '1:N with users', index: '{ user: 1 }, { status: 1 }' },
    { collection: 'transactions', type: isDocDb ? 'Root Document' : 'Table', count: '1:N with resources', index: '{ user_id: 1 }, { created_at: -1 }' }
  ];

  const functionalLayer = [
    { method: 'POST', path: '/api/v1/auth/register', access: 'Public', desc: 'Register account credentials and receive JWT bearer token' },
    { method: 'POST', path: '/api/v1/auth/login', access: 'Public', desc: 'Authenticate email/password and obtain session token' },
    { method: 'GET', path: '/api/v1/auth/me', access: 'Private', desc: 'Retrieve authenticated identity payload' },
    { method: 'GET', path: '/api/v1/resources', access: 'Public', desc: 'Query active domain catalog with filter and cursor pagination' },
    { method: 'POST', path: '/api/v1/resources', access: 'Private', desc: 'Create new domain resource entity' },
    { method: 'GET', path: '/api/v1/resources/:id', access: 'Public', desc: 'Fetch single resource entity by ID' },
    { method: 'PUT', path: '/api/v1/resources/:id', access: 'Private', desc: 'Update owned resource entity (author verified)' },
    { method: 'DELETE', path: '/api/v1/resources/:id', access: 'Private', desc: 'Remove resource entity (author verified)' },
    { method: 'POST', path: '/api/v1/transactions', access: 'Private', desc: 'Initiate state action / booking / payment transaction' },
    { method: 'DELETE', path: '/api/v1/account', access: 'Private', desc: 'Cascading purge of account and associated records' }
  ];

  return {
    target_stack: targetStack,
    business_layer: businessLayer,
    data_layer: dataLayer,
    functional_layer: functionalLayer
  };
}
