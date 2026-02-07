# Gmail Clone Architecture

## Overview
AI-powered email client with semantic search and smart features.

## Tech Stack
- **Frontend:** Next.js 14+, React 18, Tailwind CSS, React Email
- **Backend:** Rust (Axum framework)
- **Database:** Neo4j (graph DB for email relationships + vector search)
- **AI:** OpenAI/Claude for summarization, embeddings for search
- **Infra:** Docker Compose

## Project Structure
```
gmail-clone/
├── frontend/           # Next.js app
│   ├── src/
│   │   ├── app/       # App router pages
│   │   ├── components/ # React components
│   │   ├── lib/       # Utilities, API client
│   │   └── styles/    # Tailwind config
│   └── package.json
├── backend/           # Rust API
│   ├── src/
│   │   ├── main.rs
│   │   ├── routes/    # API endpoints
│   │   ├── models/    # Data structures
│   │   ├── services/  # Business logic
│   │   └── ai/        # AI integrations
│   └── Cargo.toml
├── docker-compose.yml
└── README.md
```

## Frontend Components
1. **Layout**
   - Sidebar (folders, labels)
   - Header (search, settings)
   - Main content area

2. **Views**
   - Inbox list (threaded)
   - Email detail view
   - Compose modal
   - Settings page

3. **Features**
   - Virtual scrolling for large inboxes
   - Real-time updates
   - Keyboard shortcuts
   - Dark/light mode

## Backend API Endpoints
```
GET    /api/emails          # List emails (paginated)
GET    /api/emails/:id      # Get single email
POST   /api/emails          # Send email
DELETE /api/emails/:id      # Delete/archive
PATCH  /api/emails/:id      # Update (read, starred, labels)

GET    /api/threads/:id     # Get thread
GET    /api/labels          # List labels
POST   /api/labels          # Create label

POST   /api/ai/summarize    # Summarize email/thread
POST   /api/ai/compose      # Smart compose suggestions
POST   /api/ai/search       # Semantic search
POST   /api/ai/categorize   # Auto-categorize email
```

## Neo4j Schema
```cypher
// Nodes
(:Email {id, subject, body, snippet, date, isRead, isStarred, embedding})
(:Contact {email, name})
(:Label {name, color})
(:Thread {id})

// Relationships
(:Email)-[:SENT_BY]->(:Contact)
(:Email)-[:SENT_TO]->(:Contact)
(:Email)-[:CC]->(:Contact)
(:Email)-[:IN_THREAD]->(:Thread)
(:Email)-[:REPLIED_TO]->(:Email)
(:Email)-[:HAS_LABEL]->(:Label)
```

## AI Features
1. **Summarization:** Condense long emails/threads
2. **Smart Compose:** Suggest replies based on context
3. **Semantic Search:** Find emails by meaning, not just keywords
4. **Auto-Categorize:** Suggest labels for incoming mail
5. **Priority Score:** Rank importance based on sender, content

## Docker Services
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
  
  backend:
    build: ./backend
    ports: ["8080:8080"]
    depends_on: [neo4j]
  
  neo4j:
    image: neo4j:5
    ports: ["7474:7474", "7687:7687"]
    volumes: [neo4j_data:/data]
```

## Phase 1 (MVP)
- [ ] Project scaffolding
- [ ] Docker compose setup
- [ ] Neo4j connection from Rust
- [ ] Basic email CRUD API
- [ ] Next.js pages (inbox, compose)
- [ ] Tailwind styling

## Phase 2 (AI)
- [ ] Email embeddings
- [ ] Semantic search endpoint
- [ ] Summarization endpoint
- [ ] Smart compose

## Phase 3 (Polish)
- [ ] Threading UI
- [ ] Labels management
- [ ] Keyboard shortcuts
- [ ] Dark mode
