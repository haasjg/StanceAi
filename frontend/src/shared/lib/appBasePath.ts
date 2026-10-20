/** Build-time prefix used when StanceAI is mounted below an existing site. */
export const APP_BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(
    /\/$/,
    "",
);

/** Prefix a root-relative request or public asset, without double-prefixing. */
export function withAppBasePath(path: string): string {
    if (!APP_BASE_PATH || !path.startsWith("/")) return path;
    if (path === APP_BASE_PATH || path.startsWith(`${APP_BASE_PATH}/`)) {
        return path;
    }
    return `${APP_BASE_PATH}${path}`;
}
