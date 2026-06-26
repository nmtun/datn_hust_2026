"use client";

import { useEffect, useState } from "react";
import UpdateDialog from "../components/UpdateDialog";
import {
    isVersionNewer,
    resolveDesktopRuntimeInfo,
} from "../lib/version";

type DesktopUpdatePayload = {
    version: string;
    force: boolean;
    title: string;
    description: string;
    downloadUrl: string;
};

export default function DesktopUpdateProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [update, setUpdate] = useState<DesktopUpdatePayload | null>(null);

    useEffect(() => {
        let mounted = true;

        async function checkVersion() {
            try {
                const runtimeInfo = await resolveDesktopRuntimeInfo();

                if (!runtimeInfo.isDesktop) {
                    return;
                }

                const res = await fetch("/api/desktop/version", {
                    cache: "no-store",
                });

                if (!res.ok) {
                    return;
                }

                const latest = (await res.json()) as DesktopUpdatePayload;
                const currentVersion = runtimeInfo.version;

                if (!mounted) {
                    return;
                }

                // If desktop runtime version cannot be inferred, still prompt update.
                if (!currentVersion) {
                    if (latest.version !== "0.0.0") {
                        setUpdate(latest);
                    }

                    return;
                }

                if (isVersionNewer(latest.version, currentVersion)) {
                    setUpdate(latest);
                }
            } catch {
                // Silently ignore update-check errors to avoid blocking app usage.
            }
        }

        checkVersion();

        return () => {
            mounted = false;
        };
    }, []);

    return (
        <>
            {children}
            {update && (
                <UpdateDialog
                    version={update.version}
                    force={update.force}
                    title={update.title}
                    description={update.description}
                    url={update.downloadUrl}
                    onClose={() => setUpdate(null)}
                />
            )}
        </>
    );
}