"use client";

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';
import ProfessionalSpreadsheet from './ProfessionalSpreadsheet';
import TaskInstructions from './TaskInstructions';
import { 
  PracticalTask, 
  SpreadsheetData, 
  UserAction, 
  SpreadsheetResult,
  PracticalProgress 
} from '@/types/excel';
import { ActionTracker, TaskEvaluator } from '@/lib/spreadsheet-utils';

interface SpreadsheetWorkspaceProps {
  task: PracticalTask;
  onActionPerformed: (action: UserAction) => void;
  onTaskComplete: (result: SpreadsheetResult) => void;
  onProgressUpdate?: (progress: PracticalProgress) => void;
  readonly?: boolean;
  showInstructions?: boolean;
  allowHints?: boolean;
  onRequestHint?: () => void;
}

const SpreadsheetWorkspace: React.FC<SpreadsheetWorkspaceProps> = ({
  task,
  onActionPerformed,
  onTaskComplete,
  onProgressUpdate,
  readonly = false,
  showInstructions = true,
  allowHints = true,
  onRequestHint
}) => {
  const [currentData, setCurrentData] = useState<SpreadsheetData>(task.initial_data);
  const [timeRemaining, setTimeRemaining] = useState(task.time_limit * 60); // Convert to seconds
  const [isCompleted, setIsCompleted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  
  const actionTracker = useRef(new ActionTracker());
  const startTime = useRef(Date.now());
  const timerRef = useRef<NodeJS.Timeout>();

  // Timer management
  useEffect(() => {
    if (!readonly && !isCompleted) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [readonly, isCompleted]);

  // Handle spreadsheet actions
  const handleActionPerformed = useCallback((action: UserAction) => {
    if (readonly) return;

    // Track the action
    actionTracker.current.addAction(action);
    
    // Notify parent component
    onActionPerformed(action);

    // Update completion percentage based on actions
    updateCompletionPercentage();
  }, [readonly, onActionPerformed]);

  // Handle data changes
  const handleDataChange = useCallback((data: SpreadsheetData) => {
    if (readonly) return;
    
    setCurrentData(data);
    updateCompletionPercentage();
  }, [readonly]);

  // Update completion percentage
  const updateCompletionPercentage = useCallback(() => {
    const actions = actionTracker.current.getActions();
    const formulasUsed = actionTracker.current.getFormulasUsed();
    const requiredFunctions = task.required_functions;
    
    // Calculate completion based on various factors
    let completion = 0;
    
    // Base completion from actions taken
    completion += Math.min(actions.length * 5, 30);
    
    // Bonus for using required functions
    const usedRequiredFunctions = requiredFunctions.filter(func => 
      formulasUsed.some(formula => formula.includes(func))
    );
    completion += (usedRequiredFunctions.length / requiredFunctions.length) * 40;
    
    // Bonus for data changes
    if (currentData !== task.initial_data) {
      completion += 20;
    }
    
    // Time-based adjustment
    const timeUsed = (task.time_limit * 60 - timeRemaining) / (task.time_limit * 60);
    if (timeUsed > 0.8 && completion < 50) {
      completion = Math.max(completion, 30); // Minimum progress for time spent
    }
    
    setCompletionPercentage(Math.min(100, completion));
  }, [task, timeRemaining, currentData]);

  // Handle task completion
  const handleCompleteTask = useCallback(async () => {
    if (isCompleted) return;

    const endTime = Date.now();
    const completionTime = endTime - startTime.current;
    const userActions = actionTracker.current.getActions();

    // Evaluate the task
    const result = TaskEvaluator.evaluateTask(
      task.id,
      task.initial_data,
      currentData,
      task.expected_outcome,
      userActions,
      task.evaluation_criteria
    );

    // Update result with actual completion time
    result.completion_time = completionTime;

    setIsCompleted(true);
    onTaskComplete(result);

    // Update progress if callback provided
    if (onProgressUpdate) {
      const progress: PracticalProgress = {
        tasks_completed: 1,
        total_accuracy_score: result.accuracy_score,
        total_efficiency_score: result.efficiency_score,
        total_best_practices_score: result.best_practices_score,
        time_spent: completionTime,
        functions_demonstrated: actionTracker.current.getFunctionsUsed()
      };
      onProgressUpdate(progress);
    }
  }, [isCompleted, task, currentData, onTaskComplete, onProgressUpdate]);

  // Handle time up
  const handleTimeUp = useCallback(() => {
    if (!isCompleted) {
      handleCompleteTask();
    }
  }, [isCompleted, handleCompleteTask]);

  // Request hint
  const handleRequestHint = useCallback(() => {
    if (onRequestHint) {
      onRequestHint();
      setShowHint(true);
    }
  }, [onRequestHint]);

  // Format time display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = (): string => {
    const percentage = timeRemaining / (task.time_limit * 60);
    if (percentage > 0.5) return 'text-green-600';
    if (percentage > 0.25) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Compact Task Header */}
      <Card className="flex-shrink-0">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{task.name}</CardTitle>
            <div className="flex items-center space-x-3">
              {/* Time Remaining */}
              <div className={`flex items-center space-x-1 ${getTimeColor()}`}>
                <Clock className="h-3 w-3" />
                <span className="font-mono text-xs">
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              {/* Completion Status */}
              {isCompleted ? (
                <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Completed
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  In Progress
                </Badge>
              )}
            </div>
          </div>
          
          {/* Compact Progress Bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-1" />
          </div>
        </CardHeader>
      </Card>

      {/* Main Content Area */}
      <div className="flex flex-1 space-x-3 min-h-0">
        {/* Instructions Panel */}
        {showInstructions && (
          <div className="w-80 flex-shrink-0">
            <Card className="h-full">
              <CardContent className="p-3 h-full flex flex-col">
                {/* Scrollable Instructions Area */}
                <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                  <TaskInstructions
                    task={task}
                    progress={{
                      tasks_completed: isCompleted ? 1 : 0,
                      total_accuracy_score: 0,
                      total_efficiency_score: 0,
                      total_best_practices_score: 0,
                      time_spent: Date.now() - startTime.current,
                      functions_demonstrated: actionTracker.current.getFunctionsUsed()
                    }}
                    timeRemaining={timeRemaining}
                  />
                </div>
                
                {/* Fixed Action Buttons */}
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-2 flex-shrink-0">
                  {allowHints && !isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRequestHint}
                      className="w-full"
                    >
                      <HelpCircle className="h-4 w-4 mr-2" />
                      Request Hint
                    </Button>
                  )}
                  
                  {!readonly && !isCompleted && completionPercentage > 30 && (
                    <Button
                      onClick={handleCompleteTask}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Complete Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Spreadsheet Panel */}
        <div className="flex-1 min-w-0">
          <Card className="h-full">
            <CardContent className="p-3 h-full">
              <ProfessionalSpreadsheet
                data={currentData}
                onActionPerformed={handleActionPerformed}
                onDataChange={handleDataChange}
                readonly={readonly || isCompleted}
                height={showInstructions ? 450 : 500}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Messages */}
      {timeRemaining < 60 && !isCompleted && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                Less than 1 minute remaining! Consider completing your current work.
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {showHint && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center space-x-2 text-blue-800">
              <HelpCircle className="h-4 w-4" />
              <span className="text-sm">
                Hint: Try using the {task.required_functions[0]} function to solve this problem.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SpreadsheetWorkspace;