// Preloaded Architecture Blueprints for PlanCraft SDLC Studio

export const devConnectorTemplate = {
  id: 'devconnector',
  name: 'DevConnector - Developer Social Network',
  version: '2.0.0',
  description: 'Social networking and professional portfolio hub for software engineers built on the MERN stack.',
  targetStack: {
    frontend: 'React 18, Redux, React-Router v6, Axios, CSS Design System',
    backend: 'Node.js, Express 5.x, JWT Authentication, Express-Validator',
    database: 'MongoDB Atlas, Mongoose 9.x ODM',
    external: 'GitHub REST API v3, Gravatar Avatar Service'
  },
  architecture: {
    businessLayer: [
      { id: 'b1', title: 'Developer Identity & Credential Isolation', desc: 'Email uniqueness enforcement, bcrypt salt cost 10, Gravatar avatar derivation, 100h JWT token lifecycle.' },
      { id: 'b2', title: '1:1 Profile Invariant & Skill Normalization', desc: 'Strict 1:1 user-to-profile mapping, comma-separated skill normalization into trimmed arrays, chronological career timeline.' },
      { id: 'b3', title: 'Social Interaction Idempotency', desc: 'Single like per user per post, unlike validation, author-only post and comment deletion authority.' },
      { id: 'b4', title: 'Cascading Account Deletion', desc: 'Atomic or sequential account purge across posts, profile, and user credentials.' }
    ],
    dataLayer: [
      { collection: 'users', type: 'Root Document', count: '1:N with posts', index: '{ email: 1 } (Unique)' },
      { collection: 'profiles', type: 'Root Document with Subdocs', count: '1:1 with users', index: '{ user: 1 } (Unique), { skills: 1 }' },
      { collection: 'posts', type: 'Root Document with Subdocs', count: '1:N with users', index: '{ user: 1 }, { date: -1 }' }
    ],
    functionalLayer: [
      { method: 'POST', path: '/api/users', access: 'Public', desc: 'Register developer account and receive JWT' },
      { method: 'POST', path: '/api/auth', access: 'Public', desc: 'Authenticate credentials and obtain JWT' },
      { method: 'GET', path: '/api/auth', access: 'Private', desc: 'Get authenticated user object (sans password)' },
      { method: 'GET', path: '/api/profile/me', access: 'Private', desc: 'Fetch authenticated user profile with user hydration' },
      { method: 'POST', path: '/api/profile', access: 'Private', desc: 'Create or update developer profile' },
      { method: 'GET', path: '/api/profile', access: 'Public', desc: 'List all community developer profiles' },
      { method: 'PUT', path: '/api/profile/experience', access: 'Private', desc: 'Add job experience subdocument' },
      { method: 'DELETE', path: '/api/profile/experience/:exp_id', access: 'Private', desc: 'Delete job experience by subdoc ID' },
      { method: 'PUT', path: '/api/profile/education', access: 'Private', desc: 'Add academic education subdocument' },
      { method: 'DELETE', path: '/api/profile/education/:edu_id', access: 'Private', desc: 'Delete education entry by subdoc ID' },
      { method: 'GET', path: '/api/profile/github/:username', access: 'Public', desc: 'Fetch top 5 public repositories from GitHub API' },
      { method: 'POST', path: '/api/posts', access: 'Private', desc: 'Publish discussion post to feed' },
      { method: 'GET', path: '/api/posts', access: 'Private', desc: 'Fetch chronological feed sorted by date descending' },
      { method: 'PUT', path: '/api/posts/like/:id', access: 'Private', desc: 'Idempotently like a post' },
      { method: 'PUT', path: '/api/posts/unlike/:id', access: 'Private', desc: 'Retract like from a post' },
      { method: 'POST', path: '/api/posts/comment/:id', access: 'Private', desc: 'Append comment to post discussion thread' },
      { method: 'DELETE', path: '/api/posts/comment/:id/:comment_id', access: 'Private', desc: 'Remove comment (author authorized)' },
      { method: 'DELETE', path: '/api/posts/:id', access: 'Private', desc: 'Delete post (author authorized)' },
      { method: 'DELETE', path: '/api/profile', access: 'Private', desc: 'Cascading purge of account, profile, and posts' }
    ]
  },
  erd: {
    entities: [
      {
        id: 'ent_1',
        name: 'USER',
        description: 'Authentication identity and login record',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'name', type: 'String', key: '' },
          { name: 'email', type: 'String', key: 'UK' },
          { name: 'password', type: 'String (Bcrypt)', key: '' },
          { name: 'avatar', type: 'String (URL)', key: '' },
          { name: 'date', type: 'Date', key: '' }
        ]
      },
      {
        id: 'ent_2',
        name: 'PROFILE',
        description: 'Developer career profile and resume metadata',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'user', type: 'ObjectId', key: 'FK' },
          { name: 'status', type: 'String', key: '' },
          { name: 'skills', type: 'Array<String>', key: '' },
          { name: 'company', type: 'String', key: '' },
          { name: 'website', type: 'String', key: '' },
          { name: 'githubusername', type: 'String', key: '' }
        ]
      },
      {
        id: 'ent_3',
        name: 'EXPERIENCE',
        description: 'Embedded career position subdocument',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'title', type: 'String', key: '' },
          { name: 'company', type: 'String', key: '' },
          { name: 'from', type: 'Date', key: '' },
          { name: 'to', type: 'Date', key: '' },
          { name: 'current', type: 'Boolean', key: '' }
        ]
      },
      {
        id: 'ent_4',
        name: 'POST',
        description: 'Community feed discussion post',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'user', type: 'ObjectId', key: 'FK' },
          { name: 'text', type: 'String', key: '' },
          { name: 'name', type: 'String', key: '' },
          { name: 'avatar', type: 'String', key: '' },
          { name: 'date', type: 'Date', key: '' }
        ]
      },
      {
        id: 'ent_5',
        name: 'COMMENT',
        description: 'Embedded comment inside post thread',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'user', type: 'ObjectId', key: 'FK' },
          { name: 'text', type: 'String', key: '' },
          { name: 'date', type: 'Date', key: '' }
        ]
      },
      {
        id: 'ent_6',
        name: 'LIKE',
        description: 'Embedded reaction subdocument inside post',
        fields: [
          { name: '_id', type: 'ObjectId', key: 'PK' },
          { name: 'user', type: 'ObjectId', key: 'FK' }
        ]
      }
    ],
    mermaidSyntax: `erDiagram
    USER ||--o| PROFILE : "has"
    USER ||--o{ POST : "authors"
    USER ||--o{ COMMENT : "submits"
    USER ||--o{ LIKE : "casts"
    PROFILE ||--o{ EXPERIENCE : "contains"
    POST ||--o{ LIKE : "receives"
    POST ||--o{ COMMENT : "accumulates"

    USER {
        ObjectId _id PK
        String name
        String email UK
        String password
        String avatar
        Date date
    }
    PROFILE {
        ObjectId _id PK
        ObjectId user FK
        String status
        Array_String skills
        String company
        String githubusername
    }
    EXPERIENCE {
        ObjectId _id PK
        String title
        String company
        Date from
        Boolean current
    }
    POST {
        ObjectId _id PK
        ObjectId user FK
        String text
        String name
        Date date
    }
    LIKE {
        ObjectId _id PK
        ObjectId user FK
    }
    COMMENT {
        ObjectId _id PK
        ObjectId user FK
        String text
        Date date
    }`
  },
  diagrams: {
    dfdLevel0: `graph TD
    Developer([Developer Client])
    GitHubAPI([External GitHub REST API])
    Gravatar([Gravatar CDN])
    
    subgraph DevConnector System Boundary
        CoreEngine[DevConnector Application Engine<br/>Express API & React SPA]
    end

    Developer -->|Credentials & Posts| CoreEngine
    CoreEngine -->|JWT & Feed Streams| Developer
    CoreEngine -->|Email MD5 Hash| Gravatar
    Gravatar -->|Avatar URL| CoreEngine
    CoreEngine -->|GitHub Handle| GitHubAPI
    GitHubAPI -->|Repo JSON| CoreEngine`,
    dfdLevel1: `graph TD
    Client([Developer Client])
    D1[(Users Store)]
    D2[(Profiles Store)]
    D3[(Posts Store)]
    GitHub([GitHub API])

    P1[1.0 Auth & Identity]
    P2[2.0 Profile Management]
    P3[3.0 Social Feed Engine]
    P4[4.0 GitHub Ingestion]

    Client -->|Credentials| P1
    P1 -->|Write/Read| D1
    P1 -->|JWT Token| Client
    Client -->|Profile Data| P2
    P2 -->|Write/Read| D2
    P2 -->|Fetch Repos| P4
    P4 -->|HTTP GET| GitHub
    GitHub -->|Repo Data| P4
    P4 -->|Hydrated Profile| Client
    Client -->|Posts & Likes| P3
    P3 -->|Mutate Feed| D3
    D3 -->|Stream Feed| Client`,
    classDiagram: `classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +save() Promise
    }
    class Profile {
        +ObjectId _id
        +ObjectId user
        +String status
        +Array~String~ skills
        +save() Promise
    }
    class Post {
        +ObjectId _id
        +ObjectId user
        +String text
        +Array~Like~ likes
        +Array~Comment~ comments
        +save() Promise
    }
    User "1" <-- "0..1" Profile : references
    User "1" <-- "0..*" Post : authors`,
    sequenceAuth: `sequenceDiagram
    autonumber
    actor Dev as Developer
    participant UI as React Form
    participant API as Express API (/api/users)
    participant Bcrypt as Bcrypt Engine
    participant DB as MongoDB (users)
    participant JWT as JWT Engine

    Dev->>UI: Submit Name, Email, Password
    UI->>API: POST /api/users
    API->>DB: User.findOne({ email })
    alt Email taken
        DB-->>API: User exists
        API-->>UI: 400 Bad Request
    else Email free
        DB-->>API: null
        API->>Bcrypt: hash(password, salt)
        Bcrypt-->>API: hashedPassword
        API->>DB: new User().save()
        DB-->>API: Saved User (_id)
        API->>JWT: sign({ user: { id } }, secret)
        JWT-->>API: Token
        API-->>UI: 200 OK { token }
        UI->>Dev: Redirect /dashboard
    end`
  },
  stories: [
    { id: 'US-AUTH-01', title: 'Developer Registration', epic: 'AUTH', points: 5, priority: 'Must', status: 'Done', statement: 'As a new software developer, I want to create an account with my name, email, and password, so that I can establish an authenticated identity.' },
    { id: 'US-AUTH-02', title: 'Developer Login', epic: 'AUTH', points: 3, priority: 'Must', status: 'Done', statement: 'As a registered developer, I want to log in with email and password, so that I can securely access my private dashboard.' },
    { id: 'US-AUTH-03', title: 'Persistent Session Load', epic: 'AUTH', points: 2, priority: 'Must', status: 'Done', statement: 'As an authenticated developer, I want my session to remain active upon browser refresh.' },
    { id: 'US-AUTH-04', title: 'User Logout', epic: 'AUTH', points: 1, priority: 'Must', status: 'Done', statement: 'As an authenticated developer, I want to log out to terminate my active session.' },
    { id: 'US-AUTH-05', title: 'Private Route Protection', epic: 'AUTH', points: 2, priority: 'Must', status: 'Done', statement: 'As a system administrator, I want unauthenticated users redirected to /login.' },
    { id: 'US-AUTH-06', title: 'Form Validation Alerts', epic: 'AUTH', points: 2, priority: 'Must', status: 'Done', statement: 'As a user, I want clear alert banners when validation rules fail.' },
    { id: 'US-PROF-01', title: 'View Current Profile', epic: 'PROF', points: 2, priority: 'Must', status: 'Done', statement: 'As an authenticated developer, I want to view my dashboard portfolio summary.' },
    { id: 'US-PROF-02', title: 'Create Developer Profile', epic: 'PROF', points: 3, priority: 'Must', status: 'Done', statement: 'As a developer, I want to create my profile with skills, status, and bio.' },
    { id: 'US-PROF-03', title: 'Edit Developer Profile', epic: 'PROF', points: 2, priority: 'Must', status: 'Done', statement: 'As a developer, I want to update my existing portfolio fields.' },
    { id: 'US-PROF-04', title: 'Add Experience', epic: 'PROF', points: 3, priority: 'Must', status: 'Done', statement: 'As a developer, I want to add job experience entries to my profile.' },
    { id: 'US-PROF-05', title: 'Delete Experience', epic: 'PROF', points: 2, priority: 'Should', status: 'Done', statement: 'As a developer, I want to delete obsolete experience entries.' },
    { id: 'US-PROF-06', title: 'Add Education', epic: 'PROF', points: 3, priority: 'Must', status: 'Done', statement: 'As a developer, I want to add university degrees and certifications.' },
    { id: 'US-PROF-07', title: 'Delete Education', epic: 'PROF', points: 2, priority: 'Should', status: 'Done', statement: 'As a developer, I want to delete outdated education credentials.' },
    { id: 'US-PROF-08', title: 'Browse Developer Directory', epic: 'PROF', points: 2, priority: 'Must', status: 'Done', statement: 'As a visitor, I want to browse all developer profiles in the community.' },
    { id: 'US-PROF-09', title: 'Public Profile & GitHub Repos', epic: 'PROF', points: 5, priority: 'Must', status: 'Done', statement: 'As a visitor, I want to inspect a developer profile and see their top 5 GitHub repos.' },
    { id: 'US-POST-01', title: 'Create Discussion Post', epic: 'POST', points: 3, priority: 'Must', status: 'Done', statement: 'As an authenticated developer, I want to publish a post to the feed.' },
    { id: 'US-POST-02', title: 'View Chronological Feed', epic: 'POST', points: 2, priority: 'Must', status: 'Done', statement: 'As a developer, I want to read posts in reverse chronological order.' },
    { id: 'US-POST-03', title: 'View Post Discussion Thread', epic: 'POST', points: 2, priority: 'Must', status: 'Done', statement: 'As a developer, I want to view a single post and all its comments.' },
    { id: 'US-POST-04', title: 'Author Deletes Own Post', epic: 'POST', points: 3, priority: 'Must', status: 'Done', statement: 'As a post author, I want to delete my own post from the feed.' },
    { id: 'US-POST-05', title: 'Prevent Non-Author Post Delete', epic: 'POST', points: 2, priority: 'Must', status: 'Done', statement: 'As a defender, I want unauthorized deletion attempts rejected with 401.' },
    { id: 'US-POST-06', title: 'Idempotent Post Like', epic: 'POST', points: 3, priority: 'Must', status: 'Done', statement: 'As a developer, I want to like a post at most once.' },
    { id: 'US-POST-07', title: 'Unlike Post', epic: 'POST', points: 2, priority: 'Must', status: 'Done', statement: 'As a developer who liked a post, I want to remove my like.' },
    { id: 'US-POST-08', title: 'Add Comment to Post', epic: 'POST', points: 3, priority: 'Must', status: 'Done', statement: 'As an authenticated developer, I want to comment on a discussion post.' },
    { id: 'US-POST-09', title: 'Author Deletes Comment', epic: 'POST', points: 3, priority: 'Must', status: 'Done', statement: 'As a comment author, I want to remove my comment from a thread.' },
    { id: 'US-SYS-01', title: 'Cascading Account Deletion', epic: 'SYS', points: 8, priority: 'Must', status: 'Done', statement: 'As a user, I want to delete my account and purge all posts, profile, and credentials.' },
    { id: 'US-SYS-02', title: 'Defensive ObjectId Catching', epic: 'SYS', points: 2, priority: 'Should', status: 'Done', statement: 'As a developer, I want malformed ObjectId requests caught and returned as 404.' }
  ],
  roadmap: [
    { id: 'r1', horizon: 'Horizon 1 (0-3 Months)', title: 'Cursor-Based Pagination', status: 'Planned', impact: 'High', desc: 'Eliminate unbounded Post.find() queries using keyset pagination with cursor and limit.' },
    { id: 'r2', horizon: 'Horizon 1 (0-3 Months)', title: 'Dual-Token Refresh Architecture', status: 'Planned', impact: 'High', desc: 'Implement 15-minute access tokens + rotated HttpOnly refresh tokens in Redis.' },
    { id: 'r3', horizon: 'Horizon 1 (0-3 Months)', title: 'Cloudinary / AWS S3 Media Uploads', status: 'Planned', impact: 'Medium', desc: 'Allow custom avatar and image uploads instead of Gravatar-only derivation.' },
    { id: 'r4', horizon: 'Horizon 2 (3-6 Months)', title: 'Socket.io Real-Time Notifications', status: 'Planned', impact: 'High', desc: 'Instant push notifications for likes, comments, and mentions over WebSockets.' },
    { id: 'r5', horizon: 'Horizon 2 (3-6 Months)', title: 'Redis Cache for Profile & GitHub APIs', status: 'Planned', impact: 'High', desc: 'Cache GitHub repository responses and developer profiles with TTL.' },
    { id: 'r6', horizon: 'Horizon 3 (6-12 Months)', title: 'Microservices Fleet & Kafka Event Bus', status: 'Planned', impact: 'Critical', desc: 'Decompose monolith into Auth, Profile, Feed, and Chat microservices.' }
  ]
};

