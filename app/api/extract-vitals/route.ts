import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { extractVitalsFromReport } from "@/lib/actions/extraction";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileUrl, fileType } = await req.json();

    if (!fileUrl || !fileType) {
      return NextResponse.json(
        { error: "Missing fileUrl or fileType" },
        { status: 400 }
      );
    }

    const result = await extractVitalsFromReport(fileUrl, fileType);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Extraction API error:", error);
    return NextResponse.json(
      { error: "Failed to extract vitals" },
      { status: 500 }
    );
  }
}
