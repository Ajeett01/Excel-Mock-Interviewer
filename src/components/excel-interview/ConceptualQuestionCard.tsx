"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  SkipForward, 
  Volume2,
  Clock,
  MessageCircle
} from 'lucide-react';
import { ExcelQuestion, ExcelSkillLevel } from '@/types/excel';

interface ConceptualQuestionCardProps {
  question: ExcelQuestion;
  questionNumber: number;
  totalQuestions: number;
  skillLevel: ExcelSkillLevel;
  timeLimit?: number; // in seconds
  onAnswerSubmit: (answer: string) => void;
  onSkipQuestion: () => void;
  onRequestHint?: () => void;
  isRecording?: boolean;
  onToggleRecording?: () => void;
}

export function ConceptualQuestionCard({
  question,
  questionNumber,
  totalQuestions,
  skillLevel,
  timeLimit = 120, // 2 minutes default
  onAnswerSubmit,
  onSkipQuestion,
  onRequestHint,
  isRecording = false,
  onToggleRecording
}: ConceptualQuestionCardProps) {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const [recordedAnswer, setRecordedAnswer] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Timer management
  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      // Auto-submit when time runs out
      handleSubmitAnswer();
    }
  }, [timeRemaining]);

  const handleSubmitAnswer = () => {
    onAnswerSubmit(recordedAnswer || 'No answer provided');
  };

  const handleToggleRecording = () => {
    if (onToggleRecording) {
      onToggleRecording();
    }
  };

  const handleRequestHint = () => {
    if (onRequestHint) {
      onRequestHint();
      setShowHint(true);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = (): string => {
    const percentage = timeRemaining / timeLimit;
    if (percentage > 0.5) {
      return 'text-green-600';
    }
    if (percentage > 0.25) {
      return 'text-yellow-600';
    }
    
    return 'text-red-600';
  };

  const getDifficultyColor = (rating: number): string => {
    if (rating <= 3) {
      return 'bg-green-100 text-green-800';
    }
    if (rating <= 6) {
      return 'bg-yellow-100 text-yellow-800';
    }
    
    return 'bg-red-100 text-red-800';
  };

  const progress = ((questionNumber - 1) / totalQuestions) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Question {questionNumber} of {totalQuestions}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Conceptual Knowledge Assessment
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{skillLevel}</Badge>
              <div className={`flex items-center gap-2 ${getTimeColor()}`}>
                <Clock className="h-4 w-4" />
                <span className="font-mono text-sm">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={progress} className="mt-3" />
        </CardHeader>
      </Card>

      {/* Question Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Excel Question
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{question.category}</Badge>
              <Badge 
                className={getDifficultyColor(question.difficulty_rating)}
                variant="outline"
              >
                Difficulty: {question.difficulty_rating}/10
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Question Text */}
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500">
            <p className="text-lg leading-relaxed">{question.question}</p>
          </div>

          {/* Expected Functions/Skills */}
          {question.expected_functions && question.expected_functions.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Related Excel Functions/Concepts:</h4>
              <div className="flex flex-wrap gap-2">
                {question.expected_functions.map((func, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {func}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recording Controls */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Voice Response</h4>
              {isRecording && (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
                  Recording...
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant={isRecording ? "destructive" : "default"}
                className="flex-1"
                onClick={handleToggleRecording}
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

              {recordedAnswer && (
                <Button
                  variant="outline"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-4 w-4 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Play
                    </>
                  )}
                </Button>
              )}
            </div>

            {recordedAnswer && (
              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-sm text-muted-foreground">
                  Recorded answer ready for submission
                </p>
              </div>
            )}
          </div>

          {/* Hint Section */}
          {showHint && (
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <h4 className="font-medium text-yellow-800 mb-2">Hint</h4>
              <p className="text-sm text-yellow-700">
                Consider the specific Excel function or feature that would be most relevant 
                to this scenario. Think about the data manipulation or analysis required.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <Button
              disabled={!recordedAnswer && !isRecording}
              className="flex-1"
              onClick={handleSubmitAnswer}
            >
              Submit Answer
            </Button>
            
            {onRequestHint && !showHint && (
              <Button
                variant="outline"
                onClick={handleRequestHint}
              >
                Need a Hint?
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onSkipQuestion}
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>

          {/* Time Warning */}
          {timeRemaining < 30 && (
            <div className="bg-red-50 p-3 rounded-lg border-l-4 border-red-500">
              <p className="text-sm text-red-700 font-medium">
                ⚠️ Less than 30 seconds remaining! Please submit your answer soon.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ConceptualQuestionCard;