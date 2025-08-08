import { OpenAI } from "openai";
import { ExcelSkillLevel, ExcelQuestion, PracticalTask, ExcelInterviewConfig } from "@/types/excel";
import { 
  EXCEL_SYSTEM_PROMPT, 
  generateExcelConceptualQuestionsPrompt, 
  generateExcelPracticalTasksPrompt,
  generateExcelInterviewFlowPrompt
} from "@/lib/prompts/excel-questions";
import { ExcelSkillConfigService } from "./excel-skill-config.service";

/**
 * Service for generating Excel-specific interview questions and tasks
 */
export class ExcelQuestionGeneratorService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
  });

  /**
   * Generate conceptual Excel questions based on skill level and context
   */
  static async generateConceptualQuestions(params: {
    skillLevel: ExcelSkillLevel;
    questionCount: number;
    businessContext?: string;
    industry?: string;
    jobRole?: string;
    focusAreas?: string[];
  }): Promise<{
    questions: ExcelQuestion[];
    metadata: {
      skillLevel: ExcelSkillLevel;
      totalQuestions: number;
      estimatedDuration: string;
    };
  } | null> {
    try {
      const prompt = generateExcelConceptualQuestionsPrompt(params);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const parsedResponse = JSON.parse(response);
      
      // Transform the response to match our ExcelQuestion interface
      const questions: ExcelQuestion[] = parsedResponse.questions.map((q: any, index: number) => ({
        id: q.id || `conceptual_${index + 1}`,
        question: q.question,
        type: 'conceptual' as const,
        skill_level: params.skillLevel,
        category: q.category || 'General',
        expected_functions: q.skillsAssessed || [],
        difficulty_rating: q.difficulty || 5,
        follow_up_count: q.followUpQuestions?.length || 0
      }));

      return {
        questions,
        metadata: {
          skillLevel: parsedResponse.skillLevel,
          totalQuestions: parsedResponse.totalQuestions,
          estimatedDuration: parsedResponse.estimatedDuration
        }
      };
    } catch (error) {
      console.error("Error generating conceptual questions:", error);
      return null;
    }
  }

  /**
   * Generate practical Excel tasks based on skill level and business scenarios
   */
  static async generatePracticalTasks(params: {
    skillLevel: ExcelSkillLevel;
    taskCount: number;
    businessScenarios: string[];
    industry?: string;
    timeLimit?: number;
    requiredFunctions?: string[];
  }): Promise<{
    tasks: PracticalTask[];
    metadata: {
      skillLevel: ExcelSkillLevel;
      totalTasks: number;
      estimatedTotalTime: string;
      progressionNotes: string;
    };
  } | null> {
    try {
      const prompt = generateExcelPracticalTasksPrompt(params);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const parsedResponse = JSON.parse(response);
      
      // Transform the response to match our PracticalTask interface
      const tasks: PracticalTask[] = parsedResponse.tasks.map((t: any) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        scenario: t.scenario,
        skill_level: params.skillLevel,
        initial_data: t.initialData,
        expected_outcome: t.expectedOutcome,
        evaluation_criteria: {
          formula_accuracy_weight: 40,
          efficiency_weight: 30,
          presentation_weight: 15,
          best_practices_weight: 15,
          required_formulas: t.requiredFunctions || [],
          optional_formulas: [],
          expected_charts: []
        },
        time_limit: parseInt(t.timeLimit) || 15,
        difficulty_rating: t.difficulty || 5,
        business_context: t.businessRelevance,
        required_functions: t.requiredFunctions || []
      }));

      return {
        tasks,
        metadata: {
          skillLevel: parsedResponse.skillLevel,
          totalTasks: parsedResponse.totalTasks,
          estimatedTotalTime: parsedResponse.estimatedTotalTime,
          progressionNotes: parsedResponse.progressionNotes
        }
      };
    } catch (error) {
      console.error("Error generating practical tasks:", error);
      return null;
    }
  }

  /**
   * Generate complete Excel interview content (questions + tasks)
   */
  static async generateCompleteInterview(config: ExcelInterviewConfig): Promise<{
    conceptualQuestions: ExcelQuestion[];
    practicalTasks: PracticalTask[];
    interviewFlow: any;
    metadata: {
      totalDuration: number;
      skillLevel: ExcelSkillLevel;
      questionCount: number;
      taskCount: number;
    };
  } | null> {
    try {
      // Get skill configuration for context
      const skillConfig = await ExcelSkillConfigService.getConfigByLevel(config.skill_level);
      
      // Generate conceptual questions
      const conceptualResult = await this.generateConceptualQuestions({
        skillLevel: config.skill_level,
        questionCount: config.conceptual_question_count,
        businessContext: config.business_scenarios.join(', '),
        industry: config.industry_context,
        focusAreas: skillConfig?.conceptual_topics
      });

      if (!conceptualResult) {
        throw new Error("Failed to generate conceptual questions");
      }

      // Generate practical tasks
      const practicalResult = await this.generatePracticalTasks({
        skillLevel: config.skill_level,
        taskCount: config.practical_task_count,
        businessScenarios: config.business_scenarios,
        industry: config.industry_context,
        timeLimit: Math.floor(config.time_allocation.practical / config.practical_task_count),
        requiredFunctions: skillConfig?.function_requirements
      });

      if (!practicalResult) {
        throw new Error("Failed to generate practical tasks");
      }

      // Generate interview flow
      const interviewFlow = await this.generateInterviewFlow({
        skillLevel: config.skill_level,
        conceptualQuestions: conceptualResult.questions,
        practicalTasks: practicalResult.tasks,
        candidateName: "Candidate", // Will be replaced during interview
        interviewDuration: config.time_allocation.total
      });

      return {
        conceptualQuestions: conceptualResult.questions,
        practicalTasks: practicalResult.tasks,
        interviewFlow,
        metadata: {
          totalDuration: config.time_allocation.total,
          skillLevel: config.skill_level,
          questionCount: conceptualResult.questions.length,
          taskCount: practicalResult.tasks.length
        }
      };
    } catch (error) {
      console.error("Error generating complete interview:", error);
      return null;
    }
  }

  /**
   * Generate interview flow and conversation prompts
   */
  static async generateInterviewFlow(params: {
    skillLevel: ExcelSkillLevel;
    conceptualQuestions: ExcelQuestion[];
    practicalTasks: PracticalTask[];
    candidateName: string;
    interviewDuration: number;
  }): Promise<any> {
    try {
      const prompt = generateExcelInterviewFlowPrompt(params);

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.8, // Higher temperature for more natural conversation
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(response);
    } catch (error) {
      console.error("Error generating interview flow:", error);
      return null;
    }
  }

  /**
   * Generate adaptive follow-up questions based on candidate response
   */
  static async generateFollowUpQuestion(params: {
    originalQuestion: string;
    candidateResponse: string;
    skillLevel: ExcelSkillLevel;
    category: string;
  }): Promise<string | null> {
    try {
      const prompt = `Based on the candidate's response to an Excel interview question, generate an appropriate follow-up question.

Original Question: ${params.originalQuestion}
Candidate Response: ${params.candidateResponse}
Skill Level: ${params.skillLevel}
Category: ${params.category}

Generate a follow-up question that:
1. Probes deeper into their understanding
2. Clarifies any ambiguous points in their response
3. Tests practical application of their stated knowledge
4. Is appropriate for the ${params.skillLevel} skill level

Return only the follow-up question text, no additional formatting.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      });

      return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error("Error generating follow-up question:", error);
      return null;
    }
  }

  /**
   * Generate hints for practical tasks when candidate is struggling
   */
  static async generateTaskHint(params: {
    task: PracticalTask;
    candidateProgress: string;
    timeRemaining: number;
  }): Promise<string | null> {
    try {
      const prompt = `A candidate is working on an Excel practical task and appears to be struggling. Generate a helpful hint.

Task: ${params.task.name}
Description: ${params.task.description}
Candidate's Current Progress: ${params.candidateProgress}
Time Remaining: ${params.timeRemaining} minutes

Generate a hint that:
1. Guides them toward the solution without giving it away
2. Suggests the right Excel function or approach to use
3. Is encouraging and supportive
4. Helps them make progress within the remaining time

Return only the hint text, no additional formatting.`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 150,
      });

      return completion.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error("Error generating task hint:", error);
      return null;
    }
  }

  /**
   * Validate generated questions and tasks for quality
   */
  static validateGeneratedContent(
    questions: ExcelQuestion[],
    tasks: PracticalTask[],
    skillLevel: ExcelSkillLevel
  ): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Validate questions
    questions.forEach((question, index) => {
      if (!question.question || question.question.length < 10) {
        issues.push(`Question ${index + 1}: Too short or empty`);
      }
      if (!question.category) {
        issues.push(`Question ${index + 1}: Missing category`);
      }
      if (question.difficulty_rating < 1 || question.difficulty_rating > 10) {
        issues.push(`Question ${index + 1}: Invalid difficulty rating`);
      }
    });

    // Validate tasks
    tasks.forEach((task, index) => {
      if (!task.name || !task.description) {
        issues.push(`Task ${index + 1}: Missing name or description`);
      }
      if (!task.initial_data || !task.initial_data.sheets) {
        issues.push(`Task ${index + 1}: Missing initial data`);
      }
      if (!task.required_functions || task.required_functions.length === 0) {
        suggestions.push(`Task ${index + 1}: Consider specifying required functions`);
      }
    });

    // Check skill level consistency
    const inconsistentQuestions = questions.filter(q => q.skill_level !== skillLevel);
    if (inconsistentQuestions.length > 0) {
      issues.push(`${inconsistentQuestions.length} questions have inconsistent skill level`);
    }

    const inconsistentTasks = tasks.filter(t => t.skill_level !== skillLevel);
    if (inconsistentTasks.length > 0) {
      issues.push(`${inconsistentTasks.length} tasks have inconsistent skill level`);
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }
}

export default ExcelQuestionGeneratorService;