# Audit Note — AITrademarkBrandProtectionMonitor

Source: `/Users/erolakarsu/projects/_AUDIT/reports/batch_08.md` (section 19).

## Original Recommendations

### Missing AI Counterparts
- AI for counterfeit image analysis (CV)
- AI for automated cease-and-desist drafting

### Missing Non-AI Features
- USPTO/WIPO database integration
- Law firm enforcement integration
- Multi-language support
- Geographic jurisdiction filtering

### Custom Feature Suggestions
- Visual counterfeit detection
- Automated C&D generation
- Franchise brand protection
- Market expansion scouting
- Brand dilution scoring

## Implemented (this round)
1. `POST /api/ai/cease-and-desist` — drafts a full C&D letter with legal arguments.
2. `POST /api/ai/dilution-score` — brand dilution risk scoring.

Pattern reused: `callOpenRouter` (service) + `parseAIJson` (service) + `persistAIResult` + `aiRateLimiter`. Syntax-checked.

## Backlog (prioritized)
1. **MECHANICAL** Franchise compliance scoring endpoint.
2. **MECHANICAL** Market expansion scouting endpoint.
3. **NEEDS-CREDS** USPTO/WIPO API integrations.
4. **NEEDS-CREDS** Counterfeit image CV (vision API key).

## Apply pass 3 (frontend)

FE already wired. `frontend/src/pages/AIHub.jsx` contains 20+ tool cards including `cnd-attorney` (`/ai/cease-and-desist`) and `dilution-score` (`/ai/dilution-score`) — the two endpoints added in pass 2. Sample data, form fields, and `AIOutputDisplay` rendering all in place. No frontend changes this pass.

## Apply pass 4 (mechanical backlog)

Two MECHANICAL items closed:

1. `POST /api/ai/franchise-compliance` — score franchise locations against brand standards (accepts `locations` as array or JSON-array string for FE convenience).
2. `POST /api/ai/market-expansion` — recommend top expansion markets, including trademark-availability risk.

Reuse `callOpenRouter` + `parseAIJson` + `persistAIResult` + `aiRateLimiter`. New `requireKey()` helper returns **503** when `OPENROUTER_API_KEY` is unset.

FE: two new tool cards added to `frontend/src/pages/AIHub.jsx` with sample presets matching the existing 22-tool grid. JWT bearer via existing `frontend/src/api.js`.

Files touched:
- `backend/routes/ai.js`
- `frontend/src/pages/AIHub.jsx`

Syntax check: BE PASS, FE Babel JSX parse PASS.

Remaining backlog: USPTO/WIPO API integrations and counterfeit image CV both NEEDS-CREDS.

## Apply pass 5 (all backlog)

Three additive **NEEDS-CREDS** endpoints (all gated, all 503 + `missing` when env var unset):

1. `POST /api/ai/uspto-search` — gated on `USPTO_API_KEY`. LLM analyzes caller-supplied sample results when key present (no live USPTO TSDR call — would require SDK install).
2. `POST /api/ai/wipo-search` — gated on `WIPO_API_KEY`. LLM produces Madrid-Protocol filing strategy + jurisdiction risk breakdown.
3. `POST /api/ai/counterfeit-image-cv` — gated on `OPENROUTER_VISION_KEY`. Vision-model integration documented in comment; current implementation falls back to LLM-text scoring of caller-supplied image description / metadata.

All three reuse existing `callOpenRouter` + `parseAIJson` + `persistAIResult` + `aiRateLimiter` + `requireKey` pattern. Each returns `503 {error, missing:"<ENV>"}` when its env var is unset, AND falls through to the standard OPENROUTER_API_KEY 503 if that is unset.

Files touched:
- `backend/routes/ai.js`

Syntax check: `node --check` PASS.

Smoke test: backend booted on port 4803, `demo@trademark.com / password` → JWT issued. All three endpoints return **503** with the correct `missing` field (`USPTO_API_KEY`, `WIPO_API_KEY`, `OPENROUTER_VISION_KEY`) when their respective env var is unset. Pre-existing express-rate-limit IPv6 keyGenerator validation warning is unchanged (not introduced by these edits).
