import { connectToDatabase } from "@/lib/db";
import Candidate from "@/models/candidate.model";
import Interview from "@/models/interview.model";
import Position from "@/models/position.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const { positionId, candidates } = body;

  try {
    await connectToDatabase();

    for (let candidate of candidates) {
      const candidateResponse = await Candidate.create({
        firstname: candidate.firstName,
        lastname: candidate.lastName,
        email_address: candidate.emailAddress,
        contact_number: candidate.contactNumber,
      });

      console.log("candidate resp:", candidateResponse);

      const organizationId = (await Position.findById(positionId).select("organization_id")).organization_id;

      console.log("org:", organizationId);
      await Interview.create({
        position_id: positionId,
        candidate_id: candidateResponse._id,
        organization_id: organizationId,
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Candidates invited successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.log("Failed to invite candidates", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to invite candidates",
      },
      { status: 400 }
    );
  }
}
