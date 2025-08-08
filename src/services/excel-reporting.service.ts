import { 
  ExcelAnalytics, 
  ExcelSkillLevel, 
  ExcelInterviewSession,
  SpreadsheetResult,
  ConceptualProgress,
  PracticalProgress
} from "@/types/excel";
import { ExcelAnalyticsService } from "./excel-analytics.service";
import { ExcelFeedbackService } from "./excel-feedback.service";

/**
 * Service for generating comprehensive Excel interview reports
 */
export class ExcelReportingService {
  /**
   * Generate executive summary report
   */
  static async generateExecutiveSummary(params: {
    analytics: ExcelAnalytics;
    session: ExcelInterviewSession;
    candidateName?: string;
    position?: string;
  }): Promise<ExecutiveSummary> {
    const { analytics, session, candidateName, position } = params;

    const duration = session.total_duration ? Math.round(session.total_duration / 1000 / 60) : 0;
    
    return {
      candidate: {
        name: candidateName || 'Anonymous',
        position: position || 'Not specified',
        assessmentDate: session.start_time,
        duration: `${duration} minutes`
      },
      performance: {
        overallScore: analytics.overall_score,
        skillLevel: analytics.skill_level_assessment.current_level,
        recommendedLevel: analytics.skill_level_assessment.recommended_level,
        readinessScore: analytics.skill_level_assessment.readiness_score
      },
      keyFindings: {
        strengths: analytics.conceptual_analysis.strengths.slice(0, 3),
        improvements: analytics.conceptual_analysis.knowledge_gaps.slice(0, 3),
        criticalSkills: this.identifyCriticalSkills(analytics.excel_skill_breakdown)
      },
      recommendation: this.generateHiringRecommendation(analytics),
      nextSteps: this.generateNextSteps(analytics)
    };
  }

  /**
   * Generate detailed technical report
   */
  static async generateTechnicalReport(params: {
    analytics: ExcelAnalytics;
    session: ExcelInterviewSession;
    spreadsheetResults: SpreadsheetResult[];
  }): Promise<TechnicalReport> {
    const { analytics, session, spreadsheetResults } = params;

    return {
      assessmentOverview: {
        sessionId: session.id.toString(),
        startTime: session.start_time,
        endTime: session.end_time,
        totalDuration: session.total_duration,
        currentState: session.current_state,
        stateTransitions: session.state_history.length
      },
      conceptualAssessment: {
        totalQuestions: session.conceptual_progress.questions_answered,
        correctAnswers: session.conceptual_progress.correct_answers,
        overallScore: session.conceptual_progress.total_score,
        categoryBreakdown: analytics.conceptual_analysis.category_breakdown,
        timeSpent: session.conceptual_progress.time_spent,
        strengths: analytics.conceptual_analysis.strengths,
        knowledgeGaps: analytics.conceptual_analysis.knowledge_gaps
      },
      practicalAssessment: {
        totalTasks: session.practical_progress.tasks_completed,
        overallScore: analytics.practical_analysis.total_score,
        taskBreakdown: analytics.practical_analysis.task_breakdown,
        formulaProficiency: analytics.practical_analysis.formula_proficiency,
        efficiencyMetrics: analytics.practical_analysis.efficiency_metrics,
        bestPracticesScore: analytics.practical_analysis.best_practices_adherence,
        timeSpent: session.practical_progress.time_spent
      },
      skillAnalysis: {
        breakdown: analytics.excel_skill_breakdown,
        competencyMatrix: analytics.competency_matrix,
        improvementPlan: analytics.improvement_plan
      },
      spreadsheetWork: spreadsheetResults.map(result => ({
        taskId: result.task_id,
        taskName: result.task_name,
        completionTime: result.completion_time,
        accuracyScore: result.accuracy_score,
        efficiencyScore: result.efficiency_score,
        bestPracticesScore: result.best_practices_score,
        formulasUsed: result.formulas_used,
        functionsUsed: result.functions_used,
        feedback: result.task_feedback
      }))
    };
  }

