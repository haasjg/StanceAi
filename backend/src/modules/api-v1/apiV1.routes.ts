import { Router } from "express";
import {
    requireAnalysisApiKey,
    requireAnalysisApiScope,
    type AuthenticatedAnalysisApiToken,
} from "../../middleware/analysisApiKey";

export const apiV1Router = Router();

apiV1Router.get(
    "/me",
    requireAnalysisApiKey,
    requireAnalysisApiScope("analysis:read"),
    (_req, res) => {
        const token = res.locals.analysisApiToken as AuthenticatedAnalysisApiToken;
        res.json({
            api_version: "v1",
            organization_id: token.orgId,
            token_id: token.id,
            scopes: token.scopes,
        });
    },
);
