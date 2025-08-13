import { connectToDatabase } from "@/lib/db";
import Candidate from "@/models/candidate.model";
import Interview from "@/models/interview.model";
import Position from "@/models/position.model";
import { evaluateAnswer, generateInitialQuestion } from "@/services/ai.service";
import { NextRequest, NextResponse } from "next/server";

/**
 * Generate new question
 */

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { interview_id, question, answer } = body;
  try {
    await connectToDatabase();

    const interviewData = await Interview.findById(interview_id);

    const candidateData = await Candidate.findById(interviewData.candidate_id).select("_id resume_object");

    const positionData = await Position.findById(interviewData.position_id).select("_id jd_object");

    const jobDescription = positionData.jd_object;
    const resume = candidateData.resume_object;

    let evaluationResponse = null;

    if (!(question && answer)) {
      // it is a new question

      const questionResponse = await generateInitialQuestion(jobDescription, resume, interviewData.conversation, evaluationResponse);

      questionResponse.role = "system";

      const newConversation = [...interviewData.conversation, questionResponse];

      await Interview.findByIdAndUpdate(interview_id, { $set: { conversation: newConversation } }, { new: true, runValidators: true });

      return NextResponse.json({
        success: true,
        data: questionResponse,
      });
    } else {
      // evaluate and generate new question
      evaluationResponse = await evaluateAnswer(jobDescription, resume, question, answer);

      // save user response in database with evaluation
      let newConversation = [
        ...interviewData.conversation,
        {
          question: question,
          answer: answer,
          role: "user",
          ...evaluationResponse,
        },
      ];

      console.log("conversation with user response:", newConversation);

      const updatedData = await Interview.findByIdAndUpdate(
        interview_id,
        { $set: { conversation: newConversation } },
        { new: true, runValidators: true }
      );

      // user does not want to continue
      if (evaluationResponse.exit_interview) {
        // close the interview.
        return NextResponse.json({
          success: true,
          data: {
            question: evaluationResponse.response,
            exit_interview: true,
          },
        });
      }

      if (!evaluationResponse.status) {
        // save in db and return the response
      }

      if (evaluationResponse.ask_same_question) {
        // return the response for the same question
        const conversation = {
          question: evaluationResponse.response,
          reason: evaluationResponse.reason,
          role: "system",
          finish_interview: false,
        };

        const newConversation = [...updatedData.conversation, conversation];

        await Interview.findByIdAndUpdate(interview_id, { $set: { conversation: newConversation } }, { new: true, runValidators: true });

        return NextResponse.json({
          success: true,
          data: conversation,
        });
      }

      if (evaluationResponse.status) {
        // generate new question and return the response

        const questionResponse = await generateInitialQuestion(jobDescription, resume, interviewData.conversation, evaluationResponse);

        questionResponse.role = "system";

        const newConversation = [...updatedData.conversation, questionResponse];

        await Interview.findByIdAndUpdate(interview_id, { $set: { conversation: newConversation } }, { new: true, runValidators: true });

        return NextResponse.json({
          success: true,
          data: questionResponse,
        });
      }
    }
  } catch (error: any) {
    console.log(error);
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to generate new question",
      },
      { status: 500 }
    );
  }
}
