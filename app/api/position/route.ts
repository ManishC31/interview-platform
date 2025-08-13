import { createPosition, getAllPositions } from "@/services/position.service";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const positions = await getAllPositions();
    return NextResponse.json(
      {
        success: true,
        message: "Positions fetched successfully",
        data: positions,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Failed to fetch position:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to fetch position",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  try {
    const response = await createPosition(body);
    return NextResponse.json({
      success: true,
      message: "Position created successfully",
      data: response,
    });
  } catch (error: any) {
    console.error("Failed to create position:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create position",
      },
      { status: 500 }
    );
  }
}
