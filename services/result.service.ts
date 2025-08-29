import "dotenv/config";

import Interview from "@/models/interview.model";
import { AzureOpenAI } from "openai";
import Position from "@/models/position.model";
import Candidate from "@/models/candidate.model";
import { connectToDatabase } from "@/lib/db";

export const processInterviewResult = async (job: any) => {
  console.log("job:", job.data.interview_id)
  const interviewId = job.data.interview_id;

  try {
    await connectToDatabase();

    const interviewData = await Interview.findById(interviewId)
      .populate({ path: "position_id", model: Position })
      .populate({ path: "candidate_id", model: Candidate })
      .exec();

    if (!interviewData) {
      throw new Error("Failed to get the interview information");
    }
    const evaluationPrompt = `
        Analyze the following interview conversation to assess the overall relevance and quality of the interviewee's responses to the interviewer’s questions, using the provided resume and job description as reference points.

        - Resume: ${interviewData.candidate_id.resume_object}
        - Job Description: ${interviewData.position_id.jd_object}
        - Conversation: ${interviewData.conversation}

        ### Evaluation Criteria & Weights:
        1. Relevance to Questions (20%)
        2. Experience & Background Fit (20%)
        3. Role-Specific & Technical Knowledge (25%)
        4. Communication Skills (15%)
        5. Emotional Intelligence & Professionalism (10%)
        6. Depth & Precision (10%) — rigor depends on {strict_level} (0 = general relevance acceptable, 1 = highly specific required).

        ### Scoring & Output Requirements:
        - Score each criterion (0–100).
        - Apply weights to compute overall relevance score (0–100).
        - Provide recommendation: "Match" or "No Match".
        - Include factor-based breakdown across soft skills.
        - Add strengths & weaknesses as arrays.
        - Give a concise 40–50 word explanation.
        - Include a confidence level (0–100).

        ### Final Response:
        Return ONLY valid JSON without markdown, without code fences, without explanations, without extra text. Just raw JSON in the following structure:

        {
          "overall_relevance_score": <number>,
          "recommendation": "<Match|No Match>",
          "criteria_scores": {
            "relevance_to_questions": <number>,
            "experience_background_fit": <number>,
            "role_specific_knowledge": <number>,
            "communication_skills": <number>,
            "emotional_intelligence": <number>,
            "depth_precision": <number>
          },
          "criteria_weights": {
            "relevance_to_questions": 0.20,
            "experience_background_fit": 0.20,
            "role_specific_knowledge": 0.25,
            "communication_skills": 0.15,
            "emotional_intelligence": 0.10,
            "depth_precision": 0.10
          },
          "factor_based_breakdown": {
            "influence_persuasion": <number>,
            "achievement_drive": <number>,
            "resilience_stress_tolerance": <number>,
            "communication_skills": <number>,
            "problem_solving_adaptability": <number>
          },
          "strengths": [
            "<string>",
            "<string>",
            "<string>"
          ],
          "weaknesses": [
            "<string>",
            "<string>",
            "<string>"
          ],
          "comprehensive_explanation": "<40-50 word explanation>",
          "confidence_level": <number>
        }`;

    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const response = await client.chat.completions.create({
      model: "gpt-4-preview",
      messages: [{ role: "system", content: evaluationPrompt }],
      temperature: 0,
      max_tokens: 1024,
    });

    console.log("response:", response.choices[0].message.content);

    const responseContent = response.choices[0].message.content;
    if (!responseContent) {
      throw new Error("No response content received from OpenAI");
    }

    const result = JSON.parse(responseContent);

    await Interview.findByIdAndUpdate(interviewId, { result: result, result_status: "completed" }, { new: true });

    return { success: true, interviewId };
  } catch (error) {
    throw error;
  }
};
