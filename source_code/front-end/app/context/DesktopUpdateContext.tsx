"use client";

import { useEffect, useState } from "react";
import UpdateDialog from "../components/UpdateDialog";
import { APP_VERSION, IS_DESKTOP } from "../lib/version";

export default function DesktopUpdateProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [update, setUpdate] = useState<any>(null);

    useEffect(() => {
        if (!IS_DESKTOP) return;

        async function checkVersion() {
            const res = await fetch("/api/desktop/version");

            const latest = await res.json();

            if (latest.version !== APP_VERSION) {
                setUpdate(latest);
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
                />
            )}
        </>
    );
}