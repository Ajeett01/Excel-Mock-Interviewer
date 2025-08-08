"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Settings, 
  Clock, 
  Users, 
  Target, 
  Briefcase,
  Play,
  Info
} from 'lucide-react';
import { ExcelSkillLevel, ExcelInterviewConfig } from '@/types/excel';

interface ExcelInterviewSetupProps {
  onStartInterview: (config: ExcelInterviewConfig) => void;
  onCancel?: () => void;
}

export function ExcelInterviewSetup({ onStartInterview, onCancel }: ExcelInterviewSetupProps) {
  const [config, setConfig] = useState<ExcelInterviewConfig>({
    skill_level: 'intermediate',
    conceptual_question_count: 5,
    practical_task_count: 3,
    time_allocation: {
      total: 45,
      conceptual: 15,
      practical: 25
    },
    business_scenarios: ['Sales Analysis', 'Budget Planning'],
    industry_context: 'General Business',
    difficulty_progression: true,
    adaptive_questioning: false
  });

  // Additional UI state for features not in the core config
  const [enableHints, setEnableHints] = useState(true);
  const [enableVoiceRecording, setEnableVoiceRecording] = useState(true);

  const skillLevels: { value: ExcelSkillLevel; label: string; description: string }[] = [
    {
      value: 'basic',
      label: 'Basic',
      description: 'Fundamental Excel operations, basic formulas, and simple data entry'
    },
    {
      value: 'intermediate',
      label: 'Intermediate',
      description: 'Advanced formulas, data analysis, charts, and pivot tables'
    },
    {
      value: 'advanced',
      label: 'Advanced',
      description: 'Complex functions, macros, data modeling, and automation'
    }
  ];

  const businessScenarios = [
    'Sales Analysis',
    'Budget Planning',
    'Financial Reporting',
    'Data Analysis',
    'Project Management',
    'Inventory Management',
    'HR Analytics',
    'Marketing Analysis'
  ];

  const industries = [
    'General Business',
    'Finance & Banking',
    'Healthcare',
    'Technology',
    'Manufacturing',
    'Retail',
    'Education',
    'Government'
  ];

  const handleSkillLevelChange = (value: ExcelSkillLevel) => {
    setConfig(prev => ({
      ...prev,
      skill_level: value,
      // Adjust defaults based on skill level
      conceptual_question_count: value === 'basic' ? 4 : value === 'intermediate' ? 5 : 6,
      practical_task_count: value === 'basic' ? 2 : value === 'intermediate' ? 3 : 4,
      time_allocation: {
        total: value === 'basic' ? 35 : value === 'intermediate' ? 45 : 60,
        conceptual: value === 'basic' ? 12 : value === 'intermediate' ? 15 : 20,
        practical: value === 'basic' ? 18 : value === 'intermediate' ? 25 : 35
      }
    }));
  };

  const handleScenarioToggle = (scenario: string) => {
    setConfig(prev => ({
      ...prev,
      business_scenarios: prev.business_scenarios.includes(scenario)
        ? prev.business_scenarios.filter(s => s !== scenario)
        : [...prev.business_scenarios, scenario]
    }));
  };

  const handleStartInterview = () => {
    onStartInterview(config);
  };

  const getEstimatedDuration = () => {
    return `${config.time_allocation.total} minutes`;
  };

  const getSelectedSkillLevel = () => {
    return skillLevels.find(level => level.value === config.skill_level);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Excel Interview Setup
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your Excel mock interview settings to match your skill level and goals
          </p>
        </CardHeader>
      </Card>

      {/* Skill Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5" />
            Skill Level
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={config.skill_level} onValueChange={handleSkillLevelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select your Excel skill level" />
            </SelectTrigger>
            <SelectContent>
              {skillLevels.map((level) => (
                <SelectItem key={level.value} value={level.value}>
                  <div className="flex flex-col">
                    <span className="font-medium">{level.label}</span>
                    <span className="text-xs text-muted-foreground">{level.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {getSelectedSkillLevel() && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>{getSelectedSkillLevel()?.label} Level:</strong> {getSelectedSkillLevel()?.description}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Interview Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Question & Task Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Content Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Conceptual Questions: {config.conceptual_question_count}
              </label>
              <Slider
                value={[config.conceptual_question_count]}
                min={3}
                max={8}
                step={1}
                className="w-full"
                onValueChange={([value]) => setConfig(prev => ({ ...prev, conceptual_question_count: value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Voice-based Excel knowledge questions
              </p>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Practical Tasks: {config.practical_task_count}
              </label>
              <Slider
                value={[config.practical_task_count]}
                min={2}
                max={5}
                step={1}
                className="w-full"
                onValueChange={([value]) => setConfig(prev => ({ ...prev, practical_task_count: value }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Hands-on spreadsheet exercises
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Time Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5" />
              Time Allocation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Conceptual</p>
                <p className="font-medium">{config.time_allocation.conceptual} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Practical</p>
                <p className="font-medium">{config.time_allocation.practical} min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Setup</p>
                <p className="font-medium">5 min</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total</p>
                <p className="font-medium text-blue-600">{config.time_allocation.total} min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Business Context */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5" />
            Business Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Industry Context</label>
            <Select 
              value={config.industry_context} 
              onValueChange={(value) => setConfig(prev => ({ ...prev, industry_context: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {industries.map((industry) => (
                  <SelectItem key={industry} value={industry}>
                    {industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Business Scenarios</label>
            <div className="grid grid-cols-2 gap-2">
              {businessScenarios.map((scenario) => (
                <div key={scenario} className="flex items-center space-x-2">
                  <Switch
                    checked={config.business_scenarios.includes(scenario)}
                    onCheckedChange={() => handleScenarioToggle(scenario)}
                  />
                  <label className="text-sm">{scenario}</label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Selected: {config.business_scenarios.length} scenarios
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Interview Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5" />
            Interview Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Hints</p>
              <p className="text-sm text-muted-foreground">
                Allow requesting hints during difficult questions
              </p>
            </div>
            <Switch
              checked={enableHints}
              onCheckedChange={setEnableHints}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Voice Recording</p>
              <p className="text-sm text-muted-foreground">
                Enable voice responses for conceptual questions
              </p>
            </div>
            <Switch
              checked={enableVoiceRecording}
              onCheckedChange={setEnableVoiceRecording}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Difficulty Progression</p>
              <p className="text-sm text-muted-foreground">
                Gradually increase question difficulty
              </p>
            </div>
            <Switch
              checked={config.difficulty_progression}
              onCheckedChange={(checked) => setConfig(prev => ({ ...prev, difficulty_progression: checked }))}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary & Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Interview Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center">
              <Badge variant="outline">{config.skill_level}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Skill Level</p>
            </div>
            <div className="text-center">
              <Badge variant="outline">{config.conceptual_question_count + config.practical_task_count}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Total Items</p>
            </div>
            <div className="text-center">
              <Badge variant="outline">{getEstimatedDuration()}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Duration</p>
            </div>
            <div className="text-center">
              <Badge variant="outline">{config.business_scenarios.length}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Scenarios</p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button 
              className="flex-1"
              onClick={handleStartInterview}
            >
              <Play className="h-4 w-4 mr-2" />
              Start Excel Interview
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ExcelInterviewSetup;