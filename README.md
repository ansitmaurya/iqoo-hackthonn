# TraceGuard

An interactive transaction monitoring and fraud intelligence dashboard prototype built for financial security teams, fraud analysts, and compliance investigators.

> [!CAUTION]
> **PROTOTYPE DATA FEED NOTICE**
> TraceGuard is a prototype that operates entirely on **simulated and synthetic transaction data**. All transactions, threat telemetry, account profiles, and risk scores are dynamically generated for demonstration and evaluation purposes. It is not connected to real banking systems or payment networks.

---

## Overview

TraceGuard is a web-based fraud intelligence dashboard designed to monitor transactions, flag suspicious behavior, and simplify the investigation process. Using simulated transaction data, it evaluates activity in real time against rule-based risk heuristics, surfaces alerts, visualizes interconnected accounts, and provides an organized investigation workspace for filing compliance reports.

---

## The Problem

Modern financial systems process high volumes of transactions every second. Identifying fraud within this stream presents several challenges:

- **Volume and Speed**: Sifting through thousands of continuous transactions manually is impractical.
- **Disconnected Context**: Reviewing individual transactions in isolation often misses broader patterns, such as money mule rings or coordinated velocity spikes.
- **Complex Typologies**: Fraud schemes like structuring (smurfing), impossible travel velocity, and multi-hop account routing are hard to spot without multi-variable scoring.
- **Fragmented Workflows**: Fraud analysts often have to switch between disparate tools for alert triage, relationship mapping, and compliance reporting.

---

## Our Solution

TraceGuard brings the entire monitoring and investigation lifecycle into a single, cohesive dashboard:

1. **Continuous Monitoring**: Automatically scores incoming transactions against deterministic risk rules.
2. **Alert Triage**: Queues flagged events by severity with explainable score breakdowns and evidence logs.
3. **Graph & Geographic Analysis**: Maps relationships between accounts to uncover mule networks and highlights impossible travel across global hubs.
4. **Case Investigation**: Provides an investigation workspace with interactive evidence checklists, account controls (e.g., account freeze/unfreeze), and regulatory report generation.

---

## Key Features

### 1. Real-Time Transaction Monitoring
- Continuous live stream of incoming transactions with instant risk scoring.
- High-level KPIs: Throughput (TPS), fraud rate, total value at risk, and open critical alerts.
- Live triage panel to quickly inspect high-risk transactions as they arrive.

### 2. Rule-Based Risk Scoring Engine
Transactions are evaluated against 7 specific risk rules:
- **Rapid Velocity Burst**: Detects $\ge 3$ transactions from the same account within a 2-minute window.
- **Impossible Travel (Geo-Velocity)**: Flags consecutive transactions with implied travel speeds $>800\text{ km/h}$ over distances $>200\text{ km}$ (using Haversine distance).
- **Amount Deviation Anomaly (Z-Score)**: Flags amounts exceeding $3\sigma$ from the account's historical baseline.
- **Regulatory Threshold Avoidance (Structuring)**: Catches transactions between $\$9,000$ and $\$9,999$ engineered to stay just under the $\$10,000$ reporting limit.
- **Unrecognized Device + High Value**: Flags large transfers originating from unseen device fingerprints or masked browsers.
- **Off-Hours High-Risk Activity**: Identifies late-night transfers (00:00–04:30) in high-risk categories (e.g., crypto exchanges, online casinos, wire remittances).
- **Mule / Watchlist Association**: Immediate scoring boost if an account is linked to a known flagged or frozen entity.

Composite risk scale:
- **Low (0–34)**: Normal activity (Allowed)
- **Medium (35–59)**: Monitored
- **High (60–79)**: Flagged for review
- **Critical (80–99)**: High-priority triage / recommended block

### 3. Alerts Queue & Triage Center
- Filter alerts by status (`OPEN`, `IN_REVIEW`, `ESCALATED`, `RESOLVED`, `FALSE_POSITIVE`).
- Bulk actions for resolving or escalating multiple alerts at once.
- Detailed alert drawer showing rule triggers, severity contribution, and analyst notes.

