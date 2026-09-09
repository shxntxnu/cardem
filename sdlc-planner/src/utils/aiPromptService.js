// PlanCraft SDLC Studio - Universal AI Prompt Service
// Supports Google Gemini (with model fallback), OpenAI, and Offline Heuristic Synthesizer

export async function executePromptSynthesis({
  prompt,
  contextProject,
  mode = 'extend', // 'extend' | 'incept'
  provider = 'gemini', // 'gemini' | 'openai' | 'offline'
  apiKey = '',
  model = 'gemini-3.8-flash'
}) {
  if (provider === 'offline' || !apiKey) {
    return generateOfflineSynthesis(prompt, contextProject, mode);
  }

  if (provider === 'gemini') {
    return callGemini(prompt, contextProject, mode, apiKey, model);
  }

  if (provider === 'openai') {
    return callOpenAI(prompt, contextProject, mode, apiKey, model);
  }

  return generateOfflineSynthesis(prompt, contextProject, mode);
}

// --- GOOGLE GEMINI CALLER ---
async function callGemini(prompt, contextProject, mode, apiKey, model) {
  const modelsToTry = [
    model,
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  // Remove duplicates
  const uniqueModels = [...new Set(modelsToTry)];
  let lastError = null;

  for (const m of uniqueModels) {
    try {
      const result = await attemptGeminiCall(prompt, contextProject, mode, apiKey, m);
      return { ...result, usedModel: m };
    } catch (err) {
      lastError = err;
      // If error is 404 (model not found), try next model in priority order
      if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('not found'))) {
        console.warn(`Gemini model "${m}" not found or unsupported on endpoint. Trying fallback...`);
        continue;
      }
      throw err;
    }
  }

  throw lastError || new Error('Failed to complete Gemini API call across available models.');
}

async function attemptGeminiCall(prompt, contextProject, mode, apiKey, model) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  let systemPrompt = '';
  if (mode === 'extend') {
    systemPrompt = `You are a Principal Software Architect expanding an existing system specification.
Context System: "${contextProject.name}" (${contextProject.description})
Stack: Frontend: ${contextProject.targetStack?.frontend || 'React'}, Backend: ${contextProject.targetStack?.backend || 'Node/Express'}, Database: ${contextProject.targetStack?.database || 'MongoDB'}

The user wants to add/develop this feature: "${prompt}".
Generate an extension package. You MUST return ONLY a JSON object matching this schema:
{
  "mode": "extend",
  "featureTitle": "Short Feature Name",
  "businessRules": [
    { "id": "b_ext_1", "title": "Policy Name", "desc": "Concrete invariant rule" }
  ],
  "dataLayer": [
    { "collection": "collection_name", "type": "Document / Table", "count": "1:N with parent", "index": "{ field: 1 }" }
  ],
  "functionalLayer": [
    { "method": "GET | POST | PUT | DELETE", "path": "/api/...", "access": "Private | Public", "desc": "Endpoint responsibility" }
  ],
  "erdEntities": [
    {
      "id": "ent_ext_1",
      "name": "ENTITY_NAME",
      "description": "Entity purpose",
      "fields": [
        { "name": "_id", "type": "ObjectId | UUID", "key": "PK" },
        { "name": "field_name", "type": "String | Number | Date", "key": "" }
      ]
    }
  ],
  "erdMermaidDelta": "erDiagram snippet or relationship lines e.g. USER ||--o{ NEW_ENTITY : has",
  "stories": [
    {
      "id": "US-NEW-01",
      "epic": "EPIC_NAME",
      "title": "Story Title",
      "points": 5,
      "priority": "Must | Should | Could",
      "status": "To Do",
      "statement": "As a <role>, I want <goal>, so that <benefit>."
    }
  ],
  "roadmap": [
    {
      "id": "r_ext_1",
      "horizon": "Horizon 1 (0-3 Months)",
      "title": "Initiative Title",
      "impact": "High | Medium",
      "status": "Planned",
      "desc": "Technical debt remediation or scale initiative"
    }
  ]
}`;
  } else {
    systemPrompt = `You are an Autonomous SDLC System Architect.
Synthesize a complete architecture blueprint from this software idea: "${prompt}".
You MUST return ONLY a JSON object matching this PlanCraft blueprint schema:
{
  "mode": "incept",
  "id": "slug_id",
  "name": "Platform Name",
  "version": "1.0.0",
  "description": "Comprehensive scope summary",
  "targetStack": {
    "frontend": "React 18, Redux, CSS System",
    "backend": "Node.js, Express, JWT, REST APIs",
    "database": "PostgreSQL or MongoDB",
    "external": "Stripe, AWS, Cloud Services"
  },
  "architecture": {
    "businessLayer": [
      { "id": "b1", "title": "Rule Title", "desc": "Domain invariant" }
    ],
    "dataLayer": [
      { "collection": "users", "type": "Table", "count": "1:N", "index": "email (Unique)" }
    ],
    "functionalLayer": [
      { "method": "POST", "path": "/api/v1/resource", "access": "Public", "desc": "Description" }
    ]
  },
  "erd": {
    "entities": [
      { "id": "ent1", "name": "USER", "description": "User entity", "fields": [{ "name": "id", "type": "UUID", "key": "PK" }] }
    ],
    "mermaidSyntax": "erDiagram\\n    USER { UUID id PK }"
  },
  "diagrams": {
    "dfdLevel0": "graph TD\\n    User --> System",
    "classDiagram": "classDiagram\\n    class User { +UUID id }",
    "sequenceAuth": "sequenceDiagram\\n    User->>System: Login"
  },
  "stories": [
    { "id": "US-01", "epic": "CORE", "title": "Story Title", "points": 5, "priority": "Must", "status": "To Do", "statement": "As a user, I want..." }
  ],
  "roadmap": [
    { "id": "r1", "horizon": "Horizon 1 (0-3 Months)", "title": "Title", "impact": "High", "status": "Planned", "desc": "Description" }
  ]
}`;
  }

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `${systemPrompt}\n\nTask User Prompt:\n${prompt}\n\nRemember: Output ONLY raw valid JSON matching the schema with no markdown formatting.`
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.25,
      responseMimeType: 'application/json'
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('No content returned from Gemini API.');
  }

  const parsed = JSON.parse(rawText.trim().replace(/^```json\n?|\n?```$/g, ''));
  return parsed;
}

