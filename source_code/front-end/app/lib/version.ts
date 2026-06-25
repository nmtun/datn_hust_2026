export const APP_VERSION = "1.0.0";

const VERSION_PATTERN = /(\d+\.\d+\.\d+(?:\.\d+)?)/;

function readVersionFromQuery(params: URLSearchParams): string | null {
    const rawVersion = params.get("desktopVersion") ?? params.get("appVersion");
    const matched = rawVersion?.match(VERSION_PATTERN);

    return matched?.[1] ?? null;
}

function readVersionFromUserAgent(userAgent: string): string | null {
    const patterns = [
        /(?:TenantHub|Tenanthub|Pake)[/\s]v?(\d+\.\d+\.\d+(?:\.\d+)?)/i,
        /app[-_\s]?version[\s:=]v?(\d+\.\d+\.\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of patterns) {
        const matched = userAgent.match(pattern);
        if (matched?.[1]) {
            return matched[1];
        }
    }

    return null;
}

function hasDesktopUserAgent(userAgent: string): boolean {
    return /(pake|tauri|electron|tenant.?hubdesktop)/i.test(userAgent);
}

export type DesktopRuntimeInfo = {
    isDesktop: boolean;
    version: string | null;
};

export function getDesktopRuntimeInfo(): DesktopRuntimeInfo {
    if (typeof window === "undefined") {
        return {
            isDesktop: false,
            version: null,
        };
    }

    const params = new URLSearchParams(window.location.search);
    const userAgent = window.navigator.userAgent;
    const desktopFlag = (params.get("desktop") ?? "").toLowerCase() === "true";
    const queryVersion = readVersionFromQuery(params);
    const userAgentVersion = readVersionFromUserAgent(userAgent);
    const isDesktop = desktopFlag || queryVersion !== null || hasDesktopUserAgent(userAgent);

    return {
        isDesktop,
        version: queryVersion ?? userAgentVersion,
    };
}

export const IS_DESKTOP =
    typeof window !== "undefined" &&
    getDesktopRuntimeInfo().isDesktop;

function normalizeVersion(version: string): number[] {
    return version
        .split(".")
        .map((segment) => Number.parseInt(segment, 10))
        .map((segment) => (Number.isNaN(segment) ? 0 : segment));
}

export function isVersionNewer(latestVersion: string, currentVersion: string): boolean {
    const latest = normalizeVersion(latestVersion);
    const current = normalizeVersion(currentVersion);
    const maxLength = Math.max(latest.length, current.length);

    for (let i = 0; i < maxLength; i += 1) {
        const latestPart = latest[i] ?? 0;
        const currentPart = current[i] ?? 0;

        if (latestPart > currentPart) {
            return true;
        }

        if (latestPart < currentPart) {
            return false;
        }
    }

    return false;
}

export function getCurrentDesktopVersion(): string {
    return getDesktopRuntimeInfo().version ?? APP_VERSION;
}
