import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelEvaluationService } from "@/services/excel-evaluation.service";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("evaluate-spreadsheet-work request received");

  try {
    const body = await req.json();
    const { 
      task, 
      initialState, 
      finalState, 
      userActions, 
      completionTime 
    } = body;

    // Validate required fields
    if (!task || !initialState || !finalState || !userActions || completionTime === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: task, initialState, finalState, userActions, completionTime" },
        { status: 400 }
      );
    }

    const evaluation = await ExcelEvaluationService.evaluatePracticalTask(
      task,
      initialState,
      finalState,
      userActions,
      completionTime
    );

    logger.info("Spreadsheet work evaluation completed successfully");

    return NextResponse.json(
      { evaluation },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error evaluating spreadsheet work: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}