export const ecommerceTemplate = {
  id: 'ecommerce',
  name: 'NexusMarket - E-Commerce & Multi-Vendor Marketplace',
  version: '1.0.0',
  description: 'Enterprise multi-vendor e-commerce platform supporting product catalog, cart, payments via Stripe, and order tracking.',
  targetStack: {
    frontend: 'React 18, Redux Toolkit, TailwindCSS / CSS System',
    backend: 'Node.js, Express, Stripe SDK, BullMQ Queue',
    database: 'PostgreSQL / Prisma ORM, Redis Cache',
    external: 'Stripe Payments, AWS S3 Assets, SendGrid Email'
  },
  architecture: {
    businessLayer: [
      { id: 'b1', title: 'Inventory Reservation & Atomic Locks', desc: 'Cart items temporarily reserve inventory during checkout session with 15-minute TTL.' },
      { id: 'b2', title: 'Payment Webhook Reconciler', desc: 'Stripe webhook listener idempotently verifies charge.succeeded and transitions order to Paid.' },
      { id: 'b3', title: 'Vendor Commission Partitioning', desc: 'Platform fee percentage automatically deducted before vendor payout distribution.' }
    ],
    dataLayer: [
      { collection: 'users', type: 'Table', count: '1:N with orders', index: 'email (Unique)' },
      { collection: 'products', type: 'Table', count: '1:N with order_items', index: 'sku (Unique), category_id' },
      { collection: 'orders', type: 'Table', count: '1:N with order_items', index: 'user_id, status' }
    ],
    functionalLayer: [
      { method: 'GET', path: '/api/products', access: 'Public', desc: 'List active catalog products with filtering' },
      { method: 'POST', path: '/api/cart', access: 'Public / Guest', desc: 'Add product item to cart session' },
      { method: 'POST', path: '/api/checkout', access: 'Private', desc: 'Initialize Stripe payment intent session' },
      { method: 'GET', path: '/api/orders/my-orders', access: 'Private', desc: 'List customer past order history' }
    ]
  },
  erd: {
    entities: [
      {
        id: 'ent_ec1',
        name: 'CUSTOMER',
        description: 'Store registered customer',
        fields: [
          { name: 'id', type: 'UUID', key: 'PK' },
          { name: 'email', type: 'String', key: 'UK' },
          { name: 'full_name', type: 'String', key: '' }
        ]
      },
      {
        id: 'ent_ec2',
        name: 'PRODUCT',
        description: 'Catalog item available for sale',
        fields: [
          { name: 'id', type: 'UUID', key: 'PK' },
          { name: 'title', type: 'String', key: '' },
          { name: 'price_cents', type: 'Integer', key: '' },
          { name: 'stock_quantity', type: 'Integer', key: '' }
        ]
      },
      {
        id: 'ent_ec3',
        name: 'ORDER',
        description: 'Placed checkout order',
        fields: [
          { name: 'id', type: 'UUID', key: 'PK' },
          { name: 'customer_id', type: 'UUID', key: 'FK' },
          { name: 'total_cents', type: 'Integer', key: '' },
          { name: 'status', type: 'Enum (PENDING, PAID, SHIPPED)', key: '' }
        ]
      }
    ],
    mermaidSyntax: `erDiagram
    CUSTOMER ||--o{ ORDER : "places"
    ORDER ||--o{ ORDER_ITEM : "contains"
    PRODUCT ||--o{ ORDER_ITEM : "specifies"

    CUSTOMER {
        UUID id PK
        String email UK
        String full_name
    }
    ORDER {
        UUID id PK
        UUID customer_id FK
        Integer total_cents
        String status
    }
    PRODUCT {
        UUID id PK
        String title
        Integer price_cents
        Integer stock_quantity
    }`
  },
  diagrams: {
    dfdLevel0: `graph TD
    Shopper([Online Shopper])
    Stripe([Stripe Payment Gateway])
    Warehouse([Warehouse Logistics])

    subgraph NexusMarket System
        CoreStore[E-Commerce Platform Core]
    end

    Shopper -->|Cart Items & Checkout| CoreStore
    CoreStore -->|Order Receipt| Shopper
    CoreStore -->|Payment Intent Token| Stripe
    Stripe -->|charge.succeeded Webhook| CoreStore
    CoreStore -->|Fulfillment Manifest| Warehouse`,
    dfdLevel1: `graph TD
    Client([Shopper])
    D1[(Users DB)]
    D2[(Catalog DB)]
    D3[(Orders DB)]

    P1[Catalog & Search Service]
    P2[Cart & Pricing Service]
    P3[Checkout & Stripe Service]

    Client -->|Browse Products| P1
    P1 -->|Query| D2
    Client -->|Add Item| P2
    P2 -->|Validate Stock| D2
    Client -->|Pay| P3
    P3 -->|Write Order| D3`,
    classDiagram: `classDiagram
    class Customer {
        +UUID id
        +String email
        +placeOrder()
    }
    class Product {
        +UUID id
        +String title
        +Integer priceCents
        +reserveStock(qty)
    }
    class Order {
        +UUID id
        +UUID customerId
        +String status
        +markPaid()
    }
    Customer "1" <-- "0..*" Order : places`,
    sequenceAuth: `sequenceDiagram
    actor Shopper
    participant Web as Web Client
    participant API as Checkout API
    participant Stripe as Stripe Gateway
    participant DB as Postgres Orders

    Shopper->>Web: Click "Pay $99"
    Web->>API: POST /api/checkout
    API->>Stripe: createPaymentIntent(9900)
    Stripe-->>API: client_secret
    API-->>Web: client_secret
    Web->>Stripe: confirmCardPayment()
    Stripe-->>API: Webhook (charge.succeeded)
    API->>DB: UPDATE orders SET status = 'PAID'`
  },
  stories: [
    { id: 'US-EC-01', title: 'Product Catalog Browsing', epic: 'CATALOG', points: 3, priority: 'Must', status: 'Done', statement: 'As a shopper, I want to browse products by category with price filters.' },
    { id: 'US-EC-02', title: 'Shopping Cart Management', epic: 'CART', points: 3, priority: 'Must', status: 'Done', statement: 'As a shopper, I want to add items to my cart and update quantities.' },
    { id: 'US-EC-03', title: 'Stripe Card Checkout', epic: 'PAY', points: 5, priority: 'Must', status: 'Done', statement: 'As a buyer, I want to pay securely via credit card using Stripe.' },
    { id: 'US-EC-04', title: 'Order History & Invoices', epic: 'ORDER', points: 2, priority: 'Should', status: 'Done', statement: 'As a customer, I want to review my past orders and download receipts.' }
  ],
  roadmap: [
    { id: 'ec_r1', horizon: 'Horizon 1 (0-3 Months)', title: 'Apple Pay & Google Pay Express Checkout', status: 'Planned', impact: 'High', desc: 'Integrate one-click mobile checkout.' },
    { id: 'ec_r2', horizon: 'Horizon 2 (3-6 Months)', title: 'Automated Multi-Carrier Shipping Tracking', status: 'Planned', impact: 'Medium', desc: 'Live tracking webhook sync with FedEx/UPS.' }
  ]
};

