"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Mic, MicOff, Play, Pause, SkipForward } from 'lucide-react';
import { 
  ExcelInterviewState, 
  ExcelInterviewSession, 
  ExcelSkillLevel,
  ExcelQuestion,
  PracticalTask 
} from '@/types/excel';
import { ExcelInterviewStateManagerImpl } from '@/lib/excel-interview-state-manager';
import SpreadsheetWorkspace from '@/components/spreadsheet/SpreadsheetWorkspace';

interface ExcelInterviewFlowProps {
  sessionId: string;
  skillLevel: ExcelSkillLevel;
  onComplete: (session: ExcelInterviewSession) => void;
  onError: (error: string) => void;
}

export function ExcelInterviewFlow({ 
  sessionId, 
  skillLevel, 
  onComplete, 
  onError 
}: ExcelInterviewFlowProps) {
  const [currentState, setCurrentState] = useState<ExcelInterviewState>('introduction');
  const [session, setSession] = useState<ExcelInterviewSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<ExcelQuestion | null>(null);
  const [currentTask, setCurrentTask] = useState<PracticalTask | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [progress, setProgress] = useState(0);

  // Initialize session and state manager
  useEffect(() => {
    initializeSession();
  }, [sessionId]);

  // Update progress based on current state
  useEffect(() => {
    const stateProgress = {
      'introduction': 10,
      'conceptual_questions': 35,
      'practical_tasks': 70,
      'feedback_generation': 90,
      'conclusion': 100
    };
    setProgress(stateProgress[currentState]);
  }, [currentState]);

  const initializeSession = async () => {
    try {
      setIsLoading(true);
      
      // Fetch or create session
      const response = await fetch(`/api/excel-interview-session?responseId=${sessionId}`);
      
      if (response.ok) {
        const { session: existingSession } = await response.json();
        setSession(existingSession);
        setCurrentState(existingSession.current_state);
      } else {
        // Create new session
        const newSessionResponse = await fetch('/api/excel-interview-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'create',
            sessionData: {
              response_id: parseInt(sessionId),
              current_state: 'introduction',
              state_data: {
                questions_completed: 0,
                tasks_completed: 0,
                total_questions: 5,
                total_tasks: 3
              },
              conceptual_progress: {
                questions_answered: 0,
                correct_answers: 0,
                total_score: 0,
                category_scores: {},
                time_spent: 0
              },
              practical_progress: {
                tasks_completed: 0,
                total_accuracy_score: 0,
                total_efficiency_score: 0,
                total_best_practices_score: 0,
                time_spent: 0,
                functions_demonstrated: []
              },
              start_time: new Date(),
              total_duration: 0,
              state_history: []
            }
          })
        });

        if (newSessionResponse.ok) {
          const { result } = await newSessionResponse.json();
          setSession(result);
        } else {
          throw new Error('Failed to create session');
        }
      }
    } catch (error) {
      console.error('Error initializing session:', error);
      onError('Failed to initialize interview session');
    } finally {
      setIsLoading(false);
    }
  };

  const transitionToNextState = async () => {
    if (!session) {
      return;
    }

    try {
      // Create a temporary state manager instance to get next state
      const tempStateManager = new ExcelInterviewStateManagerImpl(session);
      const nextState = tempStateManager.getNextState();
      if (!nextState) {
        // Interview complete
        onComplete(session);
        
        return;
      }

      // Update session state
      const updateResponse = await fetch('/api/excel-interview-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          sessionData: {
            id: session.id,
            current_state: nextState,
            state_history: [
              ...session.state_history,
              {
                from_state: currentState,
                to_state: nextState,
                timestamp: new Date(),
                trigger: 'manual_progression',
                data: {}
              }
            ]
          }
        })
      });

      if (updateResponse.ok) {
        setCurrentState(nextState);
        
        // Load content for new state
        await loadStateContent(nextState);
      } else {
        throw new Error('Failed to update session state');
      }
    } catch (error) {
      console.error('Error transitioning state:', error);
      onError('Failed to progress to next stage');
    }
  };

  const loadStateContent = async (state: ExcelInterviewState) => {
    try {
      switch (state) {
        case 'conceptual_questions':
          await loadConceptualQuestions();
          break;
        case 'practical_tasks':
          await loadPracticalTasks();
          break;
        case 'feedback_generation':
          await generateFeedback();
          break;
      }
    } catch (error) {
      console.error('Error loading state content:', error);
      onError(`Failed to load content for ${state}`);
    }
  };

  const loadConceptualQuestions = async () => {
    try {
      const response = await fetch('/api/generate-excel-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillLevel,
          questionCount: 5,
          categories: ['Formulas', 'Data Analysis', 'Charts', 'Functions']
        })
      });

      if (response.ok) {
        const { questions } = await response.json();
        if (questions && questions.length > 0) {
          setCurrentQuestion(questions[0]);
        }
      }
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadPracticalTasks = async () => {
    try {
      const response = await fetch('/api/generate-excel-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillLevel,
          taskCount: 3,
          businessScenarios: ['Sales Analysis', 'Budget Planning', 'Data Reporting']
        })
      });

      if (response.ok) {
        const { tasks } = await response.json();
        if (tasks && tasks.length > 0) {
          setCurrentTask(tasks[0]);
          setTimeRemaining(tasks[0].time_limit * 60); // Convert to seconds
        }
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const generateFeedback = async () => {
    if (!session) {
      return;
    }

    try {
      const response = await fetch('/api/generate-excel-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skillLevel,
          conceptualProgress: session.conceptual_progress,
          practicalProgress: session.practical_progress,
          spreadsheetResults: [], // Would be populated with actual results
          totalDuration: session.total_duration || 0
        })
      });

      if (response.ok) {
        const { analytics } = await response.json();
        // Store analytics in session or display
        console.log('Generated analytics:', analytics);
      }
    } catch (error) {
      console.error('Error generating feedback:', error);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Implement actual recording logic here
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
          <p>Initializing Excel Interview...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header with Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Excel Mock Interview
                <Badge variant="outline">{skillLevel}</Badge>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Current Stage: {currentState.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {timeRemaining > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  {formatTime(timeRemaining)}
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={currentState === 'conclusion'}
                onClick={transitionToNextState}
              >
                <SkipForward className="h-4 w-4 mr-2" />
                Next Stage
              </Button>
            </div>
          </div>
          <Progress value={progress} className="mt-4" />
        </CardHeader>
      </Card>

      {/* State-specific Content */}
      {currentState === 'introduction' && (
        <Card>
          <CardHeader>
            <CardTitle>Welcome to Your Excel Interview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This interview will assess your Excel skills through both conceptual questions 
              and hands-on practical tasks. The interview consists of 5 stages:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li><strong>Introduction:</strong> Overview and setup</li>
              <li><strong>Conceptual Questions:</strong> Voice-based Excel knowledge assessment</li>
              <li><strong>Practical Tasks:</strong> Hands-on spreadsheet work</li>
              <li><strong>Feedback Generation:</strong> AI analysis of your performance</li>
              <li><strong>Conclusion:</strong> Results and recommendations</li>
            </ul>
            <div className="flex gap-4 pt-4">
              <Button onClick={transitionToNextState}>
                <Play className="h-4 w-4 mr-2" />
                Start Interview
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {currentState === 'conceptual_questions' && currentQuestion && (
        <Card>
          <CardHeader>
            <CardTitle>Conceptual Questions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Answer the following Excel-related questions verbally
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Question:</h3>
              <p>{currentQuestion.question}</p>
              <Badge variant="secondary" className="mt-2">
                {currentQuestion.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4">
              <Button
                variant={isRecording ? "destructive" : "default"}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <MicOff className="h-4 w-4 mr-2" />
                    Stop Recording
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4 mr-2" />
                    Start Recording
                  </>
                )}
              </Button>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  Recording...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {currentState === 'practical_tasks' && currentTask && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practical Task</CardTitle>
              <p className="text-sm text-muted-foreground">
                Complete the following Excel task in the spreadsheet below
              </p>
            </CardHeader>
            <CardContent>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">{currentTask.name}</h3>
                <p className="text-sm mb-2">{currentTask.description}</p>
                <p className="text-xs text-muted-foreground">
                  <strong>Scenario:</strong> {currentTask.scenario}
                </p>
                <div className="flex gap-2 mt-2">
                  {currentTask.required_functions.map((func, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {func}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <SpreadsheetWorkspace
            task={currentTask}
            onActionPerformed={(action) => {
              console.log('Action performed:', action);
              // Handle action tracking
            }}
            onTaskComplete={(result: any) => {
              console.log('Task completed:', result);
              // Handle task completion
            }}
            onProgressUpdate={(progress) => {
              console.log('Progress updated:', progress);
              // Handle progress updates
            }}
          />
        </div>
      )}

      {currentState === 'feedback_generation' && (
        <Card>
          <CardHeader>
            <CardTitle>Generating Your Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p>Analyzing your performance...</p>
              <p className="text-sm text-muted-foreground mt-2">
                Our AI is evaluating your responses and spreadsheet work
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {currentState === 'conclusion' && (
        <Card>
          <CardHeader>
            <CardTitle>Interview Complete!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Thank you for completing the Excel interview. Your detailed feedback 
              and performance analysis will be available shortly.
            </p>
            <div className="flex gap-4">
              <Button onClick={() => onComplete(session!)}>
                View Results
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}