  /**
   * Generate comparison report against benchmarks
   */
  static async generateBenchmarkReport(params: {
    analytics: ExcelAnalytics;
    skillLevel: ExcelSkillLevel;
    industry?: string;
    position?: string;
  }): Promise<BenchmarkReport> {
    const { analytics, skillLevel, industry, position } = params;

    // Generate benchmark analysis
    const benchmarkAnalysis = await ExcelAnalyticsService.generateBenchmarkAnalysis({
      skillLevel,
      overallScore: analytics.overall_score,
      conceptualScore: analytics.conceptual_analysis.total_score,
      practicalScore: analytics.practical_analysis.total_score,
      completionTime: 0 // Would need actual completion time
    });

    return {
      benchmarkComparison: {
        percentileRank: benchmarkAnalysis.percentileRank,
        comparisonToAverage: benchmarkAnalysis.comparisonToAverage,
        competitivePosition: benchmarkAnalysis.competitivePosition,
        industryContext: industry || 'General Business',
        positionContext: position || 'General Role'
      },
      skillComparison: this.generateSkillComparison(analytics.excel_skill_breakdown, skillLevel),
      marketAnalysis: {
        demandForSkills: this.analyzeDemandForSkills(analytics.practical_analysis.formula_proficiency.functions_used),
        salaryImplications: this.analyzeSalaryImplications(analytics.overall_score, skillLevel),
        careerProgression: this.analyzeCareerProgression(analytics.skill_level_assessment)
      },
      recommendations: {
        immediate: "Focus on identified weak areas",
        shortTerm: "Build advanced skills in high-demand areas",
        longTerm: "Pursue specialized Excel certifications"
      }
    };
  }

  /**
   * Generate learning and development report
   */
  static async generateLearningReport(params: {
    analytics: ExcelAnalytics;
    learningStyle?: 'visual' | 'hands-on' | 'reading' | 'mixed';
    timeAvailable?: 'limited' | 'moderate' | 'extensive';
    currentRole?: string;
  }): Promise<LearningReport> {
    const { analytics, learningStyle = 'mixed', timeAvailable = 'moderate', currentRole } = params;

    // Generate learning recommendations
    const learningRecommendations = ExcelFeedbackService.generateLearningRecommendations({
      analytics,
      timeAvailable,
      learningStyle,
      currentRole
    });

    return {
      currentSkillAssessment: {
        overallLevel: analytics.skill_level_assessment.current_level,
        recommendedLevel: analytics.skill_level_assessment.recommended_level,
        readinessScore: analytics.skill_level_assessment.readiness_score,
        skillGaps: this.identifySkillGaps(analytics.excel_skill_breakdown)
      },
      learningPath: {
        immediate: learningRecommendations.immediate,
        shortTerm: learningRecommendations.shortTerm,
        longTerm: learningRecommendations.longTerm
      },
      resourceRecommendations: this.generateResourceRecommendations(analytics, learningStyle),
      practiceExercises: this.generatePracticeExercises(analytics.excel_skill_breakdown),
      progressTracking: {
        milestones: this.generateMilestones(analytics),
        assessmentSchedule: this.generateAssessmentSchedule(timeAvailable),
        successMetrics: this.generateSuccessMetrics(analytics.skill_level_assessment.recommended_level)
      }
    };
  }

  /**
   * Export report data in various formats
   */
  static async exportReport(
    reportData: any,
    format: 'json' | 'csv' | 'pdf'
  ): Promise<{
    data: string | Buffer;
    filename: string;
    mimeType: string;
  }> {
    const timestamp = new Date().toISOString().split('T')[0];
    
    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(reportData, null, 2),
          filename: `excel-interview-report-${timestamp}.json`,
          mimeType: 'application/json'
        };
      
