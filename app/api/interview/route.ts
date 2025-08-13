import { connectToDatabase } from "@/lib/db";
import Interview from "@/models/interview.model";
import { createNewUser, getUserById } from "@/services/candidate.service";
import { assignNewInterview } from "@/services/interview.service";
import { getPositionById } from "@/services/position.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const interviewId = searchParams.get("id");

  if (!interviewId) {
    return NextResponse.json({
      success: false,
      message: "Interview id not found",
    });
  }

  try {
    await connectToDatabase();
    const interviewData = await Interview.findById(interviewId).exec();

    if (!interviewData) {
      return NextResponse.json({
        success: false,
        message: "No data found with interview id",
      });
    }

    const positionData = await getPositionById(interviewData.position_id);

    const userData = await getUserById(interviewData.candidate_id);

    return NextResponse.json({
      success: true,
      message: "Interview data found",
      data: {
        candidate: userData,
        position: positionData,
        interview: interviewData,
      },
    });
  } catch (error: any) {
    console.error("Failed to fetch the interview information", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch interview information",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { user, position_id, organization_id } = body;

    const userResponse = await createNewUser(user);

    const interviewResponse = await assignNewInterview(userResponse._id, position_id, organization_id);

    const positionResponse = await getPositionById(interviewResponse.position_id);

    return NextResponse.json(
      {
        success: true,
        message: "Interview assigned successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to create interview:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create interview",
      },
      { status: 500 }
    );
  }
}
