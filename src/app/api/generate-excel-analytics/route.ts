import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelEvaluationService } from "@/services/excel-evaluation.service";

export const maxDuration = 120;

export async function POST(req: Request) {
  logger.info("generate-excel-analytics request received");

  try {
    const body = await req.json();
    const { 
      skillLevel, 
      conceptualProgress, 
      practicalProgress, 
      spreadsheetResults, 
      totalDuration 
    } = body;

    // Validate required fields
    if (!skillLevel || !conceptualProgress || !practicalProgress || !spreadsheetResults || totalDuration === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: skillLevel, conceptualProgress, practicalProgress, spreadsheetResults, totalDuration" },
        { status: 400 }
      );
    }

    const analytics = await ExcelEvaluationService.generateExcelAnalytics(
      skillLevel,
      conceptualProgress,
      practicalProgress,
      spreadsheetResults,
      totalDuration
    );

    logger.info("Excel analytics generated successfully");

    return NextResponse.json(
      { analytics },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating Excel analytics: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}