      case 'csv':
        const csvData = this.convertToCSV(reportData);
        return {
          data: csvData,
          filename: `excel-interview-report-${timestamp}.csv`,
          mimeType: 'text/csv'
        };
      
      case 'pdf':
        // In a real implementation, this would generate a PDF
        return {
          data: Buffer.from('PDF report would be generated here'),
          filename: `excel-interview-report-${timestamp}.pdf`,
          mimeType: 'application/pdf'
        };
      
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // Private helper methods

  private static identifyCriticalSkills(skillBreakdown: any): string[] {
    return Object.entries(skillBreakdown)
      .filter(([_, data]: [string, any]) => data.score < 60)
      .map(([skill, _]) => skill.replace('_', ' '))
      .slice(0, 3);
  }

  private static generateHiringRecommendation(analytics: ExcelAnalytics): string {
    const score = analytics.overall_score;
    
    if (score >= 85) {
      return "Strong hire - Excellent Excel skills demonstrated";
    }
    if (score >= 75) {
      return "Hire - Good Excel skills with minor areas for development";
    }
    if (score >= 65) {
      return "Consider with training - Basic skills present, requires development";
    }
    
    return "Not recommended - Significant skill gaps identified";
  }

  private static generateNextSteps(analytics: ExcelAnalytics): string[] {
    const steps: string[] = [];
    
    if (analytics.overall_score >= 75) {
      steps.push("Proceed with technical interview");
      steps.push("Discuss advanced Excel projects");
    } else {
      steps.push("Provide Excel training resources");
      steps.push("Schedule follow-up assessment");
    }
    
    steps.push("Review specific skill gaps");
    
    return steps;
  }

  private static generateSkillComparison(skillBreakdown: any, skillLevel: ExcelSkillLevel): any {
    // Mock comparison data - in real implementation, this would come from database
    const benchmarks = {
      'basic': { formula_accuracy: 65, data_analysis: 60, efficiency: 55 },
      'intermediate': { formula_accuracy: 75, data_analysis: 70, efficiency: 68 },
      'advanced': { formula_accuracy: 85, data_analysis: 82, efficiency: 80 }
    };

    const benchmark = benchmarks[skillLevel];
    const comparison: any = {};

    Object.entries(skillBreakdown).forEach(([skill, data]: [string, any]) => {
      const benchmarkScore = benchmark[skill as keyof typeof benchmark] || 70;
      comparison[skill] = {
        candidateScore: data.score,
        benchmarkScore,
        difference: data.score - benchmarkScore,
        performance: data.score >= benchmarkScore ? 'above' : 'below'
      };
    });

    return comparison;
  }

  private static analyzeDemandForSkills(functionsUsed: string[]): string {
    const highDemandFunctions = ['VLOOKUP', 'PIVOT', 'INDEX', 'MATCH', 'SUMIFS'];
    const usedHighDemand = functionsUsed.filter(func => 
      highDemandFunctions.some(hdf => func.toUpperCase().includes(hdf))
    );

    if (usedHighDemand.length >= 3) {
      return "High - Demonstrates in-demand Excel skills";
    }
    if (usedHighDemand.length >= 1) {
      return "Moderate - Some high-demand skills present";
    }
    
    return "Low - Focus on learning high-demand functions";
  }

  private static analyzeSalaryImplications(overallScore: number, skillLevel: ExcelSkillLevel): string {
    if (overallScore >= 85) {
      return "Premium salary range - Top-tier Excel skills";
    }
    if (overallScore >= 75) {
      return "Above-average salary range - Strong Excel competency";
    }
    if (overallScore >= 65) {
      return "Market-rate salary range - Adequate Excel skills";
    }
    
    return "Below-market salary range - Excel skills need development";
  }

  private static analyzeCareerProgression(skillAssessment: any): string {
    if (skillAssessment.readiness_score >= 80) {
      return "Ready for senior roles requiring advanced Excel skills";
    }
    if (skillAssessment.readiness_score >= 70) {
      return "Suitable for mid-level positions with Excel requirements";
    }
    
    return "Entry-level positions with Excel training opportunities";
  }

