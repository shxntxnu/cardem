// Stage 3: Data Modeling & Crow's Foot Mermaid ERD

export async function runStage3(ontology, architecture, llmProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are a Principal Database Architect and Data Modeling Specialist.
Given the Domain Ontology and Layered Architecture, synthesize a complete Data Dictionary and valid Mermaid Crow's Foot ERD.

CONSTRAINTS:
1. Every entity must have a Primary Key (PK).
2. Use Crow's foot cardinality notation (||--||, ||--o|, ||--|{, ||--o{).
3. The mermaidSyntax string MUST start with 'erDiagram' and be 100% syntactically valid in Mermaid v10+.
4. Output JSON matching the schema below.

OUTPUT SCHEMA (JSON):
{
  "entities": [
    {
      "id": "ent_1",
      "name": "ENTITY_NAME",
      "description": "Business purpose",
      "fields": [
        { "name": "id", "type": "UUID", "key": "PK" },
        { "name": "field_name", "type": "String", "key": "" }
      ]
    }
  ],
  "mermaidSyntax": "erDiagram\\n    USER ||--o{ ORDER : places\\n    ..."
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, JSON.stringify({ ontology, architecture }, null, 2));
    } catch (err) {
      console.warn(`[Stage 3] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  // Heuristic ERD generation
  const pName = (ontology.project_name || 'SYSTEM').replace(/\s+/g, '_').toUpperCase();
  const entities = [
    {
      id: 'ent_1',
      name: 'USER_ACCOUNT',
      description: 'System authenticated user identity and login record',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'email', type: 'String', key: 'UK' },
        { name: 'password_hash', type: 'String (Bcrypt)', key: '' },
        { name: 'full_name', type: 'String', key: '' },
        { name: 'created_at', type: 'Timestamp', key: '' }
      ]
    },
    {
      id: 'ent_2',
      name: 'USER_PROFILE',
      description: 'Extended user metadata and operational preferences',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'user_id', type: 'UUID', key: 'FK' },
        { name: 'phone_number', type: 'String', key: '' },
        { name: 'status', type: 'String', key: '' },
        { name: 'updated_at', type: 'Timestamp', key: '' }
      ]
    },
    {
      id: 'ent_3',
      name: 'DOMAIN_RESOURCE',
      description: 'Core domain asset, inventory item, or primary model',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'owner_id', type: 'UUID', key: 'FK' },
        { name: 'title', type: 'String', key: '' },
        { name: 'description', type: 'Text', key: '' },
        { name: 'status', type: 'String', key: '' },
        { name: 'created_at', type: 'Timestamp', key: '' }
      ]
    },
    {
      id: 'ent_4',
      name: 'TRANSACTION_RECORD',
      description: 'Order, booking, activity log, or operational event',
      fields: [
        { name: 'id', type: 'UUID', key: 'PK' },
        { name: 'user_id', type: 'UUID', key: 'FK' },
        { name: 'resource_id', type: 'UUID', key: 'FK' },
        { name: 'amount_cents', type: 'Integer', key: '' },
        { name: 'status', type: 'String', key: '' },
        { name: 'timestamp', type: 'Timestamp', key: '' }
      ]
    }
  ];

  const mermaidSyntax = `erDiagram
    USER_ACCOUNT ||--o| USER_PROFILE : "has"
    USER_ACCOUNT ||--o{ DOMAIN_RESOURCE : "owns"
    USER_ACCOUNT ||--o{ TRANSACTION_RECORD : "executes"
    DOMAIN_RESOURCE ||--o{ TRANSACTION_RECORD : "targeted_by"

    USER_ACCOUNT {
        UUID id PK
        String email UK
        String password_hash
        String full_name
        Timestamp created_at
    }
    USER_PROFILE {
        UUID id PK
        UUID user_id FK
        String phone_number
        String status
    }
    DOMAIN_RESOURCE {
        UUID id PK
        UUID owner_id FK
        String title
        String status
        Timestamp created_at
    }
    TRANSACTION_RECORD {
        UUID id PK
        UUID user_id FK
        UUID resource_id FK
        Integer amount_cents
        String status
    }`;

  return {
    entities,
    mermaidSyntax
  };
}
