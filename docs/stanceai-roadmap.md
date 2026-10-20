# StanceAI product roadmap

StanceAI is a self-hosted legal intelligence application based on the open-source Mike codebase. This roadmap uses LazarusAI's public platform and engine documentation as a capability benchmark. It describes product behavior to build, not an affiliation or compatibility claim.

## Current foundation

- Legal assistant with configurable model providers and user supplied API keys.
- Document library, search, chat, tabular review, playbooks, and workflow jobs.
- Organizations, role-based access, audit events, connectors, and a durable job queue.
- Same-origin API gateway and Docker Compose deployment with a separately hosted frontend and backend.
- Web app mountable below a host site at `/stanceai` through a build-time Next.js base path and matching backend callback prefix.

## Target capability

An operator can create a versioned analysis pipeline, provide a legal document and structured output schema, run it synchronously or as a durable asynchronous job, and retrieve validated results with evidence, field confidence, and an explanation. Pipelines should compose extraction, OCR, retrieval, model reasoning, deterministic validation, and post-processing while retaining model choice and deployment control.

## Delivery phases

### 0. Branded, deployable foundation

- Serve the application at `https://mostlybuilt.com/stanceai`, including API proxy, static assets, sign-in callbacks, password reset, and connector OAuth return paths.
- Replace visible Mike product branding and production links with StanceAI / MostlyBuilt branding. Keep upstream attribution and required open-source notices.
- Add a deployment runbook covering reverse proxy routing, TLS, frontend build arguments, backend environment, database/object storage, SMTP, OAuth, and health checks.
- Confirm all third-party terms, privacy, support, auth email, and redirect URLs before public launch.

### 1. Stable analysis API and jobs

- Keep StanceAI customer API credentials separate from `org_api_keys`, which stores encrypted model-provider secrets. Store only a verifier/hash for customer tokens and bind each token to an organization, scopes, expiry, and revocation state.
- **Started:** organization admins can create one-time-view API tokens, list metadata, and revoke keys; `GET /v1/me` verifies bearer credentials and scopes. Pipeline discovery and analysis submission/results are still to build.
- Reuse the existing durable `db_jobs` runner for asynchronous analyses and persist the API-facing job/result record with tenant ownership and idempotency; do not expose internal queue records directly.
- Publish versioned endpoints for pipeline discovery, run creation, status, results, and cancellation.
- Support input by secure uploaded file and signed URL, output schema, language, metadata, and API version.
- Return a job ID immediately for long tasks; support polling and signed webhook callbacks with retries and replay protection.
- Add per-organization API keys, scopes, rotation, quotas, idempotency, rate limits, and request/job audit records.

### 2. Composable pipeline builder

- Add a typed pipeline graph: file intake, OCR/text extraction, retrieval, prompt/model call, schema validation, post-processing, and response delivery.
- Persist immutable pipeline versions; support draft, validate, publish, rollback, and compare.
- Give each stage explicit input/output contracts, retry policy, timeout, model/provider selection, and cost limits.
- Start with a curated visual editor and JSON definition export/import; avoid arbitrary code execution in pipeline steps.

### 3. Legal extraction and evidence

- Add generic JSON Schema output contracts for extracted fields and nested lists.
- Attach source page, text span, and document coordinates to every extracted field where available.
- Return field-level confidence with a documented calibration method and “needs review” thresholds.
- Preserve citations and provide a reviewer view that jumps from result fields to source passages.
- Add document-specific instructions and reusable legal extraction templates.

### 4. Multimodal and knowledge augmentation

- Add OCR and layout-aware extraction for scanned PDFs, handwriting, tables, and image-based exhibits.
- Support image/document input consistently across configured model providers.
- Add opt-in retrieval over user libraries and connectors with access-control checks, source attribution, freshness indicators, and deletion propagation.
- Keep multimodal paths observable and allow deterministic text-only fallback when a provider lacks a capability.

### 5. Evaluation and governance

- Create labeled evaluation sets and run them against pipeline versions before promotion.
- Measure field accuracy, schema validity, citation coverage, latency, failure rate, and cost; retain comparisons by dataset and provider.
- Add human review queues, correction capture, approval gates, and controlled rollout by organization.
- Record model, prompt, pipeline version, source documents, and validation results for reproducibility.
- Add tenant-level retention, residency, encryption-key, and deployment controls where supported by the hosting model.

## Completion criteria for the first public release

1. Anonymous visitors can reach the landing/login flow at `/stanceai`; authenticated users can complete signup, login, reset, and logout.
2. Every API call, static asset, and auth/connector callback stays under the `/stanceai` mount while backend routes remain private.
3. A user can upload a document, run an existing legal workflow, inspect results, and recover from job or provider failures.
4. A customer can configure their own provider credentials, and secret values never appear in logs or browser responses.
5. Support and legal links resolve to StanceAI-owned pages, and production email/identity settings match the public domain.

## Deployment configuration for `/stanceai`

Build the frontend with `NEXT_PUBLIC_BASE_PATH=/stanceai`. Set backend runtime `FRONTEND_URL=https://mostlybuilt.com`, `FRONTEND_BASE_PATH=/stanceai`, and `API_PUBLIC_URL=https://mostlybuilt.com/stanceai/api`. The host proxy must forward `/stanceai` and `/stanceai/*` to the frontend while preserving the path; the frontend API gateway then forwards `/api/*` to the private backend. Configure the identity provider's site URL and allowed redirects to include `https://mostlybuilt.com/stanceai/auth/callback` and the password-reset destination.

The application code and deployment settings do not configure DNS, the host reverse proxy, database credentials, email delivery, OAuth provider registrations, or production secrets. Those remain environment-specific deployment work.

## Benchmark sources

- [LazarusAI platform](https://lazarusaie.com/platform)
- [AIE overview](https://docs.lazarusai.com/models/AIE/overview/)
- [AIE engine API](https://docs.lazarusai.com/models/AIE/engine/)
