import { createHash } from "crypto";
import type { RequestHandler } from "express";
import { createServerSupabase } from "../lib/supabase";
import type { OrgApiTokenScope } from "../modules/orgs/orgs.apiTokens";

export type AuthenticatedAnalysisApiToken = {
    id: string;
    orgId: string;
    scopes: OrgApiTokenScope[];
};

function tokenHash(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export const requireAnalysisApiKey: RequestHandler = async (_req, res, next) => {
    const header = _req.get("authorization") ?? "";
    const match = /^Bearer\s+(stai_live_[A-Za-z0-9_-]{40,80})$/i.exec(header);
    if (!match) {
        res.setHeader("WWW-Authenticate", 'Bearer realm="stanceai-api"');
        res.status(401).json({
            error: {
                code: "invalid_api_key",
                message: "A valid StanceAI API key is required.",
            },
        });
        return;
    }

    const db = createServerSupabase();
    const { data, error } = await db
        .from("org_api_tokens")
        .select("id,org_id,scopes,expires_at")
        .eq("token_hash", tokenHash(match[1]))
        .is("revoked_at", null)
        .maybeSingle();
    if (error) {
        res.status(503).json({
            error: {
                code: "api_auth_unavailable",
                message: "API authentication is temporarily unavailable.",
            },
        });
        return;
    }
    if (!data || (data.expires_at && Date.parse(data.expires_at) <= Date.now())) {
        res.setHeader("WWW-Authenticate", 'Bearer realm="stanceai-api"');
        res.status(401).json({
            error: {
                code: "invalid_api_key",
                message: "A valid StanceAI API key is required.",
            },
        });
        return;
    }

    const token: AuthenticatedAnalysisApiToken = {
        id: data.id,
        orgId: data.org_id,
        scopes: Array.isArray(data.scopes) ? data.scopes : [],
    };
    res.locals.analysisApiToken = token;

    // This field is operational metadata only. A transient write failure
    // must not turn a valid credential into a failed API request.
    void db
        .from("org_api_tokens")
        .update({ last_used_at: new Date().toISOString() })
        .eq("id", token.id)
        .then(() => undefined, () => undefined);
    next();
};

export function requireAnalysisApiScope(
    requiredScope: OrgApiTokenScope,
): RequestHandler {
    return (_req, res, next) => {
        const token = res.locals.analysisApiToken as
            | AuthenticatedAnalysisApiToken
            | undefined;
        if (!token?.scopes.includes(requiredScope)) {
            res.status(403).json({
                error: {
                    code: "insufficient_scope",
                    message: `This API key requires the ${requiredScope} scope.`,
                },
            });
            return;
        }
        next();
    };
}
