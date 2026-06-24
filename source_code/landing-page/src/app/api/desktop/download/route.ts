import { createReadStream } from "node:fs";
import { access, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

type DesktopCandidate = {
  fileName: string;
  filePath: string;
  mtimeMs: number;
};

const DESKTOP_DIR_CANDIDATES = [
  path.resolve(process.cwd(), "..", "..", "tenant-app-desktop"),
  path.resolve(process.cwd(), "..", "tenant-app-desktop"),
  path.resolve(process.cwd(), "tenant-app-desktop"),
];

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function resolveDesktopFolder(): Promise<string | null> {
  for (const candidate of DESKTOP_DIR_CANDIDATES) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try next candidate.
    }
  }

  return null;
}

async function getLatestDesktopPackage(): Promise<DesktopCandidate | null> {
  const desktopFolder = await resolveDesktopFolder();
  if (!desktopFolder) {
    return null;
  }

  const entries = await readdir(desktopFolder);
  const msiFiles = entries.filter((entry) => entry.toLowerCase().endsWith(".msi"));

  if (!msiFiles.length) {
    return null;
  }

  const candidates = await Promise.all(
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

  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return candidates[0];
}

export async function GET() {
  const latestPackage = await getLatestDesktopPackage();

  if (!latestPackage) {
    return NextResponse.json(
      {
        message: "Không tìm thấy file cài đặt Desktop App.",
      },
      {
        status: 404,
      }
    );
  }

  const fileStat = await stat(latestPackage.filePath);
  const stream = createReadStream(latestPackage.filePath);
  const body = Readable.toWeb(stream) as ReadableStream;
  const encodedName = encodeURIComponent(latestPackage.fileName);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(fileStat.size),
      "Content-Disposition": `attachment; filename="${latestPackage.fileName}"; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "no-store",
    },
  });
}
