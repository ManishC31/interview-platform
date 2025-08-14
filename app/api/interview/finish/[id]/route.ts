import Interview from "@/models/interview.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const interviewId = (await params).id;
  console.log("interview id:", interviewId);

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
    const response = await Interview.findByIdAndUpdate(interviewId, {
      status: "completed",
      ended_on: new Date(),
    });

    return NextResponse.json(
      {
        success: false,
        message: "Interview finished successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to finish interview", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to finish interview",
      },
      { status: 500 }
    );
  }
}
