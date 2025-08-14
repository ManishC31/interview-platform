import { connectToDatabase } from "@/lib/db";
import Interview from "@/models/interview.model";
import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import Candidate from "@/models/candidate.model";
import Position from "@/models/position.model";
import { generateQuestion } from "@/services/ai.service";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { interview_id, question, answer } = body;

  if (!interview_id) {
    return NextResponse.json(
      {
        success: false,
        message: "Interview ID and response are required",
      },
      { status: 400 }
    );
  }

  try {
    await connectToDatabase();

    // Validate interview_id is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(interview_id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid interview ID format",
        },
        { status: 400 }
      );
    }

    // get job description, resume, conversation history from the database
    // Explicitly import the candidate and position models to ensure schemas are registered before population

    const interviewData = await Interview.findById(interview_id)
      .populate({ path: "position_id", model: Position })
      .populate({ path: "candidate_id", model: Candidate })
      .exec();

    if (!interviewData) {
      return NextResponse.json(
        {
          success: false,
          message: "Interview not found",
        },
        { status: 404 }
      );
    }

    const questionResponse = await generateQuestion(
      interviewData?.position_id?.jd_object,
      interviewData?.candidate_id?.resume_object,
      interviewData?.conversation,
      question,
      answer
    );

    const oldConversation = interviewData?.conversation || [];

    if (oldConversation.length === 0) {
      // add new question
      oldConversation.push(questionResponse.next);
    } else {
      // add questionResponse.evaluation to the last object of conversation array
      // Ensure the new question object in oldConversation has the question_count from questionResponse.next
      // If question_count already exists, update; otherwise, add it
      if (questionResponse.next && questionResponse.next.question_count) {
        // Attach question_count to the new question object being pushed
        // If questionResponse.next is a plain object, we can safely add/overwrite the property
        questionResponse.next.question_count = questionResponse.next.question_count;
      }

      oldConversation[oldConversation.length - 1].evaluation = questionResponse.evaluation;
      oldConversation[oldConversation.length - 1].answer = answer;
      oldConversation.push(questionResponse.next);
    }

    await Interview.findByIdAndUpdate(interview_id, { $set: { conversation: oldConversation } }, { new: true, runValidators: true });

    return NextResponse.json(
      {
        success: true,
        message: "Question generated successfully",
        data: {
          question: questionResponse.next.question,
          is_interview_closed: questionResponse.next.isClosed,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.log("Error in generateQuestion:", error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate question",
      },
      { status: 500 }
    );
  }
}
