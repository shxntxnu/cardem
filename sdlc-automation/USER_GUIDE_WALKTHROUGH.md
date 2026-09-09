# Autonomous SDLC System: Comprehensive User Walkthrough & Operations Guide
## How to Automate the Entire SDLC Planning Stage from a Conversational Idea

---

## 1. What is the Automated SDLC System?

The **Autonomous SDLC Inception Engine (ASIE)** is an executable software system located in [`sdlc-automation/`](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-automation/). It programmatically automates the entire planning and inception phase of the Software Development Life Cycle.

Given an informal conversational prompt (e.g., *"Build an on-demand suburban grocery drone delivery service called SkyCart"*), it deterministically synthesizes:
1. **Multi-Tier Layered Architecture** (Business invariants, Data Layer storage, and Functional REST contracts).
2. **Entity-Relationship Model (ERD) & Data Dictionary** (Crow's Foot Mermaid syntax, field types, and keys).
3. **Behavioral Flows & Structural UML** (DFD Level 0/1, UML Class diagram, and Event Sequence diagrams).
4. **Agile Backlog with Fibonacci Story Points** (Categorized Epics, MoSCoW priorities, and Gherkin acceptance criteria).
5. **Strategic Roadmap & Technical Debt** (Horizons 1, 2, and 3 scaling matrix).
6. **PlanCraft JSON Blueprint** for instant visual exploration inside the [PlanCraft SDLC Studio](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-planner/index.html).

---

## 2. Configuration & Changes Required to Run from a Prompt

Before generating a system from a prompt, review the following configuration options:

### 2.1 Mode Selection: Offline Zero-Key vs. AI-Powered

| Execution Mode | Requirements | Cost | Output Quality | When to Use |
| :--- | :--- | :---: | :--- | :--- |
| **Offline Heuristic Engine** *(Default)* | None! Runs with zero API keys and no network. | **$0.00** | Structured, complete, and syntactically valid baseline architecture | Quick planning, offline environments, zero-cost prototyping |
| **LLM-Powered Engine** | OpenAI, Gemini, or Anthropic API Key | ~$0.01 - $0.15 | Highly nuanced, bespoke domain semantics and customized business invariants | Production inception, complex domain ontologies |

### 2.2 Adding Your API Key (If Using AI-Powered Mode)

If you wish to use an LLM provider, you only need to make one simple change:

#### Option A: Edit the `.env` File (Recommended)
1. In the `sdlc-automation/` folder, copy `.env.example` to `.env`:
   ```bash
   cd sdlc-automation
   cp .env.example .env
   ```
2. Open `.env` and add your API key:
   ```dotenv
   # Choose ONE of the following:
   OPENAI_API_KEY=sk-proj-yourActualKeyHere
   # OR
   GEMINI_API_KEY=yourGeminiKeyHere
   # OR
   ANTHROPIC_API_KEY=sk-ant-yourAnthropicKeyHere
   ```

#### Option B: Set an Environment Variable in Terminal
```powershell
# Windows PowerShell:
$env:OPENAI_API_KEY = "sk-proj-yourActualKeyHere"

# Or on macOS/Linux:
export OPENAI_API_KEY="sk-proj-yourActualKeyHere"
```

#### Option C: Pass Directly via Command Flag
```bash
node src/cli.js --idea "My App Idea" --llm --key "sk-proj-yourKey"
```

---

## 3. How to Run the Automated SDLC Engine

You have **three convenient ways** to run the system:

### Method 1: Command Line with a Direct Prompt (Fastest)

Run the CLI command from the repository root:
```bash
# General syntax:
node sdlc-automation/src/cli.js --idea "<Your App Idea>" --output <Target_Directory>

# Concrete example:
node sdlc-automation/src/cli.js --idea "Build an on-demand medical courier dispatch app called MedExpress with GPS tracking and cold-chain temperature logs" --output ./my_medexpress_plan
```

### Method 2: Interactive Terminal Wizard

Simply launch the CLI without arguments. The engine will guide you through an interactive question-and-answer prompt:
```bash
node sdlc-automation/src/cli.js
```
1. Type your system idea prompt when prompted.
2. Choose your output folder (or press Enter for default `generated_specs`).
3. Watch the 6 stages execute with live terminal status logs!

### Method 3: Interactive Browser Graphical Runner

Open [`sdlc-automation/src/interactive_runner.html`](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-automation/src/interactive_runner.html) directly in any web browser:
1. Double-click `interactive_runner.html` in Windows Explorer or open it in Chrome/Edge.
2. Select a preset (e.g. *Drone Delivery*, *Smart Parking*, *Camera Gear Rental*) or type your custom idea.
3. Choose **Offline Heuristic Mode** or enter an **OpenAI / Gemini API Key**.
4. Click **"Execute SDLC Inception Pipeline"**.
5. Watch the live progress bars for all 6 stages.
6. Instantly view the generated Markdown specification and download the PlanCraft JSON blueprint!

---

## 4. Visualizing the Generated Plan in PlanCraft SDLC Studio

Every run of the automated engine produces two files in your target output directory:
1. `<project_id>_SDLC_SPECIFICATION.md`: The complete master documentation.
2. `<project_id>_blueprint.json`: The portable data model for interactive exploration.

### How to load into PlanCraft Studio:
1. Open the [PlanCraft SDLC Studio Web App](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-planner/index.html) in your browser.
2. In the top navigation bar, click the **"Import JSON"** button.
3. Select the generated `<project_id>_blueprint.json` file.
4. The entire application instantly updates! You can now:
   - Click **"2. Layered Architecture"** to view and edit the synthesized Business, Data, and Functional layers.
   - Click **"3. ERD & Data Dictionary"** to explore the interactive entity cards and live Mermaid ERD.
   - Click **"4. Flows & UML Diagrams"** to view DFD Level 0, DFD Level 1, Class Diagrams, and Sequence Flows.
   - Click **"5. Agile Stories & Points"** to filter stories by Epic, adjust Fibonacci points, and inspect Gherkin scenarios.
   - Click **"7. Spec Exporter"** to copy or re-export the updated specification!

---

## 5. End-to-End Walkthrough Example

Let's test the complete flow right now:

### Step 1: Execute Inception
Run the command:
```powershell
node sdlc-automation/src/cli.js --idea "Build a real-time smart parking spot reservation app called ParkFlow" --output ./sdlc-automation/test_output
```

### Step 2: Observe Pipeline Output
```text
================================================================
🚀 AUTONOMOUS SDLC INCEPTION ENGINE (ASIE)
🔧 Engine: Offline Heuristic Mode (Zero API Key)
📂 Target Output: D:\Documents\_MyStuff\Projects\fullstack_learning\sdlc-automation\test_output
================================================================

⏳ [1/6] Stage 1: Domain Discovery & Ontology Synthesis...
✅ [1/6] Project Identified: "ParkFlow Platform" (7 actors mapped)
⏳ [2/6] Stage 2: Multi-Tier Layered Architecture Design...
✅ [2/6] Architecture Formulated (4 business rules, 10 REST endpoints)
⏳ [3/6] Stage 3: Data Modeling & Crow's Foot Mermaid ERD...
✅ [3/6] Data Dictionary & ERD Compiled (4 entities)
⏳ [4/6] Stage 4: Behavioral Flows & Structural UML Synthesis...
✅ [4/6] UML Diagrams Synthesized (DFD Level 0/1, Class, Sequence)
⏳ [5/6] Stage 5: Agile User Stories & Fibonacci Sizing...
✅ [5/6] Backlog Generated (8 stories, 32 total story points)
⏳ [6/6] Stage 6: Strategic Roadmap & Technical Debt Forecasting...
✅ [6/6] Roadmap Horizons Established (5 initiatives)
🔍 Running Stage 7: Quality Gate & Consistency Critic Audit...
⭐ Audit Score: 100/100 [PASSED]

================================================================
🎉 INCEPTION COMPLETE! Specification Deliverables Created:
📄 Markdown Spec: D:\Documents\_MyStuff\Projects\fullstack_learning\sdlc-automation\test_output\parkflow_SDLC_SPECIFICATION.md
📦 PlanCraft JSON: D:\Documents\_MyStuff\Projects\fullstack_learning\sdlc-automation\test_output\parkflow_blueprint.json
================================================================
```

### Step 3: Inspect the Generated Deliverables
- Review the generated [test_output/parkflow_SDLC_SPECIFICATION.md](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-automation/test_output/parkflow_SDLC_SPECIFICATION.md).
- Open [PlanCraft Studio](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-planner/index.html) and import [test_output/parkflow_blueprint.json](file:///d:/Documents/_MyStuff/Projects/fullstack_learning/sdlc-automation/test_output/parkflow_blueprint.json) to interact with your newly synthesized system design!
