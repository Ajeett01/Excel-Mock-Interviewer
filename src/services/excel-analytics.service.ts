import { 
  ExcelAnalytics, 
  ExcelSkillLevel, 
  ConceptualProgress, 
  PracticalProgress, 
  SpreadsheetResult,
  ExcelSkillBreakdown,
  SkillLevelAssessment,
  ImprovementPlan,
  CompetencyMatrix
} from "@/types/excel";
import { ExcelEvaluationService } from "./excel-evaluation.service";

/**
 * Service for generating comprehensive Excel interview analytics
 */
export class ExcelAnalyticsService {
  /**
   * Generate complete analytics report for Excel interview
   */
  static async generateAnalyticsReport(params: {
    skillLevel: ExcelSkillLevel;
    conceptualProgress: ConceptualProgress;
    practicalProgress: PracticalProgress;
    spreadsheetResults: SpreadsheetResult[];
    totalDuration: number;
    sessionId?: string;
  }): Promise<ExcelAnalytics> {
    const {
      skillLevel,
      conceptualProgress,
      practicalProgress,
      spreadsheetResults,
      totalDuration,
      sessionId
    } = params;

    try {
      // Use the existing evaluation service for comprehensive analytics
      const analytics = await ExcelEvaluationService.generateExcelAnalytics(
        skillLevel,
        conceptualProgress,
        practicalProgress,
        spreadsheetResults,
        totalDuration
      );

      // Enhance with additional analytics
      const enhancedAnalytics = await this.enhanceAnalytics(analytics, params);

      // Store analytics if session ID provided
      if (sessionId) {
        await this.storeAnalytics(sessionId, enhancedAnalytics);
      }

      return enhancedAnalytics;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      
      // Return basic analytics as fallback
      return this.generateBasicAnalytics(params);
    }
  }

  /**
   * Generate skill progression analysis
   */
  static async analyzeSkillProgression(params: {
    currentSkillLevel: ExcelSkillLevel;
    conceptualScores: { [category: string]: number };
    practicalScores: {
      accuracy: number;
      efficiency: number;
      bestPractices: number;
    };
    functionsUsed: string[];
  }): Promise<{
    progressionScore: number;
    readinessForNextLevel: boolean;
    skillGaps: string[];
    strengths: string[];
    recommendations: string[];
  }> {
    const { currentSkillLevel, conceptualScores, practicalScores, functionsUsed } = params;

    // Calculate overall progression score
    const conceptualAvg = Object.values(conceptualScores).reduce((a, b) => a + b, 0) / Object.values(conceptualScores).length;
    const practicalAvg = (practicalScores.accuracy + practicalScores.efficiency + practicalScores.bestPractices) / 3;
    const progressionScore = (conceptualAvg + practicalAvg) / 2;

    // Determine readiness for next level
    const readinessThreshold = this.getReadinessThreshold(currentSkillLevel);
    const readinessForNextLevel = progressionScore >= readinessThreshold;

    // Identify skill gaps and strengths
    const skillGaps = this.identifySkillGaps(currentSkillLevel, conceptualScores, practicalScores);
    const strengths = this.identifyStrengths(conceptualScores, practicalScores, functionsUsed);

    // Generate recommendations
    const recommendations = this.generateProgressionRecommendations(
      currentSkillLevel,
      skillGaps,
      strengths,
      readinessForNextLevel
    );

    return {
      progressionScore,
      readinessForNextLevel,
      skillGaps,
      strengths,
      recommendations
    };
  }

