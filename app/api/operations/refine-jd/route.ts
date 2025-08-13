import { connectToDatabase } from "@/lib/db";
import Position from "@/models/position.model";
import { refineJobDescription } from "@/services/ai.service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const jdText = body.job_description;
  const positionId = body.position_id;


  try {
    await connectToDatabase();
    const response = await refineJobDescription(jdText);

    const updatedPosition = await Position.findByIdAndUpdate(
      positionId,
      {
        $set: { jd_object: response },
      },
      { new: true, runValidators: true }
    );

    if (!updatedPosition) {
      return NextResponse.json(
        {
          success: false,
          message: "Position not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: response,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in refine-jd route:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to refine job description",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
