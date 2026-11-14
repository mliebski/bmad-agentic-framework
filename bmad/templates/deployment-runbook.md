# Deployment Runbook — {project name} {version}

_Owner: solution-architect | Date: {date}_

> Every command here is run by a human or the pipeline — never by an agent.

## 1. Overview
What is deployed, where, expected duration, expected user impact / downtime.

## 2. Prerequisites
Access, credentials location (not the secrets themselves), tools, approvals, change ticket.

## 3. Pre-deployment
| # | Step | Command / action | Expected result |
|---|---|---|---|
| 1 | Backup | | |
| 2 | Verify backup restore | | |

## 4. Deployment
| # | Step | Command / action | Expected result | If it fails |
|---|---|---|---|---|

## 5. Verification
Smoke tests, health endpoints, key dashboards and the values that mean "healthy".

## 6. Rollback
Trigger criteria (when to roll back), then step-by-step procedure including data rollback.
| # | Step | Command / action | Expected result |
|---|---|---|---|

## 7. Post-deployment
Monitoring window, alerts to watch, who is on call, communication to send.

## 8. Contacts
| Role | Name | Reach via |
|---|---|---|
