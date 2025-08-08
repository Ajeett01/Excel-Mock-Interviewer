import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { ExcelInterviewSessionService } from "@/services/excel-interview-session.service";

export const maxDuration = 60;

export async function POST(req: Request) {
  logger.info("excel-interview-session POST request received");

  try {
    const body = await req.json();
    const { action, sessionData } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing required field: action" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'create':
        if (!sessionData) {
          return NextResponse.json(
            { error: "Missing sessionData for create action" },
            { status: 400 }
          );
        }
        result = await ExcelInterviewSessionService.createSession(sessionData);
        break;

      case 'update':
        if (!sessionData || !sessionData.id) {
          return NextResponse.json(
            { error: "Missing sessionData.id for update action" },
            { status: 400 }
          );
        }
        result = await ExcelInterviewSessionService.updateSession(sessionData.id, sessionData);
        break;

      default:
        return NextResponse.json(
          { error: "Invalid action. Supported actions: create, update" },
          { status: 400 }
        );
    }

    logger.info(`Excel interview session ${action} completed successfully`);

    return NextResponse.json(
      { result },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error in excel-interview-session: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  logger.info("excel-interview-session GET request received");

  try {
    const { searchParams } = new URL(req.url);
    const responseId = searchParams.get('responseId');

    if (!responseId) {
      return NextResponse.json(
        { error: "Missing required parameter: responseId" },
        { status: 400 }
      );
    }

    const session = await ExcelInterviewSessionService.getSessionByResponseId(parseInt(responseId));

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    logger.info("Excel interview session retrieved successfully");

    return NextResponse.json(
      { session },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Error retrieving excel interview session: " + String(error));

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}