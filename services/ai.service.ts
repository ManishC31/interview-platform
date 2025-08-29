import { AzureOpenAI } from "openai";

export const refineJobDescription = async (jdText: string) => {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const prompt = `
      You are an AI assistant that extracts structured data from job descriptions.
      Read the provided job description carefully and return ONLY a valid JSON object with the following exact structure and keys (do not omit any keys, fill with null or empty array if missing).

      JSON structure:
      {
        "company": null,
        "job_title": null,
        "location": {
          "city": null,
          "country": null,
          "work_mode": null
        },
        "employment_type": null,
        "department": null,
        "about_role": null,
        "responsibilities": [],
        "requirements": {
          "education": null,
          "experience": null,
          "skills": []
        },
        "nice_to_have": [],
        "salary": {
          "min": null,
          "max": null,
          "currency": null,
          "type": null
        },
        "benefits": [],
        "application": {
          "email": null,
          "instructions": null
        }
      }

      Instructions:
      - Populate the fields with extracted values from the job description.
      - If any field is missing, keep it as null (for strings/numbers) or [] (for arrays).
      - Return ONLY the JSON object. Do not add explanations, markdown, or any other text.`;

    const response = await client.chat.completions.create({
      model: "gpt-4-preview", //  model: "gpt-4o-mini", --> cost-effective
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: jdText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const data = response.choices?.[0]?.message?.content || "{}";
    return JSON.parse(data);
  } catch (error) {
    console.error("Err in refineJobDescription:", error);
    throw error;
  }
};

export const refineCandidateResume = async (resumeText: string) => {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const prompt = `
      You are an AI assistant that extracts structured data from candidate resumes.
      Read the provided resume carefully and return ONLY a valid JSON object with the following exact structure and keys (do not omit any keys, fill with null or empty array if missing).

      JSON structure:
      {
        "personal_info": {
          "full_name": null,
          "email": null,
          "phone": null,
          "location": {
            "city": null,
            "country": null
          },
          "linkedin": null,
          "website": null,
          "github": null,
          "portfolio": null
        },
        "summary": null,
        "education": [
          {
            "degree": null,
            "field_of_study": null,
            "institution": null,
            "location": null,
            "start_date": null,
            "end_date": null,
            "grade": null
          }
        ],
        "experience": [
          {
            "job_title": null,
            "company": null,
            "location": null,
            "start_date": null,
            "end_date": null,
            "description": null,
            "achievements": []
          }
        ],
        "skills": {
          "technical": [],
          "soft": []
        },
        "certifications": [
          {
            "name": null,
            "issuer": null,
            "issue_date": null,
            "expiry_date": null
          }
        ],
        "projects": [
          {
            "name": null,
            "description": null,
            "technologies": [],
            "link": null
          }
        ],
        "publications": [
          {
            "title": null,
            "publisher": null,
            "date": null,
            "link": null
          }
        ],
        "languages": [],
        "awards": [
          {
            "title": null,
            "issuer": null,
            "date": null,
            "description": null
          }
        ],
        "interests": [],
        "references": [
          {
            "name": null,
            "position": null,
            "company": null,
            "email": null,
            "phone": null
          }
        ]
      }

      Instructions:
      - Populate the fields with extracted values from the resume.
      - If any field is missing, keep it as null (for strings) or [] (for arrays).
      - Preserve original wording for descriptions, summaries, and achievements.
      - Return ONLY the JSON object. Do not add explanations, markdown, or any other text.`;

    const response = await client.chat.completions.create({
      model: "gpt-4-preview", //  model: "gpt-4o-mini", --> cost-effective
      messages: [
        {
          role: "system",
          content: prompt,
        },
        {
          role: "user",
          content: resumeText,
        },
      ],
      temperature: 0.7,
      max_tokens: 1024,
    });

    const data = response.choices?.[0]?.message?.content || "{}";
    return JSON.parse(data);
  } catch (error) {
    console.error("Err in refineCandidateResume:", error);
    throw error;
  }
};

