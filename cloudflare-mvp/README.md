# StanceAI Cloudflare MVP

A standalone Cloudflare Worker app. It does not change the MostlyBuilt site or its Worker. The app is designed for Cloudflare's free Worker, D1, and Workers AI quotas.

## Included

- Email and password sign-in with salted PBKDF2 password hashes and server-side sessions.
- Private chat history and per-user documents in D1.
- Workers AI chat using `@cf/meta/llama-3.1-8b-instruct-fp8`, capped at 20 responses per account per day.
- `.txt`, `.md`, and `.csv` source files, up to 25 KB each; ten files / 250 KB total per account.
- Responsive single-page interface.

There is no email verification or password reset yet. This MVP is for early use; do not upload sensitive or confidential material. AI can make mistakes and is not legal advice. Workers AI may stop answering after the account's free daily allowance is used.

## Deploy

Requirements: Node.js 22+ and Wrangler. From this directory:

1. Log into the Cloudflare account with `npx wrangler login`.
2. Create the free D1 database named `stanceai`: `npx wrangler d1 create stanceai`.
3. Copy the database ID from that result into `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`.
4. Initialize the database: `npx wrangler d1 migrations apply stanceai --remote`.
5. Deploy the separate Worker: `npx wrangler deploy`.

The deployment will use a `workers.dev` address (for example `stanceai.<account>.workers.dev`). It does not add routes to `mostlybuilt.com` or change its DNS. Workers AI is bound directly to the Worker; no API key is needed.

Wrangler's free deployment and D1/Workers AI use should remain within the respective free quotas. Do not enable Workers Paid or attach a paid service to this project. AI requests can fail once the free Workers AI quota is exhausted for the day.
