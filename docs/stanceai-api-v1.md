# StanceAI API v1

The public API is served at `/v1` on the backend and reaches MostlyBuilt through
`https://mostlybuilt.com/stanceai/api/v1`. It is a separate API surface from
the signed-in web app routes.

## Organization API tokens

Organization owners and admins can manage customer integration tokens through
the authenticated web API:

- `GET /api/orgs/:orgId/api-tokens` lists metadata for the organization's
  tokens. Secret values are never returned.
- `POST /api/orgs/:orgId/api-tokens` creates a token. The raw secret is
  returned once in the response; copy it then because StanceAI stores only
  its SHA-256 verifier.
- `DELETE /api/orgs/:orgId/api-tokens/:tokenId` revokes a token. Creation and
  revocation require MFA when the account has MFA enabled.

Creation accepts a display `name`, a non-empty list of `scopes`, and an
optional future ISO `expires_at`. Supported scopes are `analysis:read` and
`analysis:write`. Tokens begin with `stai_live_` and must be sent as a bearer
credential. They are organization-scoped and never authorize web-session
routes.

## Credential check

`GET /v1/me` requires `analysis:read` and returns the token ID, organization
ID, API version, and granted scopes. Errors use an `error` object with stable
`code` and human-readable `message` fields. An invalid, expired, or revoked
token receives `401`; a valid token missing the required scope receives
`403`.

## Next endpoints

The next API increment adds versioned pipeline discovery, analysis creation,
job status/results, idempotency, and webhook delivery. Those endpoints are not
available yet. The intended contract and delivery sequence are in
[the StanceAI roadmap](stanceai-roadmap.md).
