import { OpenAI } from "openai";
import { 
  ExcelAnalytics, 
  SpreadsheetResult, 
  ExcelQuestion, 
  PracticalTask, 
  UserAction, 
  SpreadsheetData,
  ExcelSkillLevel,
  ConceptualProgress,
  PracticalProgress,
  SkillLevelAssessment,
  ExcelSkillBreakdown,
  ImprovementPlan
} from "@/types/excel";
import { EXCEL_EVALUATION_PROMPT } from "@/lib/prompts/excel-questions";
import { FormulaParser, SpreadsheetAnalyzer, TaskEvaluator } from "@/lib/spreadsheet-utils";
import { ExcelSkillConfigService } from "./excel-skill-config.service";

/**
 * Comprehensive Excel evaluation service for both conceptual and practical assessments
 */
export class ExcelEvaluationService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
  });

  /**
   * Evaluate conceptual question response
   */
  static async evaluateConceptualResponse(
    question: ExcelQuestion,
    candidateResponse: string,
    skillLevel: ExcelSkillLevel
  ): Promise<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    followUpSuggested: boolean;
  }> {
    try {
      const prompt = `Evaluate this Excel interview response:

Question: ${question.question}
Category: ${question.category}
Skill Level: ${skillLevel}
Candidate Response: ${candidateResponse}

Evaluate based on:
1. Technical accuracy of the answer
2. Depth of understanding demonstrated
3. Practical application knowledge
4. Communication clarity
5. Completeness of response

Provide evaluation in JSON format:
{
  "score": number (0-100),
  "feedback": "Detailed feedback on the response",
  "strengths": ["List of demonstrated strengths"],
  "improvements": ["Areas for improvement"],
  "followUpSuggested": boolean,
  "technicalAccuracy": number (0-100),
  "practicalUnderstanding": number (0-100),
  "communicationClarity": number (0-100)
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_EVALUATION_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const evaluation = JSON.parse(response);
      
      return {
        score: evaluation.score || 0,
        feedback: evaluation.feedback || "No feedback provided",
        strengths: evaluation.strengths || [],
        improvements: evaluation.improvements || [],
        followUpSuggested: evaluation.followUpSuggested || false
      };
    } catch (error) {
      console.error("Error evaluating conceptual response:", error);
      return {
        score: 0,
        feedback: "Error occurred during evaluation",
        strengths: [],
        improvements: ["Technical evaluation error occurred"],
        followUpSuggested: false
      };
    }
  }

  /**
   * Evaluate practical spreadsheet task
   */
  static async evaluatePracticalTask(
    task: PracticalTask,
    initialState: SpreadsheetData,
    finalState: SpreadsheetData,
    userActions: UserAction[],
    completionTime: number
  ): Promise<SpreadsheetResult> {
    try {
      // Use existing TaskEvaluator for basic evaluation
      const basicResult = TaskEvaluator.evaluateTask(
        task.id,
        initialState,
        finalState,
        task.expected_outcome,
        userActions,
        task.evaluation_criteria
      );

      // Enhanced evaluation with AI analysis
      const enhancedAnalysis = await this.analyzeSpreadsheetWork(
        task,
        finalState,
        userActions,
        basicResult.formulas_used
      );

      // Combine results
      return {
        ...basicResult,
        completion_time: completionTime,
        task_feedback: enhancedAnalysis.feedback,
        accuracy_score: enhancedAnalysis.accuracyScore,
        efficiency_score: enhancedAnalysis.efficiencyScore,
        best_practices_score: enhancedAnalysis.bestPracticesScore
      };
    } catch (error) {
      console.error("Error evaluating practical task:", error);
      
      // Return basic evaluation as fallback
      return TaskEvaluator.evaluateTask(
        task.id,
        initialState,
        finalState,
        task.expected_outcome,
        userActions,
        task.evaluation_criteria
      );
    }
  }

  /**
   * Generate comprehensive Excel analytics for complete interview
   */
  static async generateExcelAnalytics(
    skillLevel: ExcelSkillLevel,
    conceptualProgress: ConceptualProgress,
    practicalProgress: PracticalProgress,
    spreadsheetResults: SpreadsheetResult[],
    totalDuration: number
  ): Promise<ExcelAnalytics> {
    try {
      // Calculate overall scores
      const conceptualScore = conceptualProgress.total_score;
      const practicalScore = (
        practicalProgress.total_accuracy_score +
        practicalProgress.total_efficiency_score +
        practicalProgress.total_best_practices_score
      ) / 3;
      
      const overallScore = (conceptualScore + practicalScore) / 2;

      // Analyze skill breakdown
      const skillBreakdown = await this.analyzeSkillBreakdown(
        spreadsheetResults,
        practicalProgress.functions_demonstrated,
        conceptualProgress.category_scores
      );

      // Assess skill level
      const skillLevelAssessment = await this.assessSkillLevel(
        skillLevel,
        overallScore,
        practicalProgress.functions_demonstrated,
        spreadsheetResults
      );

      // Generate improvement plan
      const improvementPlan = await this.generateImprovementPlan(
        skillLevel,
        skillBreakdown,
        conceptualProgress,
        practicalProgress
      );

      // Generate overall feedback
      const overallFeedback = await this.generateOverallFeedback(
        skillLevel,
        overallScore,
        conceptualProgress,
        practicalProgress,
        totalDuration
      );

      return {
        overall_score: Math.round(overallScore),
        overall_feedback: overallFeedback,
        skill_level_assessment: skillLevelAssessment,
        conceptual_analysis: {
          total_score: conceptualScore,
          category_breakdown: this.convertCategoryScores(conceptualProgress.category_scores),
          knowledge_gaps: await this.identifyKnowledgeGaps(conceptualProgress),
          strengths: await this.identifyStrengths(conceptualProgress)
        },
        practical_analysis: {
          total_score: practicalScore,
          task_breakdown: spreadsheetResults.map(result => ({
            task_id: result.task_id,
            task_name: result.task_name,
            accuracy_score: result.accuracy_score,
            efficiency_score: result.efficiency_score,
            best_practices_score: result.best_practices_score,
            completion_time: result.completion_time,
            feedback: result.task_feedback
          })),
          formula_proficiency: {
            functions_used: practicalProgress.functions_demonstrated,
            functions_mastered: await this.identifyMasteredFunctions(spreadsheetResults),
            functions_struggled: await this.identifyStruggledFunctions(spreadsheetResults),
            complexity_level_achieved: this.calculateComplexityLevel(practicalProgress.functions_demonstrated),
            formula_accuracy_rate: this.calculateFormulaAccuracyRate(spreadsheetResults)
          },
          efficiency_metrics: {
            average_task_completion_time: practicalProgress.time_spent / practicalProgress.tasks_completed,
            optimal_solution_rate: this.calculateOptimalSolutionRate(spreadsheetResults),
            unnecessary_steps_count: this.countUnnecessarySteps(spreadsheetResults),
            keyboard_shortcuts_used: 0 // Would need to track this separately
          },
          best_practices_adherence: {
            score: practicalProgress.total_best_practices_score,
            practices_followed: await this.identifyFollowedPractices(spreadsheetResults),
            practices_violated: await this.identifyViolatedPractices(spreadsheetResults),
            recommendations: await this.generateBestPracticeRecommendations(spreadsheetResults)
          }
        },
        excel_skill_breakdown: skillBreakdown,
        improvement_plan: improvementPlan,
        competency_matrix: await this.generateCompetencyMatrix(
          skillLevel,
          practicalProgress.functions_demonstrated,
          spreadsheetResults
        )
      };
    } catch (error) {
      console.error("Error generating Excel analytics:", error);
      
      // Return basic analytics as fallback
      return this.generateBasicAnalytics(
        skillLevel,
        conceptualProgress,
        practicalProgress,
        spreadsheetResults
      );
    }
  }

  /**
   * Analyze spreadsheet work with AI
   */
  private static async analyzeSpreadsheetWork(
    task: PracticalTask,
    finalState: SpreadsheetData,
    userActions: UserAction[],
    formulasUsed: string[]
  ): Promise<{
    feedback: string;
    accuracyScore: number;
    efficiencyScore: number;
    bestPracticesScore: number;
  }> {
    const prompt = `Analyze this Excel spreadsheet work:

Task: ${task.name}
Description: ${task.description}
Required Functions: ${task.required_functions.join(', ')}
Formulas Used: ${formulasUsed.join(', ')}
Actions Taken: ${userActions.length}

Evaluate the work based on:
1. Accuracy of formulas and calculations
2. Efficiency of approach and solution
3. Adherence to Excel best practices
4. Problem-solving methodology

Provide analysis in JSON format:
{
  "feedback": "Detailed feedback on the spreadsheet work",
  "accuracyScore": number (0-100),
  "efficiencyScore": number (0-100),
  "bestPracticesScore": number (0-100),
  "strengths": ["List of strengths demonstrated"],
  "improvements": ["Areas for improvement"]
}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_EVALUATION_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const analysis = JSON.parse(response);
      
      return {
        feedback: analysis.feedback || "No feedback provided",
        accuracyScore: analysis.accuracyScore || 0,
        efficiencyScore: analysis.efficiencyScore || 0,
        bestPracticesScore: analysis.bestPracticesScore || 0
      };
    } catch (error) {
      console.error("Error analyzing spreadsheet work:", error);
      return {
        feedback: "Error occurred during analysis",
        accuracyScore: 0,
        efficiencyScore: 0,
        bestPracticesScore: 0
      };
    }
  }

  /**
   * Analyze skill breakdown across different Excel competencies
   */
  private static async analyzeSkillBreakdown(
    spreadsheetResults: SpreadsheetResult[],
    functionsUsed: string[],
    categoryScores: { [category: string]: number }
  ): Promise<ExcelSkillBreakdown> {
    const avgAccuracy = spreadsheetResults.reduce((sum, r) => sum + r.accuracy_score, 0) / spreadsheetResults.length;
    const avgEfficiency = spreadsheetResults.reduce((sum, r) => sum + r.efficiency_score, 0) / spreadsheetResults.length;
    const avgBestPractices = spreadsheetResults.reduce((sum, r) => sum + r.best_practices_score, 0) / spreadsheetResults.length;

    return {
      formula_accuracy: {
        score: avgAccuracy,
        feedback: avgAccuracy >= 80 ? "Excellent formula accuracy" : "Room for improvement in formula accuracy",
        examples: [],
        improvement_areas: avgAccuracy < 80 ? ["Formula construction", "Function usage"] : []
      },
      data_analysis: {
        score: categoryScores['Data Analysis'] || 0,
        feedback: "Data analysis skills assessment",
        examples: [],
        improvement_areas: []
      },
      efficiency: {
        score: avgEfficiency,
        feedback: avgEfficiency >= 80 ? "Efficient problem-solving approach" : "Could improve efficiency",
        examples: [],
        improvement_areas: avgEfficiency < 80 ? ["Solution optimization", "Function selection"] : []
      },
      best_practices: {
        score: avgBestPractices,
        feedback: avgBestPractices >= 80 ? "Good adherence to best practices" : "Need to improve best practices",
        examples: [],
        improvement_areas: avgBestPractices < 80 ? ["Formatting", "Documentation", "Structure"] : []
      },
      presentation: {
        score: 75, // Default score, would need specific evaluation
        feedback: "Presentation skills assessment",
        examples: [],
        improvement_areas: []
      },
      problem_solving: {
        score: (avgAccuracy + avgEfficiency) / 2,
        feedback: "Problem-solving approach evaluation",
        examples: [],
        improvement_areas: []
      }
    };
  }

  /**
   * Assess skill level based on performance
   */
  private static async assessSkillLevel(
    currentLevel: ExcelSkillLevel,
    overallScore: number,
    functionsUsed: string[],
    spreadsheetResults: SpreadsheetResult[]
  ): Promise<SkillLevelAssessment> {
    const recommendedLevel = await ExcelSkillConfigService.getRecommendedLevel(
      currentLevel,
      overallScore,
      functionsUsed
    );

    return {
      current_level: currentLevel,
      recommended_level: recommendedLevel,
      readiness_score: overallScore,
      confidence_interval: this.calculateConfidenceInterval(overallScore, spreadsheetResults.length)
    };
  }

  /**
   * Generate improvement plan
   */
  private static async generateImprovementPlan(
    skillLevel: ExcelSkillLevel,
    skillBreakdown: ExcelSkillBreakdown,
    conceptualProgress: ConceptualProgress,
    practicalProgress: PracticalProgress
  ): Promise<ImprovementPlan[]> {
    const plan: ImprovementPlan[] = [];

    // Analyze weak areas and create improvement items
    Object.entries(skillBreakdown).forEach(([skill, breakdown]) => {
      if (breakdown.score < 70) {
        plan.push({
          priority: breakdown.score < 50 ? 'high' : 'medium',
          skill: skill.replace('_', ' '),
          current_level: breakdown.score,
          target_level: 80,
          recommendation: `Focus on improving ${skill.replace('_', ' ')} through targeted practice`,
          resources: [
            {
              type: 'tutorial',
              title: `${skill.replace('_', ' ')} Tutorial`,
              description: `Comprehensive guide to improve ${skill.replace('_', ' ')} skills`
            }
          ],
          estimated_time: '2-3 weeks'
        });
      }
    });

    return plan;
  }

  // Helper methods for calculations
  private static calculateComplexityLevel(functionsUsed: string[]): number {
    const complexityMap: { [key: string]: number } = {
      'SUM': 1, 'AVERAGE': 1, 'COUNT': 1,
      'IF': 2, 'VLOOKUP': 2, 'SUMIF': 2,
      'INDEX': 3, 'MATCH': 3, 'INDIRECT': 4
    };

    const maxComplexity = Math.max(...functionsUsed.map(func => complexityMap[func] || 1));
    return maxComplexity;
  }

  private static calculateFormulaAccuracyRate(results: SpreadsheetResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.accuracy_score, 0) / results.length;
  }

  private static calculateOptimalSolutionRate(results: SpreadsheetResult[]): number {
    if (results.length === 0) return 0;
    return results.reduce((sum, r) => sum + r.efficiency_score, 0) / results.length;
  }

  private static countUnnecessarySteps(results: SpreadsheetResult[]): number {
    // This would require more detailed action analysis
    return 0;
  }

  private static calculateConfidenceInterval(score: number, sampleSize: number): number {
    // Simple confidence interval calculation
    const margin = Math.sqrt((score * (100 - score)) / sampleSize) * 1.96;
    return Math.min(margin, 20); // Cap at 20%
  }

  // Placeholder methods that would need full implementation
  private static async identifyKnowledgeGaps(progress: ConceptualProgress): Promise<string[]> {
    return Object.entries(progress.category_scores)
      .filter(([_, score]) => score < 60)
      .map(([category, _]) => category);
  }

  private static async identifyStrengths(progress: ConceptualProgress): Promise<string[]> {
    return Object.entries(progress.category_scores)
      .filter(([_, score]) => score >= 80)
      .map(([category, _]) => category);
  }

  private static async identifyMasteredFunctions(results: SpreadsheetResult[]): Promise<string[]> {
    const functionScores: { [func: string]: number[] } = {};
    
    results.forEach(result => {
      result.functions_used.forEach(func => {
        if (!functionScores[func]) functionScores[func] = [];
        functionScores[func].push(result.accuracy_score);
      });
    });

    return Object.entries(functionScores)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length >= 80)
      .map(([func, _]) => func);
  }

  private static async identifyStruggledFunctions(results: SpreadsheetResult[]): Promise<string[]> {
    const functionScores: { [func: string]: number[] } = {};
    
    results.forEach(result => {
      result.functions_used.forEach(func => {
        if (!functionScores[func]) functionScores[func] = [];
        functionScores[func].push(result.accuracy_score);
      });
    });

    return Object.entries(functionScores)
      .filter(([_, scores]) => scores.reduce((a, b) => a + b, 0) / scores.length < 60)
      .map(([func, _]) => func);
  }

  private static async identifyFollowedPractices(results: SpreadsheetResult[]): Promise<string[]> {
    return ["Proper cell referencing", "Clear formula structure"];
  }

  private static async identifyViolatedPractices(results: SpreadsheetResult[]): Promise<string[]> {
    return [];
  }

  private static async generateBestPracticeRecommendations(results: SpreadsheetResult[]): Promise<string[]> {
    return ["Use absolute references when appropriate", "Add comments to complex formulas"];
  }

  private static async generateCompetencyMatrix(
    skillLevel: ExcelSkillLevel,
    functionsUsed: string[],
    results: SpreadsheetResult[]
  ): Promise<any> {
    return {
      basic_functions: { level: 'intermediate', score: 75, evidence: [] },
      intermediate_functions: { level: 'beginner', score: 60, evidence: [] },
      advanced_functions: { level: 'novice', score: 40, evidence: [] },
      data_analysis: { level: 'intermediate', score: 70, evidence: [] },
      visualization: { level: 'beginner', score: 50, evidence: [] },
      automation: { level: 'novice', score: 30, evidence: [] }
    };
  }

  private static async generateOverallFeedback(
    skillLevel: ExcelSkillLevel,
    overallScore: number,
    conceptualProgress: ConceptualProgress,
    practicalProgress: PracticalProgress,
    totalDuration: number
  ): Promise<string> {
    const prompt = `Generate overall feedback for an Excel interview:

Skill Level: ${skillLevel}
Overall Score: ${overallScore}%
Conceptual Score: ${conceptualProgress.total_score}%
Practical Score: ${(practicalProgress.total_accuracy_score + practicalProgress.total_efficiency_score + practicalProgress.total_best_practices_score) / 3}%
Functions Used: ${practicalProgress.functions_demonstrated.join(', ')}
Duration: ${Math.round(totalDuration / 1000 / 60)} minutes

Provide constructive, encouraging feedback that:
1. Summarizes overall performance
2. Highlights key strengths
3. Identifies main areas for improvement
4. Provides actionable next steps
5. Maintains a positive, professional tone

Keep the feedback concise (2-3 paragraphs) and actionable.`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: EXCEL_EVALUATION_PROMPT,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 300,
      });

      return completion.choices[0]?.message?.content?.trim() || "Overall performance evaluation completed.";
    } catch (error) {
      console.error("Error generating overall feedback:", error);
      return `You demonstrated ${skillLevel} level Excel skills with an overall score of ${Math.round(overallScore)}%. Continue practicing to improve your proficiency.`;
    }
  }

  /**
   * Convert category scores to CategoryScore objects
   */
  private static convertCategoryScores(categoryScores: { [category: string]: number }): { [category: string]: any } {
    const converted: { [category: string]: any } = {};
    
    Object.entries(categoryScores).forEach(([category, score]) => {
      converted[category] = {
        score: score,
        max_score: 100,
        percentage: score,
        feedback: score >= 80 ? `Excellent ${category} skills` : score >= 60 ? `Good ${category} skills` : `Needs improvement in ${category}`
      };
    });
    
    return converted;
  }

  private static generateBasicAnalytics(
    skillLevel: ExcelSkillLevel,
    conceptualProgress: ConceptualProgress,
    practicalProgress: PracticalProgress,
    spreadsheetResults: SpreadsheetResult[]
  ): ExcelAnalytics {
    const overallScore = (conceptualProgress.total_score + practicalProgress.total_accuracy_score) / 2;

    return {
      overall_score: Math.round(overallScore),
      overall_feedback: `You demonstrated ${skillLevel} level Excel skills with an overall score of ${Math.round(overallScore)}%.`,
      skill_level_assessment: {
        current_level: skillLevel,
        recommended_level: skillLevel,
        readiness_score: overallScore,
        confidence_interval: 15
      },
      conceptual_analysis: {
        total_score: conceptualProgress.total_score,
        category_breakdown: this.convertCategoryScores(conceptualProgress.category_scores),
        knowledge_gaps: [],
        strengths: []
      },
      practical_analysis: {
        total_score: practicalProgress.total_accuracy_score,
        task_breakdown: [],
        formula_proficiency: {
          functions_used: practicalProgress.functions_demonstrated,
          functions_mastered: [],
          functions_struggled: [],
          complexity_level_achieved: 1,
          formula_accuracy_rate: practicalProgress.total_accuracy_score
        },
        efficiency_metrics: {
          average_task_completion_time: practicalProgress.time_spent / Math.max(practicalProgress.tasks_completed, 1),
          optimal_solution_rate: practicalProgress.total_efficiency_score,
          unnecessary_steps_count: 0,
          keyboard_shortcuts_used: 0
        },
        best_practices_adherence: {
          score: practicalProgress.total_best_practices_score,
          practices_followed: [],
          practices_violated: [],
          recommendations: []
        }
      },
      excel_skill_breakdown: {
        formula_accuracy: { score: practicalProgress.total_accuracy_score, feedback: "", examples: [], improvement_areas: [] },
        data_analysis: { score: 70, feedback: "", examples: [], improvement_areas: [] },
        efficiency: { score: practicalProgress.total_efficiency_score, feedback: "", examples: [], improvement_areas: [] },
        best_practices: { score: practicalProgress.total_best_practices_score, feedback: "", examples: [], improvement_areas: [] },
        presentation: { score: 70, feedback: "", examples: [], improvement_areas: [] },
        problem_solving: { score: overallScore, feedback: "", examples: [], improvement_areas: [] }
      },
      improvement_plan: [],
      competency_matrix: {
        basic_functions: { level: 'intermediate', score: 70, evidence: [] },
        intermediate_functions: { level: 'beginner', score: 50, evidence: [] },
        advanced_functions: { level: 'novice', score: 30, evidence: [] },
        data_analysis: { level: 'intermediate', score: 60, evidence: [] },
        visualization: { level: 'beginner', score: 40, evidence: [] },
        automation: { level: 'novice', score: 20, evidence: [] }
      }
    };
  }
}

export default ExcelEvaluationService;