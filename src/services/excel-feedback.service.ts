import { OpenAI } from "openai";
import { 
  ExcelAnalytics, 
  ExcelSkillLevel, 
  ConceptualProgress, 
  PracticalProgress, 
  SpreadsheetResult,
  ImprovementPlan,
  ExcelSkillBreakdown
} from "@/types/excel";
import { EXCEL_EVALUATION_PROMPT } from "@/lib/prompts/excel-questions";

/**
 * Service for generating personalized Excel interview feedback
 */
export class ExcelFeedbackService {
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 3,
  });

  /**
   * Generate comprehensive personalized feedback
   */
  static async generatePersonalizedFeedback(params: {
    analytics: ExcelAnalytics;
    skillLevel: ExcelSkillLevel;
    candidateName?: string;
    interviewDuration: number;
    specificGoals?: string[];
  }): Promise<{
    summary: string;
    strengths: string[];
    improvements: string[];
    actionPlan: string[];
    motivationalMessage: string;
  }> {
    const { analytics, skillLevel, candidateName, interviewDuration, specificGoals } = params;

    try {
      const prompt = this.buildFeedbackPrompt(analytics, skillLevel, candidateName, interviewDuration, specificGoals);

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
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      const feedback = JSON.parse(response);
      
      return {
        summary: feedback.summary || "Interview completed successfully.",
        strengths: feedback.strengths || [],
        improvements: feedback.improvements || [],
        actionPlan: feedback.actionPlan || [],
        motivationalMessage: feedback.motivationalMessage || "Keep practicing to improve your Excel skills!"
      };
    } catch (error) {
      console.error("Error generating personalized feedback:", error);
      
      return this.generateFallbackFeedback(analytics, skillLevel);
    }
  }

  /**
   * Generate skill-specific improvement suggestions
   */
  static generateSkillImprovements(skillBreakdown: ExcelSkillBreakdown): {
    [skill: string]: {
      currentLevel: string;
      suggestions: string[];
      resources: string[];
      practiceExercises: string[];
    };
  } {
    const improvements: any = {};

    Object.entries(skillBreakdown).forEach(([skill, data]) => {
      const level = this.getSkillLevelDescription(data.score);
      
      improvements[skill] = {
        currentLevel: level,
        suggestions: this.getSkillSuggestions(skill, data.score),
        resources: this.getSkillResources(skill),
        practiceExercises: this.getPracticeExercises(skill)
      };
    });

    return improvements;
  }

  /**
   * Generate comparative feedback against industry standards
   */
  static async generateComparativeFeedback(params: {
    analytics: ExcelAnalytics;
    skillLevel: ExcelSkillLevel;
    industry?: string;
    jobRole?: string;
  }): Promise<{
    industryComparison: string;
    roleComparison: string;
    marketPosition: string;
    competitiveAdvantages: string[];
    areasForImprovement: string[];
  }> {
    const { analytics, skillLevel, industry, jobRole } = params;

    try {
      const prompt = `Provide comparative feedback for Excel skills assessment:

Overall Score: ${analytics.overall_score}%
Skill Level: ${skillLevel}
Industry: ${industry || 'General Business'}
Job Role: ${jobRole || 'General'}

Conceptual Score: ${analytics.conceptual_analysis.total_score}%
Practical Score: ${analytics.practical_analysis.total_score}%

Key Strengths: ${analytics.conceptual_analysis.strengths.join(', ')}
Knowledge Gaps: ${analytics.conceptual_analysis.knowledge_gaps.join(', ')}

Functions Demonstrated: ${analytics.practical_analysis.formula_proficiency.functions_used.join(', ')}

Provide comparative analysis in JSON format:
{
  "industryComparison": "How this performance compares to industry standards",
  "roleComparison": "How this performance compares to typical job role requirements",
  "marketPosition": "Overall market position assessment",
  "competitiveAdvantages": ["List of competitive advantages"],
  "areasForImprovement": ["Areas that need improvement for market competitiveness"]
}`;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an Excel skills assessment expert with knowledge of industry standards and job market requirements.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.6,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from OpenAI");
      }

      return JSON.parse(response);
    } catch (error) {
      console.error("Error generating comparative feedback:", error);
      
      return this.generateFallbackComparativeFeedback(analytics, skillLevel);
    }
  }

  /**
   * Generate learning recommendations based on performance
   */
  static generateLearningRecommendations(params: {
    analytics: ExcelAnalytics;
    timeAvailable: 'limited' | 'moderate' | 'extensive';
    learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
    currentRole?: string;
  }): {
    immediate: LearningRecommendation[];
    shortTerm: LearningRecommendation[];
    longTerm: LearningRecommendation[];
  } {
    const { analytics, timeAvailable, learningStyle, currentRole } = params;

    // Analyze weak areas
    const weakAreas = this.identifyWeakAreas(analytics.excel_skill_breakdown);
    const strongAreas = this.identifyStrongAreas(analytics.excel_skill_breakdown);

    return {
      immediate: this.generateImmediateRecommendations(weakAreas, learningStyle, timeAvailable),
      shortTerm: this.generateShortTermRecommendations(weakAreas, strongAreas, currentRole),
      longTerm: this.generateLongTermRecommendations(analytics.skill_level_assessment.recommended_level)
    };
  }

  /**
   * Generate motivational and encouraging feedback
   */
  static generateMotivationalFeedback(params: {
    analytics: ExcelAnalytics;
    improvementFromPrevious?: number;
    personalGoals?: string[];
  }): {
    encouragement: string;
    achievements: string[];
    progressHighlights: string[];
    nextMilestones: string[];
  } {
    const { analytics, improvementFromPrevious, personalGoals } = params;

    const achievements = this.identifyAchievements(analytics);
    const progressHighlights = this.generateProgressHighlights(analytics, improvementFromPrevious);
    const nextMilestones = this.generateNextMilestones(analytics, personalGoals);

    const encouragement = this.generateEncouragementMessage(
      analytics.overall_score,
      achievements.length,
      progressHighlights.length
    );

    return {
      encouragement,
      achievements,
      progressHighlights,
      nextMilestones
    };
  }

  // Private helper methods

  private static buildFeedbackPrompt(
    analytics: ExcelAnalytics,
    skillLevel: ExcelSkillLevel,
    candidateName?: string,
    interviewDuration?: number,
    specificGoals?: string[]
  ): string {
    const name = candidateName || "Candidate";
    const duration = interviewDuration ? Math.round(interviewDuration / 1000 / 60) : 0;

    return `Generate personalized feedback for ${name}'s Excel interview:

Performance Summary:
- Overall Score: ${analytics.overall_score}%
- Skill Level Assessed: ${skillLevel}
- Interview Duration: ${duration} minutes
- Recommended Level: ${analytics.skill_level_assessment.recommended_level}

Conceptual Performance:
- Total Score: ${analytics.conceptual_analysis.total_score}%
- Strengths: ${analytics.conceptual_analysis.strengths.join(', ')}
- Knowledge Gaps: ${analytics.conceptual_analysis.knowledge_gaps.join(', ')}

Practical Performance:
- Total Score: ${analytics.practical_analysis.total_score}%
- Functions Used: ${analytics.practical_analysis.formula_proficiency.functions_used.join(', ')}
- Formula Accuracy: ${analytics.practical_analysis.formula_proficiency.formula_accuracy_rate}%
- Efficiency Score: ${analytics.practical_analysis.efficiency_metrics.optimal_solution_rate}%

Skill Breakdown:
${Object.entries(analytics.excel_skill_breakdown).map(([skill, data]) => 
  `- ${skill.replace('_', ' ')}: ${data.score}% - ${data.feedback}`
).join('\n')}

${specificGoals ? `Specific Goals: ${specificGoals.join(', ')}` : ''}

Provide personalized feedback in JSON format:
{
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["List of 3-5 key strengths demonstrated"],
  "improvements": ["List of 3-5 specific areas for improvement"],
  "actionPlan": ["List of 4-6 specific actionable steps"],
  "motivationalMessage": "Encouraging message for continued learning"
}`;
  }

  private static generateFallbackFeedback(analytics: ExcelAnalytics, skillLevel: ExcelSkillLevel) {
    return {
      summary: `You completed the ${skillLevel} level Excel interview with an overall score of ${analytics.overall_score}%. This demonstrates solid foundational skills with room for continued growth.`,
      strengths: [
        "Completed all interview components",
        "Demonstrated basic Excel knowledge",
        "Showed problem-solving approach"
      ],
      improvements: [
        "Practice more complex Excel functions",
        "Improve formula accuracy",
        "Focus on efficiency in problem-solving"
      ],
      actionPlan: [
        "Review Excel function documentation",
        "Practice with real-world datasets",
        "Take online Excel courses",
        "Work on timed exercises"
      ],
      motivationalMessage: "Keep practicing! Excel mastery comes with consistent effort and hands-on experience."
    };
  }

  private static generateFallbackComparativeFeedback(analytics: ExcelAnalytics, skillLevel: ExcelSkillLevel) {
    return {
      industryComparison: `Your ${analytics.overall_score}% score is ${analytics.overall_score >= 75 ? 'above' : 'at'} industry average for ${skillLevel} level positions.`,
      roleComparison: "Your skills align well with typical job requirements in your field.",
      marketPosition: analytics.overall_score >= 80 ? "Strong market position" : "Competitive with room for improvement",
      competitiveAdvantages: ["Solid Excel foundation", "Problem-solving approach"],
      areasForImprovement: ["Advanced functions", "Data analysis techniques"]
    };
  }

  private static getSkillLevelDescription(score: number): string {
    if (score >= 90) {
      return "Expert";
    }
    if (score >= 80) {
      return "Advanced";
    }
    if (score >= 70) {
      return "Intermediate";
    }
    if (score >= 60) {
      return "Basic";
    }
    
    return "Beginner";
  }

  private static getSkillSuggestions(skill: string, score: number): string[] {
    const suggestions: { [key: string]: string[] } = {
      formula_accuracy: [
        "Practice writing formulas step by step",
        "Use Excel's formula auditing tools",
        "Double-check cell references"
      ],
      data_analysis: [
        "Learn pivot tables and charts",
        "Practice with real datasets",
        "Study statistical functions"
      ],
      efficiency: [
        "Learn keyboard shortcuts",
        "Use Excel templates",
        "Practice time management"
      ],
      best_practices: [
        "Use consistent formatting",
        "Add comments to complex formulas",
        "Organize data properly"
      ]
    };

    return suggestions[skill] || ["Continue practicing this skill area"];
  }

  private static getSkillResources(skill: string): string[] {
    const resources: { [key: string]: string[] } = {
      formula_accuracy: [
        "Excel Formula Reference Guide",
        "Microsoft Excel Help Documentation",
        "Online Excel Formula Courses"
      ],
      data_analysis: [
        "Data Analysis with Excel Course",
        "Pivot Table Tutorials",
        "Statistical Analysis Resources"
      ],
      efficiency: [
        "Excel Keyboard Shortcuts Guide",
        "Time Management for Excel Users",
        "Excel Productivity Tips"
      ]
    };

    return resources[skill] || ["General Excel learning resources"];
  }

  private static getPracticeExercises(skill: string): string[] {
    const exercises: { [key: string]: string[] } = {
      formula_accuracy: [
        "Build a personal budget calculator",
        "Create a grade tracking system",
        "Design a loan payment calculator"
      ],
      data_analysis: [
        "Analyze sales data trends",
        "Create customer segmentation analysis",
        "Build performance dashboards"
      ],
      efficiency: [
        "Complete timed Excel challenges",
        "Practice keyboard-only navigation",
        "Build templates for common tasks"
      ]
    };

    return exercises[skill] || ["Practice with real-world Excel projects"];
  }

  private static identifyWeakAreas(skillBreakdown: ExcelSkillBreakdown): string[] {
    return Object.entries(skillBreakdown)
      .filter(([_, data]) => data.score < 70)
      .map(([skill, _]) => skill);
  }

  private static identifyStrongAreas(skillBreakdown: ExcelSkillBreakdown): string[] {
    return Object.entries(skillBreakdown)
      .filter(([_, data]) => data.score >= 80)
      .map(([skill, _]) => skill);
  }

  private static generateImmediateRecommendations(
    weakAreas: string[],
    learningStyle: string,
    timeAvailable: string
  ): LearningRecommendation[] {
    const count = timeAvailable === 'limited' ? 2 : 3;
    
    return weakAreas.slice(0, count).map(area => ({
      title: `Improve ${area.replace('_', ' ')}`,
      description: `Focus on ${area.replace('_', ' ')} fundamentals`,
      timeEstimate: '1-2 hours',
      difficulty: 'beginner',
      type: learningStyle === 'hands-on' ? 'practice' : 'tutorial'
    }));
  }

  private static generateShortTermRecommendations(
    weakAreas: string[],
    strongAreas: string[],
    currentRole?: string
  ): LearningRecommendation[] {
    return [
      {
        title: 'Advanced Excel Functions',
        description: 'Master complex functions and nested formulas',
        timeEstimate: '2-3 weeks',
        difficulty: 'intermediate',
        type: 'course'
      },
      {
        title: 'Real-world Projects',
        description: 'Apply skills to job-relevant scenarios',
        timeEstimate: '1-2 weeks',
        difficulty: 'intermediate',
        type: 'practice'
      }
    ];
  }

  private static generateLongTermRecommendations(recommendedLevel: ExcelSkillLevel): LearningRecommendation[] {
    return [
      {
        title: `${recommendedLevel} Level Mastery`,
        description: `Achieve full proficiency at ${recommendedLevel} level`,
        timeEstimate: '2-3 months',
        difficulty: 'advanced',
        type: 'course'
      }
    ];
  }

  private static identifyAchievements(analytics: ExcelAnalytics): string[] {
    const achievements: string[] = [];

    if (analytics.overall_score >= 90) {
      achievements.push("Excellent overall performance");
    }
    if (analytics.conceptual_analysis.total_score >= 85) {
      achievements.push("Strong conceptual knowledge");
    }
    if (analytics.practical_analysis.total_score >= 85) {
      achievements.push("Excellent practical skills");
    }
    if (analytics.practical_analysis.formula_proficiency.functions_used.length >= 5) {
      achievements.push("Diverse function knowledge");
    }

    return achievements;
  }

  private static generateProgressHighlights(analytics: ExcelAnalytics, improvement?: number): string[] {
    const highlights: string[] = [];

    if (improvement && improvement > 0) {
      highlights.push(`Improved by ${improvement}% from previous attempt`);
    }

    if (analytics.overall_score >= 75) {
      highlights.push("Achieved above-average performance");
    }

    return highlights;
  }

  private static generateNextMilestones(analytics: ExcelAnalytics, goals?: string[]): string[] {
    const milestones: string[] = [];

    if (analytics.skill_level_assessment.readiness_score >= 80) {
      milestones.push(`Ready to advance to ${analytics.skill_level_assessment.recommended_level} level`);
    }

    if (goals) {
      goals.forEach(goal => {
        milestones.push(`Work towards: ${goal}`);
      });
    }

    return milestones;
  }

  private static generateEncouragementMessage(
    overallScore: number,
    achievementCount: number,
    progressCount: number
  ): string {
    if (overallScore >= 85 && achievementCount >= 2) {
      return "Outstanding performance! You're demonstrating excellent Excel skills and are well-positioned for advanced challenges.";
    }
    if (overallScore >= 70) {
      return "Great job! You're showing solid Excel competency with clear areas of strength. Keep building on this foundation.";
    }
    
    return "Good effort! Every Excel expert started where you are now. Focus on consistent practice and you'll see significant improvement.";
  }
}

interface LearningRecommendation {
  title: string;
  description: string;
  timeEstimate: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  type: 'tutorial' | 'practice' | 'course' | 'documentation';
}

export default ExcelFeedbackService;