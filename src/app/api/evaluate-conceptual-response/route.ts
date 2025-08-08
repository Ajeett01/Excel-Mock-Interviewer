import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelEvaluationService } from "@/services/excel-evaluation.service";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("evaluate-conceptual-response request received");

  try {
    const body = await req.json();
    const {
      question,
      candidateResponse,
      skillLevel
    } = body;

    // Validate required fields
    if (!question || !candidateResponse || !skillLevel) {
      return NextResponse.json(
        { error: "Missing required fields: question, candidateResponse, skillLevel" },
        { status: 400 }
      );
    }

    const evaluation = await ExcelEvaluationService.evaluateConceptualResponse(
      question,
      candidateResponse,
      skillLevel
    );

    logger.info("Conceptual response evaluation completed successfully");

    return NextResponse.json(
      { evaluation },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error evaluating conceptual response: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}