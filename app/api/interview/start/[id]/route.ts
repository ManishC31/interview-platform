import Interview from "@/models/interview.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const interviewId = (await params).id;

  if (!interviewId) {
    return NextResponse.json(
      {
        success: false,
        message: "Interview id not found",
      },
      { status: 400 }
    );
  }

  try {
    const response = await Interview.findByIdAndUpdate(
      interviewId,
      {
        status: "in_progress",
        started_on: new Date(),
      },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Interview started successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to start the interview", error);
    return NextResponse.json(
      {
        succes: false,
        message: "Failed to start the interview",
      },
      { status: 500 }
    );
  }
}
