// Stage 5: Agile User Stories Decomposition & Fibonacci Sizing

export async function runStage5(ontology, architecture, erd, diagrams, llmProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are an Agile Certified Scrum Master and Technical Project Lead.
Given the system design, decompose the capabilities into 15 to 25 granular Agile User Stories across Epics.

CONSTRAINTS:
1. Every story must follow: "As a <Role>, I want <Action>, So that <Benefit>".
2. Story points MUST be from the Fibonacci scale: 1, 2, 3, 5, 8, or 13.
3. Every story MUST include at least 2 Gherkin test scenarios (Given... When... Then...).
4. Assign MoSCoW priorities (Must, Should, Could).
5. Output valid JSON matching the schema below.

OUTPUT SCHEMA (JSON):
{
  "stories": [
    {
      "id": "US-AUTH-01",
      "epic": "AUTH",
      "title": "Story Title",
      "statement": "As a... I want... So that...",
      "points": 5,
      "priority": "Must",
      "status": "To Do",
      "acceptance_criteria": [
        "Scenario: ...\\n  Given ...\\n  When ...\\n  Then ..."
      ]
    }
  ]
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, JSON.stringify({ ontology, architecture, erd }, null, 2));
    } catch (err) {
      console.warn(`[Stage 5] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  // Heuristic backlog generation
  const stories = [
    {
      id: 'US-AUTH-01',
      epic: 'AUTH',
      title: 'User Registration & Credential Hashing',
      statement: 'As a new user, I want to create an account with my email and password, so that I can establish an authenticated identity.',
      points: 5,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Successful registration\n  Given an email and password of at least 8 characters\n  When the user submits registration\n  Then the system hashes the password with bcrypt salt factor 10\n  And returns a signed JWT bearer token.',
        'Scenario: Duplicate email rejection\n  Given an existing registered email\n  When registration is attempted with the same email\n  Then HTTP 400 is returned with "User already exists".'
      ]
    },
    {
      id: 'US-AUTH-02',
      epic: 'AUTH',
      title: 'Secure User Login',
      statement: 'As a registered user, I want to log in with my credentials, so that I can access my protected workspace.',
      points: 3,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Valid credentials login\n  Given valid email and password\n  When submitted\n  Then HTTP 200 with JWT is returned.'
      ]
    },
    {
      id: 'US-AUTH-03',
      epic: 'AUTH',
      title: 'Persistent Session Recovery',
      statement: 'As an authenticated user, I want my session to remain active upon browser refresh, so that I do not need to re-login repeatedly.',
      points: 2,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Session hydration on refresh\n  Given a stored JWT token in client storage\n  When the client initializes\n  Then GET /api/v1/auth/me is called and state is populated.'
      ]
    },
    {
      id: 'US-RES-01',
      epic: 'CORE',
      title: 'Resource Catalog Browsing with Keyset Pagination',
      statement: 'As a user, I want to browse active domain items with filtering and cursor pagination, so that I can explore offerings smoothly.',
      points: 3,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Keyset query execution\n  Given limit parameter of 20\n  When resources are queried\n  Then up to 20 items are returned along with nextCursor.'
      ]
    },
    {
      id: 'US-RES-02',
      epic: 'CORE',
      title: 'Create and Publish Domain Resource',
      statement: 'As an authorized user, I want to create and publish a domain resource, so that other users can discover it.',
      points: 3,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Resource publishing\n  Given required title and description attributes\n  When submitted with JWT\n  Then record is created in database with owner_id set to req.user.id.'
      ]
    },
    {
      id: 'US-RES-03',
      epic: 'CORE',
      title: 'Author-Only Resource Deletion',
      statement: 'As a resource creator, I want to delete my own items, so that I can remove obsolete listings.',
      points: 3,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Authorized deletion\n  Given user owns resource R\n  When DELETE request is submitted\n  Then resource R is removed.',
        'Scenario: Unauthorized deletion attempt\n  Given user B does not own resource R\n  When user B attempts DELETE\n  Then HTTP 401 Unauthorized is returned.'
      ]
    },
    {
      id: 'US-OPS-01',
      epic: 'OPS',
      title: 'Execute Domain Transaction / Booking',
      statement: 'As a client, I want to execute a transaction on a selected resource, so that my reservation or order is confirmed.',
      points: 5,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Atomic reservation execution\n  Given resource R is available\n  When transaction is submitted\n  Then state transitions to RESERVED with immutable audit log.'
      ]
    },
    {
      id: 'US-SYS-01',
      epic: 'SYS',
      title: 'Cascading Account Purge & GDPR Erasure',
      statement: 'As a registered user, I want to permanently delete my account, so that all my personal data and records are eradicated.',
      points: 8,
      priority: 'Must',
      status: 'To Do',
      acceptance_criteria: [
        'Scenario: Complete cascade delete\n  When user confirms account deletion\n  Then profile, credentials, resources, and sessions are purged.'
      ]
    }
  ];

  return { stories };
}
