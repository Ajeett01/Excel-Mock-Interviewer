import { NextRequest, NextResponse } from "next/server";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { ExcelQuestionGeneratorService } from "@/services/excel-question-generator.service";
import { CreateExcelInterviewRequest } from "@/types/excel";
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const payload: CreateExcelInterviewRequest = await request.json();
    
    logger.info("Creating Excel interview", {
      name: payload.name,
      skillLevel: payload.skill_level,
      userId: payload.user_id,
      organizationId: payload.organization_id
    });

    // Generate Excel questions and tasks server-side
    const questionsResult = await ExcelQuestionGeneratorService.generateConceptualQuestions({
      skillLevel: payload.skill_level,
      questionCount: payload.config.conceptual_question_count,
      businessContext: payload.config.business_scenarios.join(', '),
      industry: payload.config.industry_context,
      focusAreas: []
    });

    const tasksResult = await ExcelQuestionGeneratorService.generatePracticalTasks({
      skillLevel: payload.skill_level,
      taskCount: payload.config.practical_task_count,
      businessScenarios: payload.config.business_scenarios,
      industry: payload.config.industry_context
    });

    if (!questionsResult || !tasksResult) {
      throw new Error("Failed to generate Excel content");
    }

    // Generate unique identifiers for the interview
    const interviewId = crypto.randomUUID();
    const readableSlug = `excel-${payload.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;

    // Create the interview with Excel-specific data
    const interviewData = {
      id: interviewId,
      name: payload.name,
      description: payload.description,
      objective: payload.objective,
      organization_id: payload.organization_id,
      user_id: payload.user_id,
      interviewer_id: payload.interviewer_id,
      is_active: true,
      is_anonymous: false,
      is_archived: false,
      theme_color: '#4f46e5', // Default theme color
      url: readableSlug, // Set URL for navigation
      readable_slug: readableSlug, // Set readable slug for navigation
      interview_type: 'excel' as const,
      excel_skill_level: payload.skill_level,
      questions: questionsResult.questions,
      practical_tasks: tasksResult.tasks,
      conceptual_question_count: questionsResult.questions.length,
      practical_task_count: tasksResult.tasks.length,
      question_count: questionsResult.questions.length + tasksResult.tasks.length,
      time_duration: `${payload.config.time_allocation.total} minutes`,
      response_count: 0,
      insights: [],
      respondents: [],
      quotes: []
    };

    // Use server-side Supabase client
    const supabase = createServerComponentClient({ cookies });
    
    const { error, data } = await supabase
      .from("interview")
      .insert(interviewData)
      .select();

    if (error) {
      logger.error("Error creating Excel interview in database", { error });
      return NextResponse.json(
        { error: "Failed to create Excel interview" },
        { status: 500 }
      );
    }

    logger.info("Excel interview created successfully", { 
      interviewId: data[0].id 
    });

    return NextResponse.json(data[0]);
  } catch (error) {
    logger.error("Error in create-excel-interview API", { error });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}