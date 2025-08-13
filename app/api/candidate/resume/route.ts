import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import Position from "@/models/position.model";
import PDFParser from "pdf2json";
import Candidate from "@/models/candidate.model";
import { refineCandidateResume } from "@/services/ai.service";

// Utility function to parse PDF and return parsed text as a Promise
function parsePdf(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new (PDFParser as any)(null, 1);

    pdfParser.on("pdfParser_dataError", (errData: any) => {
      reject(errData.parserError);
    });

    pdfParser.on("pdfParser_dataReady", () => {
      resolve((pdfParser as any).getRawTextContent());
    });

    pdfParser.loadPDF(filePath);
  });
}

export async function POST(request: NextRequest) {
  // Parse form data
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const candidateId = formData.get("candidate_id");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  if (file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
  }

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  // Parse PDF directly from buffer
  // Initialize parsedText with empty string
  let parsedText = "";

  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);

    // Fix: assign directly to outer variable, not redeclare with 'let'
    parsedText = await parsePdf(filePath);
  } catch (err) {
    console.error("PDF parsing error:", err);
    return NextResponse.json({ error: "Failed to parse PDF file" }, { status: 500 });
  }

  if (candidateId) {
    const id = typeof candidateId === "string" ? candidateId : String(candidateId);
    try {
      // Ensure positionId is a string and valid ObjectId

      const updated = await Candidate.findByIdAndUpdate(id, { $set: { resume_text: parsedText } }, { new: true, runValidators: true });
      if (!updated) {
        console.error("No document found with the given candidateId:", id);
      } else {
        console.log("Resume updated for candidate:", id);
      }
    } catch (err) {
      console.error("DB update error:", err);
    }

    try {
      console.log("parsedText:", parsedText);
      const jsonResume = await refineCandidateResume(parsedText);

      await Candidate.findByIdAndUpdate(id, { $set: { resume_object: jsonResume } }, { new: true, runValidators: true });
    } catch (error) {
      console.log("Failed to get resume object and to save in DB");
    }
  } else {
    console.error("No candidateId provided");
  }

  return NextResponse.json({
    success: true,
    message: "File uploaded and parsed successfully",
    parsedText: parsedText,
  });
}