  /**
   * Generate comparative analysis against benchmarks
   */
  static async generateBenchmarkAnalysis(params: {
    skillLevel: ExcelSkillLevel;
    overallScore: number;
    conceptualScore: number;
    practicalScore: number;
    completionTime: number;
  }): Promise<{
    percentileRank: number;
    comparisonToAverage: string;
    timeEfficiency: string;
    competitivePosition: 'top' | 'above_average' | 'average' | 'below_average' | 'bottom';
  }> {
    const { skillLevel, overallScore, conceptualScore, practicalScore, completionTime } = params;

    // Get benchmark data (in a real implementation, this would come from a database)
    const benchmarks = this.getBenchmarkData(skillLevel);

    // Calculate percentile rank
    const percentileRank = this.calculatePercentileRank(overallScore, benchmarks.scoreDistribution);

    // Compare to average
    const avgScore = benchmarks.averageScore;
    const scoreDiff = overallScore - avgScore;
    const comparisonToAverage = scoreDiff > 10 
      ? `${Math.round(scoreDiff)} points above average`
      : scoreDiff < -10 
      ? `${Math.abs(Math.round(scoreDiff))} points below average`
      : 'Close to average';

    // Analyze time efficiency
    const avgTime = benchmarks.averageCompletionTime;
    const timeDiff = completionTime - avgTime;
    const timeEfficiency = timeDiff < -300000 // 5 minutes faster
      ? 'Significantly faster than average'
      : timeDiff > 300000 // 5 minutes slower
      ? 'Slower than average'
      : 'Average completion time';

    // Determine competitive position
    const competitivePosition = percentileRank >= 90 ? 'top'
      : percentileRank >= 70 ? 'above_average'
      : percentileRank >= 30 ? 'average'
      : percentileRank >= 10 ? 'below_average'
      : 'bottom';

    return {
      percentileRank,
      comparisonToAverage,
      timeEfficiency,
      competitivePosition
    };
  }

  /**
   * Generate learning path recommendations
   */
  static generateLearningPath(params: {
    currentLevel: ExcelSkillLevel;
    skillBreakdown: ExcelSkillBreakdown;
    improvementPlan: ImprovementPlan[];
    timeAvailable: 'limited' | 'moderate' | 'extensive';
  }): {
    shortTerm: LearningPathItem[];
    mediumTerm: LearningPathItem[];
    longTerm: LearningPathItem[];
    estimatedTimeToNextLevel: string;
  } {
    const { currentLevel, skillBreakdown, improvementPlan, timeAvailable } = params;

    // Prioritize improvement areas
    const prioritizedAreas = this.prioritizeImprovementAreas(skillBreakdown, improvementPlan);

    // Generate learning path items
    const shortTerm = this.generateShortTermPath(prioritizedAreas, timeAvailable);
    const mediumTerm = this.generateMediumTermPath(prioritizedAreas, currentLevel);
    const longTerm = this.generateLongTermPath(currentLevel);

    // Estimate time to next level
    const estimatedTimeToNextLevel = this.estimateTimeToNextLevel(
      currentLevel,
      skillBreakdown,
      timeAvailable
    );

    return {
      shortTerm,
      mediumTerm,
      longTerm,
      estimatedTimeToNextLevel
    };
  }

  // Private helper methods

  private static async enhanceAnalytics(
    baseAnalytics: ExcelAnalytics,
    params: any
  ): Promise<ExcelAnalytics> {
    // Add benchmark comparison
    const benchmarkAnalysis = await this.generateBenchmarkAnalysis({
      skillLevel: params.skillLevel,
      overallScore: baseAnalytics.overall_score,
      conceptualScore: baseAnalytics.conceptual_analysis.total_score,
      practicalScore: baseAnalytics.practical_analysis.total_score,
      completionTime: params.totalDuration
    });

    // Add skill progression analysis
    const progressionAnalysis = await this.analyzeSkillProgression({
      currentSkillLevel: params.skillLevel,
      conceptualScores: params.conceptualProgress.category_scores,
      practicalScores: {
        accuracy: params.practicalProgress.total_accuracy_score,
        efficiency: params.practicalProgress.total_efficiency_score,
        bestPractices: params.practicalProgress.total_best_practices_score
      },
      functionsUsed: params.practicalProgress.functions_demonstrated
    });

    // Enhance the analytics object
    return {
      ...baseAnalytics,
      // Add custom enhancement properties (would need to extend the interface)
      benchmark_analysis: benchmarkAnalysis,
      progression_analysis: progressionAnalysis
    } as ExcelAnalytics;
  }

  private static async storeAnalytics(sessionId: string, analytics: ExcelAnalytics): Promise<void> {
    try {
      // In a real implementation, this would store to database
      console.log(`Storing analytics for session ${sessionId}:`, analytics);
      
      // Could use Supabase or another database service
      // await supabase.from('excel_analytics').insert({
      //   session_id: sessionId,
      //   analytics_data: analytics,
      //   created_at: new Date()
      // });
    } catch (error) {
      console.error('Error storing analytics:', error);
    }
  }

