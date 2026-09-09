# SDLC Planning Artifact 03: System Flows & Behavioral Modeling

## Executive Summary
This document provides the formal behavioral and structural flow models for the **DevConnector** platform, including:
1. **Data Flow Diagrams (DFD)**: Level 0 (Context), Level 1 (Functional Decomposition), and Level 2 (Detailed Process Flow).
2. **UML Class Diagram & Object State Flow**: Structural relationships between Mongoose models, Express middleware/controllers, and Redux client stores.
3. **Event Sequence Diagrams**: Chronological interaction lifecycles for critical workflows (Registration & Auth, Profile & GitHub integration, Post Lifecycle with Like/Unlike, and Comment Moderation).

---

## 1. Data Flow Diagrams (DFD)

### 1.1 DFD Level 0: Context Diagram
The Level 0 Context Diagram identifies the system boundary, external human and technical entities, and the primary data flows entering and leaving the DevConnector boundary:

```mermaid
graph TD
    Developer([Developer / Client Browser])
    GitHubAPI([External GitHub REST API])
    Gravatar([External Gravatar Service])
    
    subgraph DevConnector System Boundary
        CoreEngine[DevConnector Application Engine<br/>Express API & React SPA]
    end

    Developer -->|Credentials / Registration| CoreEngine
    Developer -->|Profile, Experience, Education Data| CoreEngine
    Developer -->|Posts, Likes, Comments| CoreEngine
    CoreEngine -->|JWT Bearer Token| Developer
    CoreEngine -->|Aggregated Feed, Profiles, Repos| Developer

    CoreEngine -->|Email Hash Query| Gravatar
    Gravatar -->|Avatar Image URL| CoreEngine

    CoreEngine -->|OAuth / Client ID Repo Query| GitHubAPI
    GitHubAPI -->|Repository Metrics & Commits JSON| CoreEngine
```

### 1.2 DFD Level 1: Functional Decomposition
The Level 1 DFD decomposes the core engine into four functional subsystems interacting with discrete datastores:

```mermaid
graph TD
    Client([Developer Client])

    subgraph Data Stores
        D1[(D1: Users Store)]
        D2[(D2: Profiles Store)]
        D3[(D3: Posts Store)]
    end

    subgraph Process 1.0: Authentication & Identity
        P1[1.0 User Registration & Session Auth]
    end

    subgraph Process 2.0: Profile & Career Management
        P2[2.0 Profile & Resume Management]
    end

    subgraph Process 3.0: Social Feed & Community
        P3[3.0 Post, Like & Comment Processing]
    end

    subgraph Process 4.0: External Service Integration
        P4[4.0 GitHub Repository Ingestion]
    end

    GitHub([GitHub API])

    Client -->|1.1 Credentials| P1
    P1 -->|1.2 Write User Record| D1
    P1 -->|1.3 Query User Credentials| D1
    P1 -->|1.4 Signed JWT| Client

    Client -->|2.1 Profile Details / Token| P2
    P2 -->|2.2 Validate Token / Get User| D1
    P2 -->|2.3 Read / Update Profile| D2
    P2 -->|2.4 Return Profile Data| Client

    P2 -->|4.1 GitHub Handle| P4
    P4 -->|4.2 GET /users/:username/repos| GitHub
    GitHub -->|4.3 Repo JSON List| P4
    P4 -->|4.4 Hydrated Repos| Client

    Client -->|3.1 Post Text / Like / Comment| P3
    P3 -->|3.2 Validate User| D1
    P3 -->|3.3 Mutate Post / Likes / Comments| D3
    D3 -->|3.4 Stream Chronological Feed| P3
    P3 -->|3.5 Return Post State| Client
```

### 1.3 DFD Level 2: Detailed Process (Post Interaction & Social Moderation)

