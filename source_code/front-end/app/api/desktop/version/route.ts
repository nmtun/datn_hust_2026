import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        version: "1.0.1",
        force: false,
        title: "Có phiên bản mới",
        description: "TenantHub Desktop đã có phiên bản mới.",
        downloadUrl:
            "https://workspace.tenanthub.io.vn/download/TenantHub-1.0.1.msi",
    });
}