🚀 Autonomous CI/CD Healing & Docker Security Agent
RIFT 2026 Hackathon — AI/ML • DevOps Automation • Agentic Systems Track

An end-to-end Autonomous DevOps Agent that:

Clones a GitHub repository

Detects CI/CD failures

Automatically fixes issues

Commits changes to a new branch

Iterates until pipeline passes

Scans Docker images for vulnerabilities

Generates a security report

Displays full results in a production-ready React dashboard

🎯 Problem Overview

Modern CI/CD pipelines frequently fail due to:

Linting errors

Missing test scripts

Syntax & runtime issues

Misconfigured workflows

Docker misconfigurations

Vulnerable base images

Developers waste 40–60% of their time debugging these issues.

This project builds a fully autonomous, multi-agent DevOps system that heals pipelines and enhances Docker security without human intervention.

🧠 System Architecture
Multi-Agent Architecture (LangGraph Based)

Each responsibility is handled by a dedicated agent:

Agent	Responsibility
Repo Agent	Clone repo & create branch
Pipeline Agent	Detect and parse CI/CD workflow
Executor Agent	Execute pipeline steps
Analyzer Agent	Detect failure type
Fixer Agent	Apply deterministic fixes
Git Agent	Commit & push fixes
Security Scan Agent	Scan Docker images
Report Agent	Generate security report
Agent Flow
Repo → Pipeline → Execute → Analyze → Fix → Commit
                  ↑______________________________|

If PASSED →
Docker Build → Security Scan → Report Generation

✔ Fully autonomous
✔ Iterative (retry limit configurable)
✔ No hardcoded test cases
✔ Sandboxed execution

🛠 Tech Stack
Backend

Node.js (ES Modules)

Express.js

LangGraph (LangChain)

simple-git

Docker

Trivy (for vulnerability scanning)

js-yaml

Frontend

React (Functional Components + Hooks)

Context API

Responsive dashboard

Deployed (Vercel / Netlify)

📂 Project Structure
backend/
 ├─ src/
 │  ├─ agent/
 │  │  ├─ agents.js
 │  │  ├─ langGraphRunner.js
 │  │  └─ runAgent.js
 │  ├─ services/
 │  │  ├─ git.service.js
 │  │  ├─ pipelineExecutor.service.js
 │  │  ├─ pipelineParser.service.js
 │  │  ├─ failureAnalyzer.service.js
 │  │  ├─ fixer.service.js
 │  │  └─ securityScan.service.js
 │  ├─ routes/
 │  │  └─ agent.routes.js
 │  └─ utils/
 │     └─ branchName.js
 ├─ sandbox/
 ├─ results.json
 └─ server.js

frontend/
 └─ React dashboard
🔄 Core Features
1️⃣ Autonomous CI/CD Healing

The agent:

Clones the repository

Detects .github/workflows

Executes pipeline steps locally

Skips CI-only deployment steps

Detects failure cause

Applies targeted fix

Commits with [AI-AGENT] prefix

Pushes to a new branch

Re-runs pipeline until success

Supported Bug Types
Bug Type	Detection	Fix
LINTING	ESLint / Flake8 output	Auto-fix CLI
CI_CONFIG	Missing scripts	Patch package.json
SYNTAX	Runtime errors	Structured analyzer
IMPORT	Module not found	Dependency patch
TYPE_ERROR	JS runtime	Analyzer-based
2️⃣ Docker Image Vulnerability Scanning

After successful pipeline execution:

Docker image is built

Image is scanned using Trivy

CVEs are extracted

Severity levels classified

Fix suggestions generated

Security report returned to user

🔐 Docker Security Report

Example output:

{
  "image": "local/app:latest",
  "scanTime": "2026-02-20T11:45:12Z",
  "summary": {
    "critical": 1,
    "high": 4,
    "medium": 7,
    "low": 3
  },
  "vulnerabilities": [
    {
      "cve": "CVE-2024-12345",
      "package": "openssl",
      "installedVersion": "1.1.1",
      "fixedVersion": "1.1.1u",
      "severity": "HIGH",
      "recommendedFix": "Upgrade base image or update package"
    }
  ],
  "overallRisk": "HIGH"
}

✔ CVE listing
✔ Severity breakdown
✔ Recommended fixes
✔ Dockerfile improvements

🌱 Branch Naming Rule (MANDATORY)
TEAM_NAME_LEADER_NAME_AI_Fix

Example:

RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix

✔ Uppercase
✔ Underscores only
✔ Ends with _AI_Fix
✔ Never pushes to main

📊 Dashboard Output Structure

Example API response:

{
  "repoUrl": "https://github.com/user/repo",
  "branch": "RIFT_ORGANISERS_SAIYAM_KUMAR_AI_Fix",
  "retryUsed": "2/5",
  "timeline": [
    {
      "iteration": 1,
      "status": "FAILED",
      "timestamp": "2026-02-20T10:21:00Z"
    },
    {
      "iteration": 2,
      "status": "PASSED",
      "timestamp": "2026-02-20T10:21:15Z"
    }
  ],
  "score": {
    "base": 100,
    "speedBonus": 10,
    "efficiencyPenalty": 0,
    "final": 110
  },
  "securitySummary": {
    "critical": 1,
    "high": 4,
    "medium": 7,
    "low": 3
  },
  "status": "PASSED"
}
🏆 Scoring Logic
Component	Rule
Base Score	100
Speed Bonus	+10 if < 5 minutes
Efficiency Penalty	−2 per commit over 20
Final Score	Base + Bonus − Penalty
▶️ How to Run Backend
1️⃣ Install Dependencies
npm install
2️⃣ Start Server
npm start

Server runs on:

http://localhost:3000
3️⃣ Trigger Agent

POST request:

{
  "repoUrl": "https://github.com/user/repo",
  "teamName": "RIFT ORGANISERS",
  "leaderName": "Saiyam Kumar",
  "githubToken": "ghp_xxxxx"
}
🔒 Security & Safety

No human intervention

No direct push to main branch

Sandboxed execution

CI-only steps skipped safely

Docker containers cleaned after execution

GitHub token never stored

📈 Why This Project Stands Out

✔ Multi-Agent LangGraph Architecture
✔ DevOps + DevSecOps automation
✔ Deterministic + extensible design
✔ Exact branch format compliance
✔ Autonomous iteration
✔ Real-world CI/CD execution
✔ Security scanning integration
✔ Production-ready dashboard

👥 Team

Team Name: RIFT ORGANISERS
Team Lead: Saiyam Kumar

🎥 Demo Requirements

Live deployed dashboard

LinkedIn demo video (2–3 minutes)

Architecture explanation

End-to-end agent run

🏁 Final Statement

This project delivers a fully autonomous, multi-agent DevOps and security system capable of:

Healing CI/CD pipelines

Managing Docker vulnerabilities

Generating actionable reports

Operating without manual intervention

Built specifically to align with the RIFT 2026 Agentic Systems Track.

If you want next, I can:

Generate an architecture diagram image

Provide a LinkedIn demo script

Create final submission checklist

Help refine the frontend dashboard layout