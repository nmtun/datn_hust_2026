import { execFile } from "node:child_process";
import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { promisify } from "node:util";
import { NextResponse } from "next/server";

const execFileAsync = promisify(execFile);

const DESKTOP_DIR_CANDIDATES = [
    path.resolve(process.cwd(), "..", "..", "tenant-app-desktop"),
    path.resolve(process.cwd(), "..", "tenant-app-desktop"),
    path.resolve(process.cwd(), "tenant-app-desktop"),
];

const VERSION_REGEX = /(\d+\.\d+\.\d+(?:\.\d+)?)/;

type DesktopRelease = {
    fileName: string;
    filePath: string;
    version: string | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function extractVersionFromFilename(fileName: string): string | null {
    const match = fileName.match(VERSION_REGEX);
    return match?.[1] ?? null;
}

async function resolveDesktopFolder(): Promise<string | null> {
    for (const candidate of DESKTOP_DIR_CANDIDATES) {
        try {
            await access(candidate);
            return candidate;
        } catch {
            // Continue probing the next candidate path.
        }
    }

    return null;
}

async function readMsiProductVersion(filePath: string): Promise<string | null> {
    if (process.platform !== "win32") {
        return null;
    }

    const script = [
        "$path = $args[0]",
        "try {",
        "  $installer = New-Object -ComObject WindowsInstaller.Installer",
        "  $database = $installer.GetType().InvokeMember('OpenDatabase', 'InvokeMethod', $null, $installer, @($path, 0))",
        "  $query = \"SELECT `Value` FROM `Property` WHERE `Property`='ProductVersion'\"",
        "  $view = $database.GetType().InvokeMember('OpenView', 'InvokeMethod', $null, $database, ($query))",
        "  $view.GetType().InvokeMember('Execute', 'InvokeMethod', $null, $view, $null) | Out-Null",
        "  $record = $view.GetType().InvokeMember('Fetch', 'InvokeMethod', $null, $view, $null)",
        "  if ($record) {",
        "    $value = $record.GetType().InvokeMember('StringData', 'GetProperty', $null, $record, 1)",
        "    Write-Output $value",
        "  }",
        "}",
        "catch {",
        "  Write-Output ''",
        "}",
    ].join("; ");

    try {
        const { stdout } = await execFileAsync(
            "powershell",
            [
                "-NoProfile",
                "-NonInteractive",
                "-ExecutionPolicy",
                "Bypass",
                "-Command",
                script,
                "--",
                filePath,
            ],
            {
                timeout: 7000,
                windowsHide: true,
            }
        );

        const version = stdout.trim();
        return version || null;
    } catch {
        return null;
    }
}

async function getLatestDesktopRelease(): Promise<DesktopRelease | null> {
    const desktopFolder = await resolveDesktopFolder();
    if (!desktopFolder) {
        return null;
    }

    const entries = await readdir(desktopFolder);
    const msiFiles = entries.filter((entry) => entry.toLowerCase().endsWith(".msi"));

    if (!msiFiles.length) {
        return null;
    }

    const filesWithStats = await Promise.all(
        msiFiles.map(async (fileName) => {
            const filePath = path.join(desktopFolder, fileName);
            const fileStat = await stat(filePath);

            return {
                fileName,
                filePath,
                mtimeMs: fileStat.mtimeMs,
            };
        })
    );

    filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs);
    const latestFile = filesWithStats[0];

    const versionFromName = extractVersionFromFilename(latestFile.fileName);
    const version = versionFromName ?? (await readMsiProductVersion(latestFile.filePath));

    return {
        fileName: latestFile.fileName,
        filePath: latestFile.filePath,
        version,
    };
}

export async function GET() {
    const latestRelease = await getLatestDesktopRelease();
    const fallbackDownloadUrl =
        process.env.NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL ??
        "https://workspace.tenanthub.io.vn/download/TenantHub.msi";

    return NextResponse.json({
        version: latestRelease?.version ?? "0.0.0",
        force: false,
        title: "Có phiên bản mới",
        description: "TenantHub Desktop đã có phiên bản mới.",
        downloadUrl: latestRelease
            ? `https://workspace.tenanthub.io.vn/download/${encodeURIComponent(latestRelease.fileName)}`
            : fallbackDownloadUrl,
        fileName: latestRelease?.fileName ?? null,
    });
}
