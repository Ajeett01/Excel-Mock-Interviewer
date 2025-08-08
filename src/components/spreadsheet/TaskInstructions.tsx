"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, Target, Lightbulb } from 'lucide-react';
import { PracticalTask, PracticalProgress } from '@/types/excel';

interface TaskInstructionsProps {
  task: PracticalTask;
  progress: PracticalProgress;
  timeRemaining: number;
}

const TaskInstructions: React.FC<TaskInstructionsProps> = ({
  task,
  progress,
  timeRemaining
}) => {
  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate instruction completion
  const getInstructionCompletion = (): number => {
    // Simple heuristic based on functions used and time spent
    const functionsUsed = progress.functions_demonstrated.length;
    const requiredFunctions = task.required_functions.length;
    const functionProgress = requiredFunctions > 0 ? (functionsUsed / requiredFunctions) * 100 : 0;
    
    return Math.min(100, functionProgress);
  };

  return (
    <div className="space-y-4">
      {/* Task Overview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            Task Instructions
            <Badge variant="outline" className="text-xs">
              {task.skill_level}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scenario */}
          <div>
            <h4 className="font-medium text-sm mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2 text-blue-600" />
              Scenario
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {task.scenario}
            </p>
          </div>

          {/* Task Description */}
          <div>
            <h4 className="font-medium text-sm mb-2">Description</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {task.description}
            </p>
          </div>

          {/* Time Remaining */}
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              Time Remaining
            </span>
            <span className="font-mono font-medium">
              {formatTime(timeRemaining)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Step-by-Step Instructions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Step-by-Step Instructions</CardTitle>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{Math.round(getInstructionCompletion())}%</span>
          </div>
          <Progress value={getInstructionCompletion()} className="h-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {task.description.split('\n').filter(line => line.trim()).map((instruction, index) => {
              const isCompleted = index < Math.floor(getInstructionCompletion() / 25); // Rough estimation
              
              return (
                <div
                  key={index}
                  className={`flex items-start space-x-3 p-2 rounded-lg transition-colors ${
                    isCompleted 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm ${isCompleted ? 'text-green-800' : 'text-gray-700'}`}>
                      {instruction.trim()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Required Functions */}
      {task.required_functions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
              Required Functions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {task.required_functions.map((func, index) => {
                const isUsed = progress.functions_demonstrated.includes(func);
                
                return (
                  <Badge
                    key={index}
                    variant={isUsed ? "default" : "outline"}
                    className={`text-xs ${
                      isUsed 
                        ? 'bg-green-100 text-green-800 border-green-300' 
                        : 'bg-gray-100 text-gray-600 border-gray-300'
                    }`}
                  >
                    {isUsed && <CheckCircle className="h-3 w-3 mr-1" />}
                    {func}
                  </Badge>
                );
              })}
            </div>
            
            {progress.functions_demonstrated.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600 mb-2">Functions you've used:</p>
                <div className="flex flex-wrap gap-1">
                  {progress.functions_demonstrated.map((func, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Success Criteria */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Success Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Accuracy</span>
              <span className="text-gray-600">
                {task.evaluation_criteria.formula_accuracy_weight}% weight
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Efficiency</span>
              <span className="text-gray-600">
                {task.evaluation_criteria.efficiency_weight}% weight
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Best Practices</span>
              <span className="text-gray-600">
                {task.evaluation_criteria.best_practices_weight}% weight
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span>Presentation</span>
              <span className="text-gray-600">
                {task.evaluation_criteria.presentation_weight}% weight
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Context */}
      {task.business_context && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Business Context</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 leading-relaxed">
              {task.business_context}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Performance Stats */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Tasks Completed</p>
              <p className="font-medium">{progress.tasks_completed}</p>
            </div>
            <div>
              <p className="text-gray-600">Functions Used</p>
              <p className="font-medium">{progress.functions_demonstrated.length}</p>
            </div>
            <div>
              <p className="text-gray-600">Time Spent</p>
              <p className="font-medium">
                {Math.round(progress.time_spent / 1000 / 60)}m
              </p>
            </div>
            <div>
              <p className="text-gray-600">Accuracy</p>
              <p className="font-medium">
                {Math.round(progress.total_accuracy_score)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TaskInstructions;