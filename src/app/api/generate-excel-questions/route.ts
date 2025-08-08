import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelQuestionGeneratorService } from "@/services/excel-question-generator.service";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("generate-excel-questions request received");

  try {
    const body = await req.json();
    const { 
      skillLevel, 
      categories, 
      questionCount 
    } = body;

    // Validate required fields
    if (!skillLevel) {
      return NextResponse.json(
        { error: "Missing required field: skillLevel" },
        { status: 400 }
      );
    }

    const result = await ExcelQuestionGeneratorService.generateConceptualQuestions({
      skillLevel,
      questionCount: questionCount || 5,
      focusAreas: categories
    });

    if (!result) {
      throw new Error("Failed to generate questions");
    }

    const questions = result.questions;

    logger.info("Excel questions generated successfully");

    return NextResponse.json(
      { questions },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating Excel questions: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}