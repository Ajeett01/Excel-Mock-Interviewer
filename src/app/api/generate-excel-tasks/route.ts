import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelQuestionGeneratorService } from "@/services/excel-question-generator.service";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("generate-excel-tasks request received");

  try {
    const body = await req.json();
    const { 
      skillLevel, 
      taskCount, 
      businessScenarios, 
      industry, 
      timeLimit, 
      requiredFunctions 
    } = body;

    // Validate required fields
    if (!skillLevel || !businessScenarios) {
      return NextResponse.json(
        { error: "Missing required fields: skillLevel, businessScenarios" },
        { status: 400 }
      );
    }

    const result = await ExcelQuestionGeneratorService.generatePracticalTasks({
      skillLevel,
      taskCount: taskCount || 3,
      businessScenarios: Array.isArray(businessScenarios) ? businessScenarios : [businessScenarios],
      industry,
      timeLimit,
      requiredFunctions
    });

    if (!result) {
      throw new Error("Failed to generate practical tasks");
    }

    logger.info("Excel practical tasks generated successfully");

    return NextResponse.json(
      { 
        tasks: result.tasks,
        metadata: result.metadata
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error generating Excel practical tasks: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}