  private static generateBasicAnalytics(params: any): ExcelAnalytics {
    const conceptualScore = params.conceptualProgress.total_score || 0;
    const practicalScore = params.practicalProgress.total_accuracy_score || 0;
    const overallScore = (conceptualScore + practicalScore) / 2;

    return {
      overall_score: Math.round(overallScore),
      overall_feedback: `You demonstrated ${params.skillLevel} level Excel skills with an overall score of ${Math.round(overallScore)}%.`,
      skill_level_assessment: {
        current_level: params.skillLevel,
        recommended_level: params.skillLevel,
        readiness_score: overallScore,
        confidence_interval: 15
      },
      conceptual_analysis: {
        total_score: conceptualScore,
        category_breakdown: {},
        knowledge_gaps: [],
        strengths: []
      },
      practical_analysis: {
        total_score: practicalScore,
        task_breakdown: [],
        formula_proficiency: {
          functions_used: params.practicalProgress.functions_demonstrated || [],
          functions_mastered: [],
          functions_struggled: [],
          complexity_level_achieved: 1,
          formula_accuracy_rate: practicalScore
        },
        efficiency_metrics: {
          average_task_completion_time: params.totalDuration / 1000 / 60,
          optimal_solution_rate: practicalScore,
          unnecessary_steps_count: 0,
          keyboard_shortcuts_used: 0
        },
        best_practices_adherence: {
          score: params.practicalProgress.total_best_practices_score || 0,
          practices_followed: [],
          practices_violated: [],
          recommendations: []
        }
      },
      excel_skill_breakdown: {
        formula_accuracy: { score: practicalScore, feedback: "", examples: [], improvement_areas: [] },
        data_analysis: { score: 70, feedback: "", examples: [], improvement_areas: [] },
        efficiency: { score: practicalScore, feedback: "", examples: [], improvement_areas: [] },
        best_practices: { score: practicalScore, feedback: "", examples: [], improvement_areas: [] },
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

  private static getReadinessThreshold(skillLevel: ExcelSkillLevel): number {
    const thresholds = {
      'basic': 75,      // 75% to move to intermediate
      'intermediate': 80, // 80% to move to advanced
      'advanced': 85     // 85% for mastery
    };
    
    return thresholds[skillLevel];
  }

  private static identifySkillGaps(
    skillLevel: ExcelSkillLevel,
    conceptualScores: { [category: string]: number },
    practicalScores: { accuracy: number; efficiency: number; bestPractices: number }
  ): string[] {
    const gaps: string[] = [];

    // Check conceptual gaps
    Object.entries(conceptualScores).forEach(([category, score]) => {
      if (score < 60) {
        gaps.push(`${category} knowledge`);
      }
    });

    // Check practical gaps
    if (practicalScores.accuracy < 70) {
      gaps.push('Formula accuracy');
    }
    if (practicalScores.efficiency < 70) {
      gaps.push('Problem-solving efficiency');
    }
    if (practicalScores.bestPractices < 70) {
      gaps.push('Excel best practices');
    }

    return gaps;
  }

  private static identifyStrengths(
    conceptualScores: { [category: string]: number },
    practicalScores: { accuracy: number; efficiency: number; bestPractices: number },
    functionsUsed: string[]
  ): string[] {
    const strengths: string[] = [];

    // Check conceptual strengths
    Object.entries(conceptualScores).forEach(([category, score]) => {
      if (score >= 80) {
        strengths.push(`Strong ${category} knowledge`);
      }
    });

    // Check practical strengths
    if (practicalScores.accuracy >= 80) {
      strengths.push('Excellent formula accuracy');
    }
    if (practicalScores.efficiency >= 80) {
      strengths.push('Efficient problem solving');
    }
    if (practicalScores.bestPractices >= 80) {
      strengths.push('Good Excel practices');
    }

    // Check function diversity
    if (functionsUsed.length >= 5) {
      strengths.push('Diverse function knowledge');
    }

    return strengths;
  }

  private static generateProgressionRecommendations(
    currentLevel: ExcelSkillLevel,
    skillGaps: string[],
    strengths: string[],
    readinessForNextLevel: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (readinessForNextLevel) {
      const nextLevel = currentLevel === 'basic' ? 'intermediate' : 'advanced';
      recommendations.push(`You're ready to advance to ${nextLevel} level Excel skills`);
    } else {
      recommendations.push(`Focus on improving weak areas before advancing from ${currentLevel} level`);
    }

    // Add specific recommendations based on gaps
    skillGaps.forEach(gap => {
      recommendations.push(`Practice ${gap.toLowerCase()} through targeted exercises`);
    });

    // Leverage strengths
    if (strengths.length > 0) {
      recommendations.push(`Continue building on your strengths: ${strengths.join(', ')}`);
    }

    return recommendations;
  }

  private static getBenchmarkData(skillLevel: ExcelSkillLevel) {
    // Mock benchmark data - in real implementation, this would come from database
    const benchmarks = {
      'basic': {
        averageScore: 65,
        averageCompletionTime: 25 * 60 * 1000, // 25 minutes
        scoreDistribution: [45, 55, 65, 75, 85] // percentile scores
      },
      'intermediate': {
        averageScore: 72,
        averageCompletionTime: 35 * 60 * 1000, // 35 minutes
        scoreDistribution: [52, 62, 72, 82, 92]
      },
      'advanced': {
        averageScore: 78,
        averageCompletionTime: 45 * 60 * 1000, // 45 minutes
        scoreDistribution: [58, 68, 78, 88, 95]
      }
    };

    return benchmarks[skillLevel];
  }

  private static calculatePercentileRank(score: number, distribution: number[]): number {
    const belowScore = distribution.filter(s => s < score).length;
    
    return Math.round((belowScore / distribution.length) * 100);
  }

  private static prioritizeImprovementAreas(
    skillBreakdown: ExcelSkillBreakdown,
    improvementPlan: ImprovementPlan[]
  ): string[] {
    // Sort improvement areas by priority and score
    const areas = Object.entries(skillBreakdown)
      .map(([skill, data]) => ({ skill, score: data.score }))
      .sort((a, b) => a.score - b.score)
      .map(item => item.skill);

    return areas;
  }

  private static generateShortTermPath(areas: string[], timeAvailable: string): LearningPathItem[] {
    const items: LearningPathItem[] = [];
    const topAreas = areas.slice(0, timeAvailable === 'limited' ? 2 : 3);

    topAreas.forEach(area => {
      items.push({
        title: `Improve ${area.replace('_', ' ')}`,
        description: `Focus on fundamental ${area.replace('_', ' ')} skills`,
        timeEstimate: '1-2 weeks',
        priority: 'high',
        resources: [`${area} tutorial`, `${area} practice exercises`]
      });
    });

    return items;
  }

  private static generateMediumTermPath(areas: string[], currentLevel: ExcelSkillLevel): LearningPathItem[] {
    return [
      {
        title: 'Advanced Excel Functions',
        description: 'Master complex functions and formulas',
        timeEstimate: '4-6 weeks',
        priority: 'medium',
        resources: ['Advanced functions course', 'Formula building exercises']
      },
      {
        title: 'Data Analysis Techniques',
        description: 'Learn advanced data analysis methods',
        timeEstimate: '3-4 weeks',
        priority: 'medium',
        resources: ['Data analysis tutorial', 'Real-world datasets']
      }
    ];
  }

  private static generateLongTermPath(currentLevel: ExcelSkillLevel): LearningPathItem[] {
    return [
      {
        title: 'Excel Automation',
        description: 'Learn VBA and macro development',
        timeEstimate: '8-12 weeks',
        priority: 'low',
        resources: ['VBA programming course', 'Automation projects']
      },
      {
        title: 'Business Intelligence',
        description: 'Advanced reporting and dashboard creation',
        timeEstimate: '6-8 weeks',
        priority: 'low',
        resources: ['BI tools training', 'Dashboard design course']
      }
    ];
  }

  private static estimateTimeToNextLevel(
    currentLevel: ExcelSkillLevel,
    skillBreakdown: ExcelSkillBreakdown,
    timeAvailable: string
  ): string {
    const avgScore = Object.values(skillBreakdown).reduce((sum, skill) => sum + skill.score, 0) / Object.values(skillBreakdown).length;
    const gapToNextLevel = this.getReadinessThreshold(currentLevel) - avgScore;

    if (gapToNextLevel <= 0) {
      return 'Ready now';
    }

    const baseTime = currentLevel === 'basic' ? 8 : 12; // weeks
    const adjustedTime = Math.round(baseTime * (gapToNextLevel / 20)); // Adjust based on gap

    const multiplier = timeAvailable === 'limited' ? 1.5 : timeAvailable === 'extensive' ? 0.7 : 1;
    const finalTime = Math.round(adjustedTime * multiplier);

    return `${finalTime}-${finalTime + 2} weeks`;
  }
}

interface LearningPathItem {
  title: string;
  description: string;
  timeEstimate: string;
  priority: 'high' | 'medium' | 'low';
  resources: string[];
}

export default ExcelAnalyticsService;