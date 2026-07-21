# Production readiness

The governed API at `/api/governance` is the supported trademark-protection matter path. It preserves tenant/matter-scoped source versions, opaque evidence digests, deadlines, accountable risk/draft/review transitions, client approval, legal hold, signed-delivery references, an idempotent connector outbox, immutable attempts, bounded retries, and dead-letter state. Deterministic assessment returns a review disposition only; it cannot enforce, file, predict an outcome, provide legal advice, or send a cease-and-desist letter.

## Deployment sequence

1. Have database and legal-domain owners review `backend/migrations/001_governed_trademark_matter.sql`; back up and apply it separately.
2. Copy `.env.example` to `.env`, replace placeholders, and configure a unique 32-plus-character JWT secret and explicit production CORS allowlist.
3. Install locked dependencies explicitly. `start.sh` performs no installation, schema application, seeding, database creation, or unrelated process termination.
4. Provision matter memberships and separately reviewed workers for registry, filing, matter, document, identity, notification, and marketplace outbox items. Keep privileged content outside payloads and post opaque receipts.

The legacy destructive schema and demo seed SQL files are not deployment migrations and now require explicit `psql` opt-in variables for isolated non-production use. Do not use them on an existing environment.

Production rejects legacy provider routes, mock/demo flags, wildcard CORS, weak secrets, and startup schema mutation. AI drafting, registry-feed, and generated gap handlers remain quarantined by default. Legacy mutation auditing no longer stores request bodies or IP addresses.

## Required external validation

Qualified counsel must validate jurisdiction, effective-date, privilege, redaction, retention/legal hold, client approval, signed delivery, disclaimer, and escalation policies. Test conflicting sources, adverse cases, delivery replay, retry exhaustion, and dead-letter recovery on reviewed fixtures. This repository-only change is not legal advice, provider validation, enforcement authorization, or filing approval.