export const evaluateAnswer = async (jobDescription: Object, resume: Object, question: string, answer: string) => {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const prompt = `
    You are an AI evaluator for a job interview platform.
    Your role is to assess whether a candidate's answer is relevant, respectful, and useful for the interview.

    Inputs:
    - Job Description (JSON): ${JSON.stringify(jobDescription)}
    - Candidate Resume (JSON): ${JSON.stringify(resume)}
    - Interview Question: "${question}"
    - Candidate Answer: "${answer}"

    Evaluate the answer based on:
    1. Relevance: Does it meaningfully respond to the question considering the job description and candidate’s resume?
    2. Language: Does it contain any abusive, offensive, or inappropriate words?
    3. Completeness: Does it address the main part of the question?

    If the answer is irrelevant, provide a corrective follow-up message explaining what you expect (e.g., if the candidate talks about unrelated topics, ask them to stick to the question).
    If the answer contains abusive or offensive words, warn them politely about language without asking the same question again.

    Return ONLY a JSON object in this format:

    {
      "status": boolean,
      "reason": "short reason",
      "ask_same_question": boolean,
      "response": "message or null"
      "exit_interview": true or null
    }

    Rules:
    - If abusive language is found, set "ask_same_question" to false and give a warning in "response".
    - If the response is completely irrelevant (off-topic and unrelated), set "ask_same_question" to true and provide a clarifying re-prompt in "response".
    - If the response is partially relevant but missing details or the candidate has nothing significant to share, set "ask_same_question" to false and move on to the next question.
    - If relevant, set "ask_same_question" to false and "response" to null.
    - If candidate is not interested to continue the interview (e.g., expresses desire to stop), set "exit_interview" to true; otherwise keep it null.
    - Be polite and concise in "response".
    `;

    const response = await client.chat.completions.create({
      model: "gpt-4-preview",
      messages: [{ role: "system", content: prompt }],
      temperature: 0,
      max_tokens: 1024,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    throw error;
  }
};

export const generateInitialQuestion = async (jobDescription: Object, resume: Object, conversation: any, lastAnswerAnalysis: Object | null) => {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const systemPrompt = `
      You are an AI interviewer conducting a professional job interview for a candidate.

      Inputs:
      - Job Description (JSON): ${JSON.stringify(jobDescription)}
      - Candidate Resume (JSON): ${JSON.stringify(resume)}
      - Previous Conversation (JSON Array): ${JSON.stringify(conversation)}
      - Last Answer Analysis (JSON): ${JSON.stringify(lastAnswerAnalysis)}

      Your task:
      1. Generate the next interview question.
      2. Ensure the total interview has at most 12 questions. If enough information has been collected to evaluate the candidate properly, end earlier by setting "finish_interview" to true.
      3. If the conversation is empty, generate a strong and relevant opening question regarding the introduction of the candidate.
      4. Consider the candidate's last answer analysis:
        - If "ask_same_question" is true, rephrase or clarify the last question only once and if user does not want to answer then move to the next question.
        - If the answer was abusive, acknowledge it politely but do not repeat the same question. Move on to a different question or finish the interview.
      5. Ask questions that help analyze all key aspects of the candidate:
        - Education background
        - Professional experience
        - Key projects handled
        - Certifications or training
        - Skills relevant to the job description
        - Behavioral and situational questions
      6. Make your questions conversational, concise, and professional. Only one question at a time.

      Return ONLY a JSON object in this format:
      {
        "question": "string - the next interview question",
        "finish_interview": boolean,
        "reason": "short reasoning for why you chose this question"
      }
      `;

    const response = await client.chat.completions.create({
      model: "gpt-4-preview",
      messages: [{ role: "system", content: systemPrompt }],
      temperature: 0.7,
      max_tokens: 1024,
    });

    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.log("Err in generateInitialQuestion:", error);
    throw error;
  }
};