### 4. Account Network Topology Graph
- Interactive HTML5 Canvas graph mapping relationships between accounts.
- Visual classification for mule suspects, merchant hubs, and consumer accounts.
- Search accounts, drag nodes, inspect connections, and freeze/unfreeze compromised accounts directly from the graph.

### 5. Global Threat Map
- Canvas-based world map tracking transactions across 10 major financial hubs (New York, London, Singapore, Tokyo, etc.).
- Highlights impossible travel routes and cross-border payment vectors.
- Regional breakdown filters for AMERICAS, EMEA, and APAC corridors.

### 6. Transaction Explorer
- Searchable and filterable transaction table (by merchant category, risk score threshold, and status).
- Detailed side-drawer for individual transaction telemetry, device info, and location hops.
- One-click CSV export of filtered transaction data.

### 7. Investigation Workspace & SAR Generator
- Case dossier management linked to flagged accounts and related transactions.
- Interactive evidence verification checklist.
- FinCEN-style Suspicious Activity Report (SAR) template generator with formatted narrative, print, copy, and file capabilities.

### 8. Analytics & Metrics Dashboard
- Charts built with Recharts displaying risk score distribution, rule trigger frequencies, category risk breakdown, and travel anomalies.

### 9. Scenario Simulation & Testing Controls
- Ability to pause, resume, and adjust simulation speed (1x, 2x, 5x).
- Manual trigger menu to inject specific fraud scenarios on demand (e.g., velocity burst, structuring, impossible travel) for testing and demonstration.

### 10. Audit Log
- Chronological, searchable log tracking system actions, analyst status updates, account freezes, and filed reports.

---

## How It Works

The platform follows a standard fraud detection and response workflow:

```
Transaction Data (Simulated Stream / Scenario Injection)
   │
   ▼
Risk Analysis (7-Rule Evaluation Engine & Z-Score Baseline)
   │
   ▼
Suspicious Activity Detection (Composite Score Calculation)
   │
   ▼
Alert Generation (Queued by Severity: Low / Medium / High / Critical)
   │
   ▼
Investigation (Evidence Checklist, Account Dossier & Telemetry Review)
   │
   ▼
Network Analysis (Topology Graph & Geographic Corridor Check)
   │
   ▼
Action & Report (Account Freeze / SAR Regulatory Filing / Audit Log)
```

---

## Tech Stack

- **Frontend Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Data Visualization**: Custom HTML5 Canvas (Network Graph & Threat Map) + [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Styling**: Vanilla CSS with custom design tokens and dark/light accents

---

## Demo

- **Live Web Application**: [https://iqoo-hackthonn.vercel.app](https://iqoo-hackthonn.vercel.app)

---

## Repository

- **Project Name**: TraceGuard
- **Purpose**: Student Hackathon Submission for Financial Security & Transaction Intelligence

---

## Synthetic Data Notice

> **Notice**: TraceGuard is a prototype that uses simulated or synthetic transaction data. It is not connected to real banking systems, payment gateways, or customer databases. All names, account numbers, IP addresses, and transactions are locally generated for demonstration and testing purposes.

---

## Installation & Setup

### Prerequisites
- **Node.js** (v18.0 or higher recommended)
- **npm**, **yarn**, or **pnpm**

### 1. Clone the Repository
```bash
git clone https://github.com/ansitmaurya/iqoo-hackthonn.git
cd iqoo-hackthonn
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser to view the application.

### 4. Build for Production
```bash
npm run build
```

---

## Project Status

TraceGuard was developed as a hackathon prototype to demonstrate an end-to-end transaction monitoring and fraud investigation workflow. Future enhancements could include backend database integration, machine learning-based anomaly models alongside heuristic rules, and webhook integrations for external alert notifications.

---

## License

This project is open source and available under the [MIT License](LICENSE).
