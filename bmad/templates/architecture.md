# Architecture — {project name}

_Status: draft | Owner: solution-architect | Date: {date}_

## 1. Context
System context diagram (Mermaid C4-style): users, this system, external systems.

## 2. Architectural drivers
The NFRs and constraints that shape the design, in priority order.

## 3. Solution overview
Container/component diagram and a paragraph on the overall style.

## 4. Technology stack
| Layer | Choice | Version | Why | ADR |
|---|---|---|---|---|

## 5. Components
Per component: responsibility, interfaces, dependencies, owning data.

## 6. Data model
Entities, relationships (Mermaid ER), schemas, retention, migration approach.

## 7. API and integration contracts
Endpoints or events: request, response, errors, auth. Standard error format.

## 8. Cross-cutting concerns
- **Security:** authn/authz, secrets, input validation, data protection
- **Privacy / compliance:**
- **Observability:** logs, metrics, traces, alerts
- **Performance and scalability:**
- **Resilience:** failure modes, retries, backups, RPO/RTO

## 9. Code conventions for developers
Folder structure (exact tree), naming, error handling, testing conventions, dependency
rules. Specific enough that parallel developers produce compatible code.

## 10. Environments and deployment
Environments, CI/CD pipeline, infrastructure, configuration, release and rollback strategy.

## 11. Requirements traceability
| Requirement | Component(s) / decision | Notes |
|---|---|---|
| FR-1 | | |
| NFR-1 | | |

## 12. Risks and technical debt

## 13. ADR index
| ADR | Title | Status |
|---|---|---|
