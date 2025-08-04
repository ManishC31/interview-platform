import Candidate, { ICandidate } from "@/models/candidate.model";
import Interview, { IInterview } from "@/models/interview.model";
import { connectToDatabase } from "@/lib/db";

export const assignNewInterview = async (candidateId: string, positionId: string, organizationId: number): Promise<IInterview> => {
  try {
    await connectToDatabase();
    const interviewResponse: IInterview = await Interview.create({
      position_id: positionId,
      candidate_id: candidateId,
      organization_id: organizationId,
    });

    return interviewResponse;
  } catch (error) {
    console.error("Err in assignNewInterview:", error);
    throw error;
  }
};