```mermaid
graph TD
    Developer([Authenticated Developer])
    subgraph Process 3.0 Sub-Processes
        P3_1[3.1 Verify JWT & Extract User ID]
        P3_2[3.2 Validate Post Text Length]
        P3_3[3.3 Query Author Name & Avatar]
        P3_4[3.4 Persist New Post Document]
        P3_5[3.5 Check Like Idempotency]
        P3_6[3.6 Update Like Array]
        P3_7[3.7 Verify Post/Comment Author Ownership]
        P3_8[3.8 Remove Post/Comment Subdoc]
    end
    
    UsersDB[(Users Store)]
    PostsDB[(Posts Store)]

    Developer -->|Action Request| P3_1
    P3_1 -->|Valid Token| P3_2
    P3_2 -->|Valid Text| P3_3
    P3_3 -->|Fetch User Profile Details| UsersDB
    P3_3 -->|Hydrated Post Object| P3_4
    P3_4 -->|Save Post| PostsDB

    Developer -->|Like / Unlike Request| P3_5
    P3_5 -->|Inspect Likes Array| PostsDB
    P3_5 -->|Toggle Like State| P3_6
    P3_6 -->|Save Likes| PostsDB

    Developer -->|Delete Request| P3_7
    P3_7 -->|Compare post.user === req.user.id| PostsDB
    P3_7 -->|Authorized| P3_8
    P3_8 -->|Execute Deletion| PostsDB
```

---

## 2. UML Class Diagram & Object Architecture

The structural architecture bridges the backend Mongoose Models and Express controllers with the frontend React components and Redux State Store:

```mermaid
classDiagram
    direction TB

    class User {
        +ObjectId _id
        +String name
        +String email
        +String password
        +String avatar
        +Date date
        +save() Promise
        +static findOne(query) Promise
        +static findById(id) Promise
    }

    class Profile {
        +ObjectId _id
        +ObjectId user
        +String company
        +String website
        +String location
        +String status
        +Array~String~ skills
        +String bio
        +String githubusername
        +Array~Experience~ experience
        +Array~Education~ education
        +SocialLinks social
        +Date date
        +save() Promise
        +static findOne(query) Promise
        +static findOneAndUpdate(query, update, opts) Promise
    }

    class Experience {
        +ObjectId _id
        +String title
        +String company
        +String location
        +Date from
        +Date to
        +Boolean current
        +String description
    }

    class Education {
        +ObjectId _id
        +String school
        +String degree
        +String fieldofstudy
        +Date from
        +Date to
        +Boolean current
        +String description
    }

    class Post {
        +ObjectId _id
        +ObjectId user
        +String text
        +String name
        +String avatar
        +Array~Like~ likes
        +Array~Comment~ comments
        +Date date
        +save() Promise
        +static find(query) Promise
        +static findById(id) Promise
        +deleteOne() Promise
    }

    class Like {
        +ObjectId _id
        +ObjectId user
    }

    class Comment {
        +ObjectId _id
        +ObjectId user
        +String text
        +String name
        +String avatar
        +Date date
    }

    class AuthMiddleware {
        +verifyToken(req, res, next)
    }

    class ReduxStore {
        +authState: AuthState
        +profileState: ProfileState
        +postState: PostState
        +alertState: Array~Alert~
        +dispatch(action)
        +getState()
    }

    User "1" <-- "0..1" Profile : references
    Profile *-- "0..*" Experience : embeds
    Profile *-- "0..*" Education : embeds
    User "1" <-- "0..*" Post : authors
    Post *-- "0..*" Like : embeds
    Post *-- "0..*" Comment : embeds
    Like ..> User : references
    Comment ..> User : references

    AuthMiddleware ..> User : validates token payload
    ReduxStore ..> Post : manages cached feed
    ReduxStore ..> Profile : manages cached profile
```

### 2.1 Post Object State Flow

```mermaid
stateDiagram-v2
    [*] --> Draft : Author inputs text in UI
    Draft --> Published : POST /api/posts (Validation Passed)
    
    state Published {
        [*] --> Neutral
        Neutral --> Liked : PUT /like/:id
        Liked --> Neutral : PUT /unlike/:id
        Neutral --> Commented : POST /comment/:id
        Commented --> Commented : POST /comment/:id (Add another)
        Commented --> Neutral : DELETE /comment/:id/:c_id (All removed)
    }

    Published --> Deleted : DELETE /api/posts/:id (Author verified)
    Deleted --> [*]
```

