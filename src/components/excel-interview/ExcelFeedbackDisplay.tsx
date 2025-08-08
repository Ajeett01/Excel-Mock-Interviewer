"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BookOpen,
  Award,
  BarChart3
} from 'lucide-react';
import { ExcelAnalytics, ExcelSkillLevel, ImprovementPlan } from '@/types/excel';

interface ExcelFeedbackDisplayProps {
  analytics: ExcelAnalytics;
  skillLevel: ExcelSkillLevel;
  onRetakeInterview?: () => void;
  onViewDetailedReport?: () => void;
}

export function ExcelFeedbackDisplay({ 
  analytics, 
  skillLevel, 
  onRetakeInterview, 
  onViewDetailedReport 
}: ExcelFeedbackDisplayProps) {
  const getScoreColor = (score: number): string => {
    if (score >= 80) {
      return 'text-green-600';
    }
    if (score >= 60) {
      return 'text-yellow-600';
    }
    
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 80) {
      return 'default';
    }
    if (score >= 60) {
      return 'secondary';
    }
    
    return 'destructive';
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <BookOpen className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Overall Results Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-6 w-6" />
                Excel Interview Results
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Assessment for {skillLevel} level
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor(analytics.overall_score)}`}>
                {analytics.overall_score}%
              </div>
              <Badge variant={getScoreBadgeVariant(analytics.overall_score)}>
                {analytics.overall_score >= 80 ? 'Excellent' : 
                 analytics.overall_score >= 60 ? 'Good' : 'Needs Improvement'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={analytics.overall_score} className="h-3" />
            <p className="text-sm text-muted-foreground">
              {analytics.overall_feedback}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Skill Level Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Skill Level Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Current Level</p>
              <Badge variant="outline" className="mt-1">
                {analytics.skill_level_assessment.current_level}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Recommended Level</p>
              <Badge variant="default" className="mt-1">
                {analytics.skill_level_assessment.recommended_level}
              </Badge>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Readiness Score</p>
              <div className={`text-xl font-semibold ${getScoreColor(analytics.skill_level_assessment.readiness_score)}`}>
                {Math.round(analytics.skill_level_assessment.readiness_score)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conceptual Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Conceptual Knowledge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Overall Score</span>
              <span className={`font-semibold ${getScoreColor(analytics.conceptual_analysis.total_score)}`}>
                {analytics.conceptual_analysis.total_score}%
              </span>
            </div>
            <Progress value={analytics.conceptual_analysis.total_score} />
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Category Breakdown</h4>
              {Object.entries(analytics.conceptual_analysis.category_breakdown).map(([category, data]) => (
                <div key={category} className="flex items-center justify-between text-sm">
                  <span>{category}</span>
                  <span className={getScoreColor(data.score)}>
                    {data.score}%
                  </span>
                </div>
              ))}
            </div>

            {analytics.conceptual_analysis.strengths.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-green-700 mb-2">Strengths</h4>
                <ul className="text-xs space-y-1">
                  {analytics.conceptual_analysis.strengths.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {analytics.conceptual_analysis.knowledge_gaps.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-red-700 mb-2">Knowledge Gaps</h4>
                <ul className="text-xs space-y-1">
                  {analytics.conceptual_analysis.knowledge_gaps.map((gap, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-red-500" />
                      {gap}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Practical Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Practical Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span>Overall Score</span>
              <span className={`font-semibold ${getScoreColor(analytics.practical_analysis.total_score)}`}>
                {analytics.practical_analysis.total_score}%
              </span>
            </div>
            <Progress value={analytics.practical_analysis.total_score} />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Formula Accuracy</p>
                <p className={`font-medium ${getScoreColor(analytics.practical_analysis.formula_proficiency.formula_accuracy_rate)}`}>
                  {Math.round(analytics.practical_analysis.formula_proficiency.formula_accuracy_rate)}%
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Efficiency</p>
                <p className={`font-medium ${getScoreColor(analytics.practical_analysis.efficiency_metrics.optimal_solution_rate)}`}>
                  {Math.round(analytics.practical_analysis.efficiency_metrics.optimal_solution_rate)}%
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Functions Demonstrated</h4>
              <div className="flex flex-wrap gap-1">
                {analytics.practical_analysis.formula_proficiency.functions_used.map((func, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm mb-2">Best Practices</h4>
              <div className="flex items-center justify-between text-sm">
                <span>Adherence Score</span>
                <span className={getScoreColor(analytics.practical_analysis.best_practices_adherence.score)}>
                  {analytics.practical_analysis.best_practices_adherence.score}%
                </span>
              </div>
              <Progress value={analytics.practical_analysis.best_practices_adherence.score} className="mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Excel Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Skill Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(analytics.excel_skill_breakdown).map(([skill, breakdown]) => (
              <div key={skill} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm capitalize">
                    {skill.replace('_', ' ')}
                  </h4>
                  <span className={`text-sm font-semibold ${getScoreColor(breakdown.score)}`}>
                    {breakdown.score}%
                  </span>
                </div>
                <Progress value={breakdown.score} className="mb-2" />
                <p className="text-xs text-muted-foreground">
                  {breakdown.feedback}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Improvement Plan */}
      {analytics.improvement_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Improvement Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.improvement_plan.map((plan: ImprovementPlan, index: number) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(plan.priority)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium capitalize">{plan.skill}</h4>
                        <Badge variant={plan.priority === 'high' ? 'destructive' : plan.priority === 'medium' ? 'secondary' : 'outline'}>
                          {plan.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {plan.recommendation}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Current: {plan.current_level}%</span>
                        <span>Target: {plan.target_level}%</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {plan.estimated_time}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        {onViewDetailedReport && (
          <Button variant="outline" onClick={onViewDetailedReport}>
            <BarChart3 className="h-4 w-4 mr-2" />
            View Detailed Report
          </Button>
        )}
        {onRetakeInterview && (
          <Button onClick={onRetakeInterview}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Retake Interview
          </Button>
        )}
      </div>
    </div>
  );
}

export default ExcelFeedbackDisplay;