// --- OPENAI CALLER ---
async function callOpenAI(prompt, contextProject, mode, apiKey, model = 'gpt-4o-mini') {
  const url = 'https://api.openai.com/v1/chat/completions';
  const isExtend = mode === 'extend';

  const systemPrompt = isExtend
    ? `You are an enterprise SDLC Architect extending project "${contextProject.name}". Generate a JSON object with: mode="extend", featureTitle, businessRules, dataLayer, functionalLayer, erdEntities, erdMermaidDelta, stories, roadmap.`
    : `You are an enterprise SDLC Architect. Synthesize a complete PlanCraft JSON blueprint with id, name, version, description, targetStack, architecture, erd, diagrams, stories, roadmap.`;

  const payload = {
    model: model || 'gpt-4o-mini',
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt }
    ]
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey.trim()}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// --- OFFLINE INTELLIGENT HEURISTIC SYNTHESIZER ---
export function generateOfflineSynthesis(prompt, contextProject, mode) {
  const p = prompt.toLowerCase();
  const timestamp = Date.now();

  if (mode === 'extend') {
    // 1. Chat & Direct Messaging
    if (p.includes('chat') || p.includes('message') || p.includes('socket') || p.includes('dm')) {
      return {
        mode: 'extend',
        featureTitle: 'Real-Time Direct Messaging & Collaboration',
        usedModel: 'Offline Heuristic Engine',
        businessRules: [
          {
            id: `b_chat_${timestamp}_1`,
            title: 'WebSocket Handshake & Identity Verification',
            desc: 'Enforce JWT bearer authentication during WebSocket handshake; associate connection socket ID with verified user ID in Redis cluster.'
          },
          {
            id: `b_chat_${timestamp}_2`,
            title: 'Message Privacy & Retention Invariant',
            desc: 'Direct messages are strictly restricted to conversation participants. Soft delete sets tombstone flag for multi-device sync.'
          }
        ],
        dataLayer: [
          {
            collection: 'conversations',
            type: 'Root Document',
            count: '1:N with users',
            index: '{ participants: 1 }, { updated_at: -1 }'
          },
          {
            collection: 'messages',
            type: 'Sub-collection / Document',
            count: '1:N with conversations',
            index: '{ conversation_id: 1, created_at: -1 }'
          }
        ],
        functionalLayer: [
          {
            method: 'GET',
            path: '/api/chat/conversations',
            access: 'Private',
            desc: 'Fetch active conversation threads with latest message preview and unread counters'
          },
          {
            method: 'POST',
            path: '/api/chat/conversations',
            access: 'Private',
            desc: 'Initiate or retrieve 1-on-1 direct conversation with target developer'
          },
          {
            method: 'GET',
            path: '/api/chat/messages/:conv_id',
            access: 'Private',
            desc: 'Cursor-based paginated message history for conversation thread'
          },
          {
            method: 'POST',
            path: '/api/chat/messages',
            access: 'Private',
            desc: 'Dispatch direct message, persist payload, and emit Socket.io event'
          }
        ],
        erdEntities: [
          {
            id: `ent_conv_${timestamp}`,
            name: 'CONVERSATION',
            description: 'Thread mapping active developer chat participants',
            fields: [
              { name: '_id', type: 'ObjectId', key: 'PK' },
              { name: 'participants', type: 'ObjectId[] (Users)', key: 'FK' },
              { name: 'last_message', type: 'String', key: '' },
              { name: 'updated_at', type: 'Date', key: '' }
            ]
          },
          {
            id: `ent_msg_${timestamp}`,
            name: 'MESSAGE',
            description: 'Direct message payload with delivery state',
            fields: [
              { name: '_id', type: 'ObjectId', key: 'PK' },
              { name: 'conversation_id', type: 'ObjectId', key: 'FK' },
              { name: 'sender_id', type: 'ObjectId (User)', key: 'FK' },
              { name: 'text', type: 'String', key: '' },
              { name: 'is_read', type: 'Boolean', key: '' },
              { name: 'created_at', type: 'Date', key: '' }
            ]
          }
        ],
        erdMermaidDelta: `    CONVERSATION ||--o{ MESSAGE : contains\n    USER ||--o{ CONVERSATION : participates`,
        stories: [
          {
            id: `US-CHAT-01`,
            epic: 'REALTIME',
            title: 'Socket.io Handshake Gateway',
            points: 5,
            priority: 'Must',
            status: 'To Do',
            statement: 'As a logged-in developer, I want to authenticate over WebSocket so that I can exchange instant messages.'
          },
          {
            id: `US-CHAT-02`,
            epic: 'REALTIME',
            title: '1-on-1 Direct Message Stream',
            points: 5,
            priority: 'Must',
            status: 'To Do',
            statement: 'As a developer, I want to open a chat modal with any profile owner so that we can coordinate project contributions.'
          },
          {
            id: `US-CHAT-03`,
            epic: 'REALTIME',
            title: 'Message Read Receipts & Status Indicators',
            points: 3,
            priority: 'Should',
            status: 'To Do',
            statement: 'As a sender, I want to see checkmarks when my message has been delivered and viewed.'
          }
        ],
        roadmap: [
          {
            id: `r_chat_${timestamp}`,
            horizon: 'Horizon 1 (0-3 Months)',
            title: 'Distributed Redis Pub/Sub Socket Adapter',
            impact: 'High',
            status: 'Planned',
            desc: 'Scale WebSocket connections horizontally across containerized node instances.'
          }
        ]
      };
    }

    // 2. Job Board & Recruiter ATS
    if (p.includes('job') || p.includes('recruit') || p.includes('hiring') || p.includes('ats')) {
      return {
        mode: 'extend',
        featureTitle: 'Developer Job Board & Recruiter ATS Matching',
        usedModel: 'Offline Heuristic Engine',
        businessRules: [
          {
            id: `b_job_${timestamp}_1`,
            title: 'Recruiter Verified Organization Invariant',
            desc: 'Only users with validated recruiter credentials and company domains can publish job postings.'
          },
          {
            id: `b_job_${timestamp}_2`,
            title: 'Skill Match Score Determinism',
            desc: 'Application match scoring strictly calculates intersection between developer normalized skills and required job keywords.'
          }
        ],
        dataLayer: [
          {
            collection: 'jobs',
            type: 'Root Document',
            count: '1:N with recruiter',
            index: '{ skills_required: 1 }, { salary_range: 1 }'
          },
          {
            collection: 'applications',
            type: 'Root Document',
            count: '1:N with jobs',
            index: '{ job_id: 1, applicant_id: 1 } (Unique)'
          }
        ],
        functionalLayer: [
          {
            method: 'GET',
            path: '/api/jobs',
            access: 'Public',
            desc: 'List active developer openings with filter by seniority, location, and required tech stack'
          },
          {
            method: 'POST',
            path: '/api/jobs',
            access: 'Private',
            desc: 'Post new engineering job specification (Recruiter role required)'
          },
          {
            method: 'POST',
            path: '/api/jobs/:id/apply',
            access: 'Private',
            desc: 'Submit 1-click developer portfolio application with cover note'
          }
        ],
        erdEntities: [
          {
            id: `ent_job_${timestamp}`,
            name: 'JOB_POSTING',
            description: 'Engineering role opening requirements',
            fields: [
              { name: '_id', type: 'ObjectId', key: 'PK' },
              { name: 'recruiter_id', type: 'ObjectId', key: 'FK' },
              { name: 'title', type: 'String', key: '' },
              { name: 'company', type: 'String', key: '' },
              { name: 'skills_required', type: 'String[]', key: '' },
              { name: 'is_remote', type: 'Boolean', key: '' }
            ]
          },
          {
            id: `ent_app_${timestamp}`,
            name: 'JOB_APPLICATION',
            description: 'Developer job application submission',
            fields: [
              { name: '_id', type: 'ObjectId', key: 'PK' },
              { name: 'job_id', type: 'ObjectId', key: 'FK' },
              { name: 'developer_id', type: 'ObjectId', key: 'FK' },
              { name: 'status', type: 'String (Pending/Review/Offer)', key: '' },
              { name: 'match_score', type: 'Number', key: '' }
            ]
          }
        ],
        erdMermaidDelta: `    JOB_POSTING ||--o{ JOB_APPLICATION : receives\n    USER ||--o{ JOB_APPLICATION : submits`,
        stories: [
          {
            id: `US-JOB-01`,
            epic: 'CAREERS',
            title: 'Browse Filterable Job Feed',
            points: 5,
            priority: 'Must',
            status: 'To Do',
            statement: 'As a software engineer, I want to filter job openings by my skills so that I find relevant remote opportunities.'
          },
          {
            id: `US-JOB-02`,
            epic: 'CAREERS',
            title: '1-Click Profile Application',
            points: 5,
            priority: 'Must',
            status: 'To Do',
            statement: 'As a developer, I want to submit my DevConnector profile directly to employers with one click.'
          }
        ],
        roadmap: [
          {
            id: `r_job_${timestamp}`,
            horizon: 'Horizon 2 (3-6 Months)',
            title: 'Vector Embeddings for Semantic Skill Match',
            impact: 'High',
            status: 'Planned',
            desc: 'Replace keyword match with pgvector cosine similarity between resume and job description.'
          }
        ]
      };
    }

    // 3. AI Reviewer / Portfolio Mentor
    if (p.includes('ai') || p.includes('review') || p.includes('mentor') || p.includes('portfolio') || p.includes('resume')) {
      return {
        mode: 'extend',
        featureTitle: 'AI Portfolio Code Reviewer & Interview Simulator',
        usedModel: 'Offline Heuristic Engine',
        businessRules: [
          {
            id: `b_ai_${timestamp}_1`,
            title: 'Rate-Limited Token Quota Enforcement',
            desc: 'Standard developers receive 5 AI portfolio reviews per 24-hour sliding window; tier upgrades permit unlimited scans.'
          },
          {
            id: `b_ai_${timestamp}_2`,
            title: 'GitHub Static Analysis Sanitization',
            desc: 'Repo code imports must strip environment secrets and API keys prior to prompt serialization.'
          }
        ],
        dataLayer: [
          {
            collection: 'ai_reviews',
            type: 'Root Document',
            count: '1:N with profiles',
            index: '{ profile_id: 1, created_at: -1 }'
          }
        ],
        functionalLayer: [
          {
            method: 'POST',
            path: '/api/ai/review-portfolio',
            access: 'Private',
            desc: 'Trigger AI audit of developer profile GitHub repos and generate feedback report'
          },
          {
            method: 'GET',
            path: '/api/ai/reviews/me',
            access: 'Private',
            desc: 'Retrieve historical AI scorecards and improvement recommendations'
          }
        ],
        erdEntities: [
          {
            id: `ent_ai_${timestamp}`,
            name: 'AI_REVIEW_SCORECARD',
            description: 'AI-generated code quality and resume audit scorecard',
            fields: [
              { name: '_id', type: 'ObjectId', key: 'PK' },
              { name: 'profile_id', type: 'ObjectId', key: 'FK' },
              { name: 'overall_score', type: 'Number', key: '' },
              { name: 'strengths', type: 'String[]', key: '' },
              { name: 'recommendations', type: 'String[]', key: '' }
            ]
          }
        ],
        erdMermaidDelta: `    PROFILE ||--o{ AI_REVIEW_SCORECARD : owns`,
        stories: [
          {
            id: `US-AI-01`,
            epic: 'AI_SERVICES',
            title: 'Automated Portfolio Audit',
            points: 8,
            priority: 'Must',
            status: 'To Do',
            statement: 'As a job-seeking developer, I want AI feedback on my top GitHub projects so that I can optimize my code before interviews.'
          }
        ],
        roadmap: [
          {
            id: `r_ai_${timestamp}`,
            horizon: 'Horizon 1 (0-3 Months)',
            title: 'Async BullMQ Worker Queue for AI Scans',
            impact: 'High',
            status: 'Planned',
            desc: 'Decouple long-running LLM generation from synchronous REST response cycle.'
          }
        ]
      };
    }

    // 4. Default Generic Feature Extension
    const slug = prompt.slice(0, 24).replace(/[^a-zA-Z0-9 ]/g, '').trim();
    const entityName = slug.toUpperCase().replace(/\s+/g, '_') || 'FEATURE_ITEM';
    return {
      mode: 'extend',
      featureTitle: `${slug || 'Custom Extension'} Module`,
      usedModel: 'Offline Heuristic Engine',
      businessRules: [
        {
          id: `b_gen_${timestamp}_1`,
          title: `${slug} Authorization Policy`,
          desc: 'Ensure caller maintains ownership permission before executing modifications.'
        }
      ],
      dataLayer: [
        {
          collection: entityName.toLowerCase(),
          type: 'Root Collection',
          count: '1:N with users',
          index: '{ user_id: 1, created_at: -1 }'
        }
      ],
      functionalLayer: [
        {
          method: 'GET',
          path: `/api/${entityName.toLowerCase()}`,
          access: 'Private',
          desc: `Retrieve ${slug} records for current user session`
        },
        {
          method: 'POST',
          path: `/api/${entityName.toLowerCase()}`,
          access: 'Private',
          desc: `Create and persist new ${slug} entry`
        }
      ],
      erdEntities: [
        {
          id: `ent_gen_${timestamp}`,
          name: entityName,
          description: `Stores state for ${slug}`,
          fields: [
            { name: '_id', type: 'ObjectId', key: 'PK' },
            { name: 'user_id', type: 'ObjectId', key: 'FK' },
            { name: 'title', type: 'String', key: '' },
            { name: 'status', type: 'String', key: '' },
            { name: 'created_at', type: 'Date', key: '' }
          ]
        }
      ],
      erdMermaidDelta: `    USER ||--o{ ${entityName} : owns`,
      stories: [
        {
          id: `US-MOD-01`,
          epic: 'CORE',
          title: `Manage ${slug}`,
          points: 5,
          priority: 'Must',
          status: 'To Do',
          statement: `As a user, I want to manage ${slug} so that my workflow is streamlined.`
        }
      ],
      roadmap: [
        {
          id: `r_gen_${timestamp}`,
          horizon: 'Horizon 1 (0-3 Months)',
          title: `Optimize ${slug} Indexing`,
          impact: 'Medium',
          status: 'Planned',
          desc: `Apply compound indexing to support high concurrency reads on ${entityName.toLowerCase()}.`
        }
      ]
    };
  }

  // mode === 'incept' (Create complete new project)
  const projSlug = prompt.slice(0, 20).toLowerCase().replace(/[^a-z0-9]/g, '') || 'newapp';
  const projName = prompt.slice(0, 32).trim() || 'New Application';
  return {
    mode: 'incept',
    usedModel: 'Offline Heuristic Engine',
    id: projSlug,
    name: `${projName} Platform`,
    version: '1.0.0',
    description: prompt,
    targetStack: {
      frontend: 'React 18, Redux Toolkit, CSS Design System',
      backend: 'Node.js, Express, JWT, Express-Validator',
      database: 'MongoDB Atlas / PostgreSQL',
      external: 'Stripe, AWS S3, SendGrid'
    },
    architecture: {
      businessLayer: [
        { id: 'b1', title: 'Stateless Authentication', desc: 'Secure JWT token authentication with bcrypt password hashing.' },
        { id: 'b2', title: 'Data Isolation Invariant', desc: 'Mutations strictly enforce authorization ownership check.' }
      ],
      dataLayer: [
        { collection: 'users', type: 'Root Document', count: '1:N', index: '{ email: 1 } (Unique)' },
        { collection: 'resources', type: 'Root Document', count: '1:N with users', index: '{ user: 1 }, { created_at: -1 }' }
      ],
      functionalLayer: [
        { method: 'POST', path: '/api/v1/auth/register', access: 'Public', desc: 'Register credentials and issue JWT' },
        { method: 'POST', path: '/api/v1/auth/login', access: 'Public', desc: 'Authenticate and receive session token' },
        { method: 'GET', path: '/api/v1/resources', access: 'Private', desc: 'Fetch paginated catalog of resources' },
        { method: 'POST', path: '/api/v1/resources', access: 'Private', desc: 'Create and persist resource record' }
      ]
    },
    erd: {
      entities: [
        {
          id: 'ent_1',
          name: 'USER',
          description: 'Account credentials and profile identity',
          fields: [
            { name: '_id', type: 'ObjectId', key: 'PK' },
            { name: 'name', type: 'String', key: '' },
            { name: 'email', type: 'String', key: 'UK' },
            { name: 'password', type: 'String (Bcrypt)', key: '' }
          ]
        },
        {
          id: 'ent_2',
          name: 'RESOURCE',
          description: 'Primary domain resource items',
          fields: [
            { name: '_id', type: 'ObjectId', key: 'PK' },
            { name: 'user_id', type: 'ObjectId', key: 'FK' },
            { name: 'title', type: 'String', key: '' },
            { name: 'created_at', type: 'Date', key: '' }
          ]
        }
      ],
      mermaidSyntax: `erDiagram\n    USER ||--o{ RESOURCE : owns\n    USER {\n        ObjectId _id PK\n        String email UK\n    }\n    RESOURCE {\n        ObjectId _id PK\n        ObjectId user_id FK\n        String title\n    }`
    },
    diagrams: {
      dfdLevel0: `graph TD\n    Client[Client Web App] -->|HTTPS REST| Gateway[API Server]\n    Gateway -->|Queries| DB[(Persistent Database)]`,
      classDiagram: `classDiagram\n    class User {\n        +ObjectId id\n        +String email\n        +register()\n    }\n    class Resource {\n        +ObjectId id\n        +String title\n    }\n    User "1" --> "*" Resource`,
      sequenceAuth: `sequenceDiagram\n    autonumber\n    Client->>Server: POST /api/v1/auth/login\n    Server->>DB: Query User by Email\n    DB-->>Server: Return Hash\n    Server-->>Client: 200 OK + JWT Token`
    },
    stories: [
      { id: 'US-01', epic: 'AUTH', title: 'User Registration & JWT Login', points: 5, priority: 'Must', status: 'To Do', statement: 'As a user, I want to register and sign in so that I can access my workspace.' },
      { id: 'US-02', epic: 'CORE', title: 'Explore & Filter Catalog', points: 5, priority: 'Must', status: 'To Do', statement: 'As a user, I want to list and filter items so that I find what I need quickly.' },
      { id: 'US-03', epic: 'CORE', title: 'Create & Manage Records', points: 5, priority: 'Must', status: 'To Do', statement: 'As a user, I want to create, edit, and delete my records.' }
    ],
    roadmap: [
      { id: 'r1', horizon: 'Horizon 1 (0-3 Months)', title: 'Rate Limiting & Redis Session Cache', impact: 'High', status: 'Planned', desc: 'Prevent API abuse and accelerate session checks.' },
      { id: 'r2', horizon: 'Horizon 2 (3-6 Months)', title: 'Full-Text Search Indexing', impact: 'High', status: 'Planned', desc: 'Deploy Elasticsearch or Atlas Search for real-time text matching.' }
    ]
  };
}