export const blankTemplate = {
  id: 'blank',
  name: 'New Custom Application Specification',
  version: '1.0.0',
  description: 'Clean architectural canvas ready to plan any web application, API, mobile app, or distributed system.',
  targetStack: {
    frontend: 'Custom Frontend (e.g. React, Vue, Mobile)',
    backend: 'Custom Backend (e.g. Node.js, Python, Go, Java)',
    database: 'Custom Database (e.g. PostgreSQL, MongoDB, Redis)',
    external: 'Third-party APIs & Cloud Services'
  },
  architecture: {
    businessLayer: [
      { id: 'b1', title: 'Core Business Domain Rule', desc: 'Specify your domain entity constraints, permissions, and invariants.' }
    ],
    dataLayer: [
      { collection: 'primary_entities', type: 'Table / Collection', count: '1:N', index: 'id (PK)' }
    ],
    functionalLayer: [
      { method: 'GET', path: '/api/v1/health', access: 'Public', desc: 'Health check diagnostic endpoint' }
    ]
  },
  erd: {
    entities: [
      {
        id: 'ent_custom1',
        name: 'ENTITY_ONE',
        description: 'Core domain entity',
        fields: [
          { name: 'id', type: 'UUID / ObjectId', key: 'PK' },
          { name: 'created_at', type: 'Timestamp', key: '' }
        ]
      }
    ],
    mermaidSyntax: `erDiagram
    ENTITY_ONE ||--o{ ENTITY_TWO : "relates_to"

    ENTITY_ONE {
        UUID id PK
        String name
        Timestamp created_at
    }
    ENTITY_TWO {
        UUID id PK
        UUID entity_one_id FK
        String detail
    }`
  },
  diagrams: {
    dfdLevel0: `graph TD
    User([User Client])
    subgraph System Boundary
        App[Custom Application]
    end
    User -->|Inputs| App
    App -->|Results| User`,
    dfdLevel1: `graph TD
    Client([Client])
    P1[Process 1.0]
    D1[(Database)]
    Client --> P1
    P1 --> D1`,
    classDiagram: `classDiagram
    class DomainModel {
        +UUID id
        +executeAction()
    }`,
    sequenceAuth: `sequenceDiagram
    actor Client
    participant Server
    Client->>Server: Request
    Server-->>Client: Response`
  },
  stories: [
    { id: 'US-001', title: 'System Inception Spike', epic: 'CORE', points: 3, priority: 'Must', status: 'To Do', statement: 'As an architect, I want to define core system boundaries.' }
  ],
  roadmap: [
    { id: 'r_blank1', horizon: 'Horizon 1 (0-3 Months)', title: 'MVP Baseline Launch', status: 'Planned', impact: 'Critical', desc: 'Implement core foundational use cases.' }
  ]
};
