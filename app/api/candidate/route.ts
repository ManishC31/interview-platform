import { connectToDatabase } from "@/lib/db";
import Candidate from "@/models/candidate.model";
import Interview from "@/models/interview.model";
import Position from "@/models/position.model";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const interviews = await Interview.find()
      .populate({ path: "position_id", model: Position })
      .populate({ path: "candidate_id", model: Candidate })
      .exec();

    // Map to a single object per interview with specific fields from each collection
    const data = interviews.map((interview: any) => ({
      interview_id: interview._id,
      interview_status: interview.status,
      interview_createdAt: interview.createdAt,
      id: interview.candidate_id?._id || null,
      full_name: interview.candidate_id ? (interview.candidate_id.firstname + " " + interview.candidate_id.lastname).trim() : null,
      email_address: interview.candidate_id?.email_address || null,
      contact_number: interview.candidate_id?.contact_number || null,
      resume_object: interview.candidate_id?.resume_object || null,
      position_id: interview.position_id?._id || null,
      position_name: interview.position_id?.name || null,
      conversation: interview.conversation || [],
    }));

    return NextResponse.json(
      {
        success: true,
        message: "Candidates fetched successfully",
        data: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.log(error)
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch candidates",
      },
      { status: 400 }
    );
  }
}
