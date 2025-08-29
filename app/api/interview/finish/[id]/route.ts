import Interview from "@/models/interview.model";
import resultQueue from "@/queues/resultQueue";
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
    const response = await Interview.findByIdAndUpdate(interviewId, {
      status: "completed",
      ended_on: new Date(),
    });

    // add into redis queue
    const job = await resultQueue.add("standard-submission", { interview_id: interviewId });

    return NextResponse.json(
      {
        success: true,
        message: "Interview finished successfully",
        jobId: job.id
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