---

## 3. Event Sequence Diagrams

### 3.1 Flow 1: User Registration & JWT Issuance

```mermaid
sequenceDiagram
    autonumber
    actor User as Developer
    participant UI as React Registration Form
    participant Redux as Redux Thunk (register)
    participant API as Express API (/api/users)
    participant Gravatar as Gravatar CDN
    participant Bcrypt as Bcrypt Engine
    participant MongoDB as MongoDB (users)
    participant JWT as JWT Engine

    User->>UI: Fills Name, Email, Password & Submits
    UI->>Redux: dispatch(register({ name, email, password }))
    Redux->>API: HTTP POST /api/users
    API->>API: Run express-validator (format, length)
    alt Validation Failure
        API-->>Redux: 400 Bad Request [{ msg: "..." }]
        Redux-->>UI: dispatch(SET_ALERT) -> Display error banner
    else Validation Passed
        API->>MongoDB: User.findOne({ email })
        alt Email Exists
            MongoDB-->>API: User Document Found
            API-->>Redux: 400 Bad Request { msg: "User already exists" }
            Redux-->>UI: dispatch(SET_ALERT)
        else Email is Unique
            MongoDB-->>API: null
            API->>Gravatar: gravatar.url(email, options)
            Gravatar-->>API: Avatar CDN URL string
            API->>Bcrypt: genSalt(10) -> hash(password, salt)
            Bcrypt-->>API: hashedPassword
            API->>MongoDB: new User({ name, email, avatar, password: hashedPassword }).save()
            MongoDB-->>API: Persisted User Document (_id)
            API->>JWT: sign({ user: { id: user._id } }, secret, { expiresIn: 360000 })
            JWT-->>API: signedToken
            API-->>Redux: 200 OK { token }
            Redux->>Redux: localStorage.setItem('token', token)
            Redux->>Redux: dispatch({ type: REGISTER_SUCCESS, payload: { token } })
            Redux->>UI: Redirect to Dashboard (/dashboard)
        end
    end
```

### 3.2 Flow 2: Profile Creation / Update & GitHub Ingestion

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant UI as Profile Form Component
    participant Redux as Redux Thunk (createProfile)
    participant API as Express API (/api/profile)
    participant AuthMW as auth.js Middleware
    participant MongoDB as MongoDB (profiles)
    participant GitHub as GitHub API v3

    Dev->>UI: Enters Status, Skills, Bio, GitHub Handle & Submits
    UI->>Redux: dispatch(createProfile(formData, history))
    Redux->>API: HTTP POST /api/profile (Header: x-auth-token)
    API->>AuthMW: Verify Token
    AuthMW-->>API: req.user = { id: "user_id" }
    API->>API: Validate Status & Skills present
    API->>MongoDB: Profile.findOne({ user: req.user.id })
    alt Profile Exists
        MongoDB-->>API: Existing Profile Document
        API->>MongoDB: Profile.findOneAndUpdate({ user: req.user.id }, { $set: profileFields })
        MongoDB-->>API: Updated Profile Document
    else Profile Does Not Exist
        MongoDB-->>API: null
        API->>MongoDB: new Profile(profileFields).save()
        MongoDB-->>API: Newly Created Profile
    end
    API-->>Redux: 200 OK (Profile Document)
    Redux->>UI: dispatch({ type: GET_PROFILE, payload: data })

    opt When User Navigates to Public Profile (/profile/:id)
        UI->>Redux: dispatch(getGithubRepos(profile.githubusername))
        Redux->>API: HTTP GET /api/profile/github/:username
        API->>GitHub: GET /users/:username/repos?per_page=5&sort=created:asc
        GitHub-->>API: Top 5 Public Repositories (JSON)
        API-->>Redux: 200 OK [Repo1, Repo2, ...]
        Redux->>UI: Render Live GitHub Repos with stars, forks, watchers
    end
