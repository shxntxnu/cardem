// Stage 4: Behavioral Flows & Structural UML Synthesis

export async function runStage4(ontology, architecture, erd, llmProvider, useLlm = false) {
  if (useLlm && llmProvider.hasValidKey()) {
    const systemPrompt = `
You are a Lead Software Systems Modeler specializing in UML and Data Flow Diagramming.
Generate 4 distinct diagrams in clean, compilable Mermaid syntax:
1. dfdLevel0: DFD Level 0 Context Diagram
2. dfdLevel1: DFD Level 1 Functional Decomposition Diagram
3. classDiagram: UML Class Diagram with types and methods
4. sequenceAuth: Event Sequence Diagram

CONSTRAINTS:
1. All 4 diagrams must be valid Mermaid syntax.
2. Quote node labels that contain spaces or special characters.
3. Output valid JSON matching the schema below.

OUTPUT SCHEMA (JSON):
{
  "dfdLevel0": "graph TD\\n...",
  "dfdLevel1": "graph TD\\n...",
  "classDiagram": "classDiagram\\n...",
  "sequenceAuth": "sequenceDiagram\\n..."
}
`;
    try {
      return await llmProvider.generateJson(systemPrompt, JSON.stringify({ ontology, architecture, erd }, null, 2));
    } catch (err) {
      console.warn(`[Stage 4] LLM call failed, falling back to heuristic engine: ${err.message}`);
    }
  }

  // Heuristic diagram synthesis
  const sysName = ontology.project_name || 'Application Platform';

  const dfdLevel0 = `graph TD
    User([End User / Client App])
    Admin([Platform Administrator])
    ExtSystem([External Services & Payments])

    subgraph "${sysName} Boundary"
        CoreEngine["${sysName} Engine<br/>API Gateway & Business Logic"]
    end

    User -->|"Authentication & Commands"| CoreEngine
    CoreEngine -->|"Hydrated JSON Payloads"| User
    Admin -->|"Management & Audit Policies"| CoreEngine
    CoreEngine -->|"Events & Webhook Notifications"| ExtSystem
    ExtSystem -->|"Webhook Callbacks"| CoreEngine`;

  const dfdLevel1 = `graph TD
    Client([Client Application])
    D1[("D1: User Identity Store")]
    D2[("D2: Resource Domain Store")]
    D3[("D3: Transaction Ledger")]

    P1["1.0 Identity & Session Auth"]
    P2["2.0 Resource Lifecycle Service"]
    P3["3.0 Transaction & Event Dispatcher"]

    Client -->|"Credentials"| P1
    P1 -->|"Write / Verify User"| D1
    P1 -->|"Signed JWT Token"| Client

    Client -->|"Manage Resource"| P2
    P2 -->|"Verify Token"| D1
    P2 -->|"Read / Mutate Resource"| D2
    D2 -->|"Stream Resource State"| Client

    Client -->|"Execute Transaction"| P3
    P3 -->|"Lock / Validate Resource"| D2
    P3 -->|"Persist Record"| D3
    D3 -->|"Receipt Confirmation"| Client`;

  const classDiagram = `classDiagram
    class UserAccount {
        +UUID id
        +String email
        +String passwordHash
        +createSession()
        +validateCredentials()
    }
    class UserProfile {
        +UUID id
        +UUID userId
        +String status
        +updateProfile()
    }
    class DomainResource {
        +UUID id
        +UUID ownerId
        +String title
        +String status
        +publish()
        +archive()
    }
    class TransactionRecord {
        +UUID id
        +UUID userId
        +UUID resourceId
        +Integer amountCents
        +execute()
    }
    UserAccount "1" <-- "0..1" UserProfile : references
    UserAccount "1" <-- "0..*" DomainResource : owns
    DomainResource "1" <-- "0..*" TransactionRecord : target`;

  const sequenceAuth = `sequenceDiagram
    autonumber
    actor User as Client User
    participant Router as Express API Router
    participant Auth as Auth Middleware
    participant Service as Domain Service
    participant DB as Persistent Database

    User->>Router: POST /api/v1/auth/login { email, password }
    Router->>Auth: Ingest credentials
    Auth->>DB: UserAccount.findOne({ email })
    alt Credentials Valid
        DB-->>Auth: User Record Found
        Auth->>Auth: Verify bcrypt hash & generate JWT
        Auth-->>User: 200 OK { token, user }
    else Invalid Credentials
        DB-->>Auth: null or mismatch
        Auth-->>User: 400 Bad Request { msg: "Invalid credentials" }
    end

    Note over User, DB: Subsequent Authenticated Request
    User->>Router: POST /api/v1/resources (Header: Bearer Token)
    Router->>Auth: Verify JWT signature
    Auth-->>Router: req.user = { id: "user_uuid" }
    Router->>Service: Create Resource Entity
    Service->>DB: DomainResource.save()
    DB-->>Service: Saved Record
    Service-->>User: 201 Created { resource }`;

  return {
    dfdLevel0,
    dfdLevel1,
    classDiagram,
    sequenceAuth
  };
}
