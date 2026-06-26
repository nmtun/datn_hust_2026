export const APP_VERSION = "1.0.0";

const VERSION_PATTERN = /(\d+\.\d+\.\d+(?:\.\d+)?)/;

type TauriGlobal = {
    app?: {
        getVersion?: (() => Promise<string>) | (() => string);
    };
};

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

function getTauriGlobal(): TauriGlobal | null {
    if (typeof window === "undefined") {
        return null;
    }

    const value = (window as typeof window & { __TAURI__?: TauriGlobal }).__TAURI__;
    return value ?? null;
}

function hasTauriGlobal(): boolean {
    return getTauriGlobal() !== null;
}

async function readVersionFromTauriGlobal(): Promise<string | null> {
    const tauriGlobal = getTauriGlobal();
    const getVersion = tauriGlobal?.app?.getVersion;

    if (typeof getVersion !== "function") {
        return null;
    }

    try {
        const rawVersion = await Promise.resolve(getVersion());
        const matched = `${rawVersion}`.match(VERSION_PATTERN);
        return matched?.[1] ?? null;
    } catch {
        return null;
    }
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
    const isDesktop =
        desktopFlag ||
        queryVersion !== null ||
        hasDesktopUserAgent(userAgent) ||
        hasTauriGlobal();

    return {
        isDesktop,
        version: queryVersion ?? userAgentVersion,
    };
}

export async function resolveDesktopRuntimeInfo(): Promise<DesktopRuntimeInfo> {
    const runtimeInfo = getDesktopRuntimeInfo();

    if (runtimeInfo.version !== null || !runtimeInfo.isDesktop) {
        return runtimeInfo;
    }

    const tauriVersion = await readVersionFromTauriGlobal();

    return {
        isDesktop: runtimeInfo.isDesktop || tauriVersion !== null,
        version: tauriVersion,
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
