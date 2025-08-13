import Position from "@/models/position.model";
import { refineJobDescription } from "@/services/ai.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const resumeText = body.resume;
  try {
    const response = await refineJobDescription(resumeText);

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: "Failed to refine candidate resume",
      },
      { status: 500 }
    );
  }
}
