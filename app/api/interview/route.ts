import Interview from "@/models/interview.model";
import { createNewUser } from "@/services/candidate.service";
import { assignNewInterview } from "@/services/interview.service";
import { getPositionById } from "@/services/position.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const interviewId = searchParams.get("id");

  console.log("interviewId:", interviewId);

  if (!interviewId) {
    return NextResponse.json({
      success: false,
      message: "Interview id not found",
    });
  }

  try {
    const interviewData = await Interview.findById(interviewId).exec();
    console.log("interview data:", interviewData);

    if (!interviewData) {
      return NextResponse.json({
        success: false,
        message: "No data found with interview id",
      });
    }

    // TODO: fix this

    return NextResponse.json({
      success: true,
      message: "Interview data found",
      data: {
        interview: {
          candidate: userResponse,
          position: positionResponse,
          interview: interviewResponse,
        },
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
