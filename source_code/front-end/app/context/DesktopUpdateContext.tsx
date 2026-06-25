"use client";

import { useEffect, useState } from "react";
import UpdateDialog from "../components/UpdateDialog";
import {
    getDesktopRuntimeInfo,
    isVersionNewer,
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
        const runtimeInfo = getDesktopRuntimeInfo();

        if (!runtimeInfo.isDesktop || !runtimeInfo.version) {
            return;
        }

        const currentVersion = runtimeInfo.version;

        async function checkVersion() {
            try {
                const res = await fetch("/api/desktop/version", {
                    cache: "no-store",
                });

                if (!res.ok) {
                    return;
                }

                const latest = (await res.json()) as DesktopUpdatePayload;

                if (isVersionNewer(latest.version, currentVersion)) {
                    setUpdate(latest);
                }
            } catch {
                // Silently ignore update-check errors to avoid blocking app usage.
            }
        }

        checkVersion();
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