export const generateQuestion = async (jobDescription: Object, resume: Object, conversation: any, lastQuestion: string, lastAnswer: string) => {
  try {
    const client = new AzureOpenAI({
      endpoint: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION,
    });

    const prompt = `
      ROLE:
      You are an AI interviewer conducting a structured professional interview.
      Your responsibilities are:
      1. Evaluate the candidate’s most recent answer for relevance, completeness, and tone.
      2. Decide whether to rephrase the last question, ask a follow-up, switch to a new question, or end the interview.
      3. Maintain professionalism, empathy, and adaptability for real-world scenarios.
      4. Follow the interview structure and category order until the interview ends.

      CONTEXT PROVIDED TO YOU:
      - Resume data (JSON): ${JSON.stringify(resume)}
      - Job Description (JSON): ${JSON.stringify(jobDescription)}
      - Conversation history (Array): ${JSON.stringify(conversation)}
      - Last Asked Question: "${lastQuestion}"
      - Last Answer: "${lastAnswer}"

      EVALUATION PROCESS:
      Step 1 — Check for special cases:
      - Abusive Words → status: false, ask_same_question: false, exit_interview: true, response: "firm warning"
      - Emotional / Sensitive Situation (illness, bereavement, distress) → status: false, exit_interview: true, response: "empathetic message"
      - Casual Disinterest (“not in the mood”, “don’t want to do this now”) → status: false, exit_interview: true, response: "polite exit message"

      Step 2 — Check for multi-part question:
      - If the last question contains multiple requests (e.g., uses "and", "also", "as well as", commas for separate asks), split into sub-questions.
      - Determine if the candidate answered:
          - All sub-questions → "Fully relevant"
          - At least one sub-question → "Partially relevant"
          - None → "Irrelevant"
      - For partially relevant → status: true, ask_same_question: false, response: "follow-up needed" and generate a follow-up question to cover the missing parts.

      Step 3 — Check general classification:
      Possible categories:
      - Empty Response
      - Abusive Words
      - Random Words
      - Avoidance
      - Not Interested
      - Emotional / Sensitive Situation
      - Personal Interest
      - Irrelevant Domain
      - Generic Chatter
      - Confused/Unclear
      - Fake/Crafted
      - Relevant Response

      RULES:
      - Empty / Irrelevant / Random / Avoidance:
          → status: false, ask_same_question: true, response: "clarification request"
      - Partially Relevant:
          → status: true, ask_same_question: false, response: "follow-up"
      - Fully Relevant:
          → status: true, ask_same_question: false, response: null
      - Abusive / Emotional / Disinterest:
          → status: false, exit_interview: true, response: "appropriate message"
      - 3+ consecutive invalid/fake answers → move to Closing immediately.

      INTERVIEW STRUCTURE:
      Categories in order:
      1. Introduction
      2. Experience & Achievements
      3. Domain Specific
      4. Behavioral & Situational
      5. Role-Specific
      6. Closing

      Rules:
      - Max 15 total questions
      - Max 3 questions per category
      - Must ask at least 3 job-specific questions not already in resume
      - If all categories covered or strong performance → move to Closing
      - If emotional or disinterest detected → exit gracefully

      OUTPUT FORMAT:
      You must return ONLY a valid JSON object. Do not include \`\`\`json, code blocks, markdown formatting, or any extra text before or after the JSON.
      Return exactly one JSON object in the following structure:

      {
        "evaluation": {
          "status": true | false,
          "reason": "short reason like 'Partially relevant', 'Irrelevant', 'Abusive language', 'Emotional situation', 'Casual disinterest', 'Fully relevant'",
          "ask_same_question": true | false,
          "exit_interview": true | null,
          "response": "string | null (warning, empathy, clarification, follow-up, or null)"
        },
        "next": {
          "question": "Next question or follow-up to ask the candidate, or null if exiting",
          "category": "Introduction | Experience & Achievements | Domain Specific | Behavioral & Situational | Role-Specific | Closing | null",
          "question_count": {
            // Preserve the entire existing 'question_count' object provided in context, including 'total' and all category counts.
            // Increment 'total' by 1.
            // If the current category already exists in 'per_category', increment its count by 1.
            // If the current category does not exist, add it to 'per_category' with a value of 1.
            // Do not remove or overwrite any previous category data.
            // Always return the full updated object containing all previously tracked categories and their counts.
            "total": number,
            "per_category": {
              "categoryName": number
            }
          }
          "strategy_note": "Why this decision was made (e.g., 'Follow-up for missing scenario', 'Ending due to emotional situation', 'Rephrasing due to irrelevance')",
          "isClosed": true | false
        }
      }`;

    const response = await client.chat.completions.create({
      model: "gpt-4-preview",
      messages: [{ role: "system", content: prompt }],
      temperature: 0.7,
      max_tokens: 3000,
    });

    console.log("response:", response.choices[0].message.content);
    return JSON.parse(response.choices[0].message.content || "{}");
  } catch (error) {
    console.error("Err in generateQuestion:", error);
    throw error;
  }
};
