export const APP_VERSION = "1.0.0";

export const IS_DESKTOP =
    typeof window !== "undefined" &&
    window.location.search.includes("desktop=true");

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
    if (typeof window === "undefined") {
        return APP_VERSION;
    }

    const params = new URLSearchParams(window.location.search);

    return (
        params.get("desktopVersion") ??
        params.get("appVersion") ??
        APP_VERSION
    );
}
