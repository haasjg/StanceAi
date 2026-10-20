import { createHash, randomBytes } from "crypto";
import { getOrgRole, isOrgAdmin } from "../../lib/access";
import type { OrgResult } from "../../lib/orgs";
import type { Db } from "../../lib/supabase";
import { recordAudit } from "../../lib/audit";

export const ORG_API_TOKEN_SCOPES = [
    "analysis:read",
    "analysis:write",
] as const;
export type OrgApiTokenScope = (typeof ORG_API_TOKEN_SCOPES)[number];

export type OrgApiTokenSummary = {
    id: string;
    name: string;
    token_prefix: string;
    scopes: OrgApiTokenScope[];
    expires_at: string | null;
    last_used_at: string | null;
    revoked_at: string | null;
    created_at: string;
};

export function hashOrgApiToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

function isTokenScope(value: unknown): value is OrgApiTokenScope {
    return (ORG_API_TOKEN_SCOPES as readonly unknown[]).includes(value);
}

function safeSummary(row: Record<string, unknown>): OrgApiTokenSummary {
    return {
        id: String(row.id),
        name: String(row.name),
        token_prefix: String(row.token_prefix),
        scopes: Array.isArray(row.scopes)
            ? row.scopes.filter(isTokenScope)
            : [],
        expires_at: typeof row.expires_at === "string" ? row.expires_at : null,
        last_used_at:
            typeof row.last_used_at === "string" ? row.last_used_at : null,
        revoked_at: typeof row.revoked_at === "string" ? row.revoked_at : null,
        created_at: String(row.created_at),
    };
}

async function requireAdmin(
    db: Db,
    actorId: string,
    orgId: string,
): Promise<OrgResult<Record<never, never>>> {
    const role = await getOrgRole(actorId, orgId, db);
    if (!role) return { ok: false, kind: "not_found" };
    if (!isOrgAdmin(role)) return { ok: false, kind: "forbidden" };
    return { ok: true };
}

export async function listOrgApiTokens(
    db: Db,
    params: { actorId: string; orgId: string },
): Promise<OrgResult<{ tokens: OrgApiTokenSummary[] }>> {
    const access = await requireAdmin(db, params.actorId, params.orgId);
    if (!access.ok) return access;
    const { data, error } = await db
        .from("org_api_tokens")
        .select(
            "id,name,token_prefix,scopes,expires_at,last_used_at,revoked_at,created_at",
        )
        .eq("org_id", params.orgId)
        .order("created_at", { ascending: false });
    if (error)
        return { ok: false, kind: "db_error", detail: error.message };
    return {
        ok: true,
        tokens: ((data ?? []) as Record<string, unknown>[]).map(safeSummary),
    };
}

export async function createOrgApiToken(
    db: Db,
    params: {
        actorId: string;
        actorEmail?: string | null;
        orgId: string;
        name: unknown;
        scopes: unknown;
        expiresAt?: unknown;
    },
): Promise<OrgResult<{ token: OrgApiTokenSummary; secret: string }>> {
    const access = await requireAdmin(db, params.actorId, params.orgId);
    if (!access.ok) return access;

    if (typeof params.name !== "string" ||
        params.name.trim().length < 1 || params.name.trim().length > 100) {
        return {
            ok: false,
            kind: "validation",
            detail: "name must be between 1 and 100 characters",
        };
    }
    if (!Array.isArray(params.scopes) || params.scopes.length === 0 ||
        params.scopes.some((scope) => !isTokenScope(scope)) ||
        new Set(params.scopes).size !== params.scopes.length) {
        return {
            ok: false,
            kind: "validation",
            detail: "scopes must contain unique supported analysis scopes",
        };
    }

    let expiresAt: string | null = null;
    if (params.expiresAt !== undefined && params.expiresAt !== null) {
        if (typeof params.expiresAt !== "string" ||
            !Number.isFinite(Date.parse(params.expiresAt)) ||
            Date.parse(params.expiresAt) <= Date.now()) {
            return {
                ok: false,
                kind: "validation",
                detail: "expires_at must be a future ISO date or null",
            };
        }
        expiresAt = new Date(params.expiresAt).toISOString();
    }

    const secret = `stai_live_${randomBytes(32).toString("base64url")}`;
    const { data, error } = await db
        .from("org_api_tokens")
        .insert({
            org_id: params.orgId,
            name: params.name.trim(),
            token_hash: hashOrgApiToken(secret),
            token_prefix: secret.slice(0, 16),
            scopes: params.scopes,
            expires_at: expiresAt,
            created_by: params.actorId,
        })
        .select(
            "id,name,token_prefix,scopes,expires_at,last_used_at,revoked_at,created_at",
        )
        .single();
    if (error || !data)
        return {
            ok: false,
            kind: "db_error",
            detail: error?.message ?? "API token could not be created",
        };

    await recordAudit(db, {
        userId: params.actorId,
        userEmail: params.actorEmail ?? null,
        action: "org.api_token.created",
        title: params.name.trim(),
        detail: {
            org_id: params.orgId,
            token_id: data.id,
            scopes: params.scopes,
            expires_at: expiresAt,
        },
    });
    return { ok: true, token: safeSummary(data), secret };
}

export async function revokeOrgApiToken(
    db: Db,
    params: {
        actorId: string;
        actorEmail?: string | null;
        orgId: string;
        tokenId: string;
    },
): Promise<OrgResult<{ token: OrgApiTokenSummary }>> {
    const access = await requireAdmin(db, params.actorId, params.orgId);
    if (!access.ok) return access;
    const { data, error } = await db
        .from("org_api_tokens")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", params.tokenId)
        .eq("org_id", params.orgId)
        .is("revoked_at", null)
        .select(
            "id,name,token_prefix,scopes,expires_at,last_used_at,revoked_at,created_at",
        )
        .maybeSingle();
    if (error)
        return { ok: false, kind: "db_error", detail: error.message };
    if (!data) return { ok: false, kind: "not_found" };

    await recordAudit(db, {
        userId: params.actorId,
        userEmail: params.actorEmail ?? null,
        action: "org.api_token.revoked",
        title: data.name,
        detail: { org_id: params.orgId, token_id: data.id },
    });
    return { ok: true, token: safeSummary(data) };
}