```

### 3.3 Flow 3: Post Creation, Like/Unlike, and Owner Deletion

```mermaid
sequenceDiagram
    autonumber
    actor DevA as Developer (Author)
    actor DevB as Developer (Peer)
    participant API as Express API (/api/posts)
    participant AuthMW as auth.js
    participant MongoDB as MongoDB (posts)

    DevA->>API: POST /api/posts { text: "Hello Web3 & Node.js" } (Token A)
    API->>AuthMW: Authenticate Token A
    AuthMW-->>API: req.user.id = "user_A"
    API->>MongoDB: new Post({ text, user: "user_A", name, avatar }).save()
    MongoDB-->>API: Saved Post (_id: "post_1", likes: [], comments: [])
    API-->>DevA: 200 OK (Post Object)

    Note over DevB, MongoDB: DevB Likes the Post
    DevB->>API: PUT /api/posts/like/post_1 (Token B)
    API->>AuthMW: Authenticate Token B (req.user.id = "user_B")
    API->>MongoDB: Post.findById("post_1")
    MongoDB-->>API: Post Document
    API->>API: Check if post.likes contains "user_B"
    alt Already Liked
        API-->>DevB: 400 Bad Request { msg: "Post already liked" }
    else Not Yet Liked
        API->>MongoDB: post.likes.unshift({ user: "user_B" }) -> post.save()
        MongoDB-->>API: Updated Likes Array
        API-->>DevB: 200 OK (Updated likes array)
    end

    Note over DevB, MongoDB: Unauthorized Deletion Attempt by DevB
    DevB->>API: DELETE /api/posts/post_1 (Token B)
    API->>MongoDB: Post.findById("post_1")
    MongoDB-->>API: Post Document (post.user = "user_A")
    API->>API: Compare post.user.toString() !== req.user.id ("user_A" !== "user_B")
    API-->>DevB: 401 Unauthorized { msg: "User not authorised" }

    Note over DevA, MongoDB: Authorized Deletion by Original Author DevA
    DevA->>API: DELETE /api/posts/post_1 (Token A)
    API->>MongoDB: Post.findById("post_1")
    MongoDB-->>API: Post Document (post.user = "user_A")
    API->>API: Check post.user === req.user.id ("user_A" === "user_A")
    API->>MongoDB: post.deleteOne()
    MongoDB-->>API: Acknowledged
    API-->>DevA: 200 OK { msg: "Post removed" }
```

### 3.4 Flow 4: Comment Creation & Thread Moderation

```mermaid
sequenceDiagram
    autonumber
    actor Commenter as Comment Author (User C)
    actor PostOwner as Post Author (User A)
    participant API as Express API (/api/posts)
    participant MongoDB as MongoDB (posts)

    Commenter->>API: POST /api/posts/comment/:post_id { text: "Insightful post!" } (Token C)
    API->>MongoDB: Post.findById(post_id)
    MongoDB-->>API: Post Document
    API->>MongoDB: post.comments.unshift({ user: "user_C", text, name, avatar }) -> post.save()
    MongoDB-->>API: Saved Post with New Comment (comment_id: "c_1")
    API-->>Commenter: 200 OK (Updated Comments Array)

    Note over PostOwner, API: Post Owner or Another User Attempts to Delete Comment C
    PostOwner->>API: DELETE /api/posts/comment/:post_id/c_1 (Token A)
    API->>MongoDB: Post.findById(post_id)
    MongoDB-->>API: Post Document
    API->>API: Find comment with id === "c_1"
    API->>API: Compare comment.user.toString() !== req.user.id ("user_C" !== "user_A")
    API-->>PostOwner: 401 Unauthorized { msg: "User not authorised" }

    Note over Commenter, API: Comment Owner (User C) Deletes Their Own Comment
    Commenter->>API: DELETE /api/posts/comment/:post_id/c_1 (Token C)
    API->>MongoDB: Post.findById(post_id)
    MongoDB-->>API: Post Document
    API->>API: comment.user.toString() === req.user.id ("user_C" === "user_C")
    API->>MongoDB: post.comments.splice(commentIndex, 1) -> post.save()
    MongoDB-->>API: Updated Comments Array
    API-->>Commenter: 200 OK (Updated Comments Array)
```