  private static identifySkillGaps(skillBreakdown: any): string[] {
    return Object.entries(skillBreakdown)
      .filter(([_, data]: [string, any]) => data.score < 70)
      .map(([skill, _]) => skill.replace('_', ' '));
  }

  private static generateResourceRecommendations(analytics: ExcelAnalytics, learningStyle: string): string[] {
    const resources: { [key: string]: string[] } = {
      visual: [
        "Excel video tutorials",
        "Interactive Excel courses",
        "Excel dashboard examples"
      ],
      'hands-on': [
        "Excel practice workbooks",
        "Real-world Excel projects",
        "Excel simulation exercises"
      ],
      reading: [
        "Excel reference books",
        "Excel function documentation",
        "Excel best practices guides"
      ],
      mixed: [
        "Comprehensive Excel courses",
        "Excel certification programs",
        "Excel community forums"
      ]
    };

    return resources[learningStyle] || resources.mixed;
  }

  private static generatePracticeExercises(skillBreakdown: any): string[] {
    const exercises: string[] = [];
    
    Object.entries(skillBreakdown).forEach(([skill, data]: [string, any]) => {
      if (data.score < 75) {
        exercises.push(`Practice ${skill.replace('_', ' ')} exercises`);
      }
    });

    return exercises;
  }

  private static generateMilestones(analytics: ExcelAnalytics): string[] {
    return [
      "Achieve 80% accuracy in formula construction",
      "Master 5 new Excel functions",
      "Complete advanced data analysis project",
      "Demonstrate Excel best practices consistently"
    ];
  }

  private static generateAssessmentSchedule(timeAvailable: string): string[] {
    const schedules: { [key: string]: string[] } = {
      limited: ["Monthly progress check", "Quarterly skill assessment"],
      moderate: ["Bi-weekly progress check", "Monthly skill assessment"],
      extensive: ["Weekly progress check", "Bi-weekly skill assessment"]
    };

    return schedules[timeAvailable] || schedules.moderate;
  }

  private static generateSuccessMetrics(targetLevel: ExcelSkillLevel): string[] {
    const metrics = {
      basic: ["70% overall score", "Basic function proficiency", "Error-free simple formulas"],
      intermediate: ["80% overall score", "Intermediate function mastery", "Efficient problem solving"],
      advanced: ["90% overall score", "Advanced function expertise", "Complex analysis capability"]
    };

    return metrics[targetLevel] || metrics.intermediate;
  }

  private static convertToCSV(data: any): string {
    // Simple CSV conversion - in real implementation, this would be more sophisticated
    const headers = Object.keys(data);
    const values = Object.values(data).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
    
    return [headers.join(','), values.join(',')].join('\n');
  }
}

// Report interfaces
interface ExecutiveSummary {
  candidate: {
    name: string;
    position: string;
    assessmentDate: Date;
    duration: string;
  };
  performance: {
    overallScore: number;
    skillLevel: ExcelSkillLevel;
    recommendedLevel: ExcelSkillLevel;
    readinessScore: number;
  };
  keyFindings: {
    strengths: string[];
    improvements: string[];
    criticalSkills: string[];
  };
  recommendation: string;
  nextSteps: string[];
}

interface TechnicalReport {
  assessmentOverview: any;
  conceptualAssessment: any;
  practicalAssessment: any;
  skillAnalysis: any;
  spreadsheetWork: any[];
}

interface BenchmarkReport {
  benchmarkComparison: any;
  skillComparison: any;
  marketAnalysis: any;
  recommendations: any;
}

interface LearningReport {
  currentSkillAssessment: any;
  learningPath: any;
  resourceRecommendations: string[];
  practiceExercises: string[];
  progressTracking: any;
}

export default ExcelReportingService;