/**
 * Test utilities for Excel Mock Interviewer
 * Provides common mock data, helper functions, and test setup utilities
 */

import { 
  ExcelQuestion, 
  PracticalTask, 
  SpreadsheetData, 
  UserAction, 
  ExcelSkillLevel,
  ConceptualProgress,
  PracticalProgress,
  ExcelAnalytics,
  ExcelInterviewSession
} from '../types/excel';

// Mock Data Generators

export const createMockExcelQuestion = (overrides: Partial<ExcelQuestion> = {}): ExcelQuestion => ({
  id: 'test-question-1',
  question: 'What is the VLOOKUP function used for in Excel?',
  type: 'conceptual',
  skill_level: 'intermediate',
  category: 'Functions',
  expected_functions: ['VLOOKUP'],
  difficulty_rating: 6,
  follow_up_count: 0,
  ...overrides
});

export const createMockPracticalTask = (overrides: Partial<PracticalTask> = {}): PracticalTask => ({
  id: 'test-task-1',
  name: 'Sales Data Analysis',
  description: 'Analyze quarterly sales data and create summary calculations',
  scenario: 'You have been provided with sales data for Q1-Q4. Calculate totals and averages.',
  skill_level: 'intermediate',
  initial_data: createMockSpreadsheetData(),
  expected_outcome: createMockSpreadsheetData({
    sheets: [{
      name: 'Sales Data',
      data: [
        [{ v: 'Quarter' }, { v: 'Sales' }, { v: 'Total' }],
        [{ v: 'Q1' }, { v: 10000 }, { f: '=SUM(B2:B5)' }],
        [{ v: 'Q2' }, { v: 15000 }, { f: '=SUM(B2:B5)' }],
        [{ v: 'Q3' }, { v: 12000 }, { f: '=SUM(B2:B5)' }],
        [{ v: 'Q4' }, { v: 18000 }, { f: '=SUM(B2:B5)' }]
      ],
      config: {}
    }]
  }),
  evaluation_criteria: {
    formula_accuracy_weight: 40,
    efficiency_weight: 30,
    presentation_weight: 15,
    best_practices_weight: 15,
    required_formulas: ['SUM'],
    optional_formulas: ['AVERAGE'],
    expected_charts: []
  },
  time_limit: 15,
  difficulty_rating: 5,
  business_context: 'Quarterly sales analysis for management review',
  required_functions: ['SUM'],
  ...overrides
});

export const createMockSpreadsheetData = (overrides: Partial<SpreadsheetData> = {}): SpreadsheetData => ({
  sheets: [{
    name: 'Test Sheet',
    data: [
      [{ v: 'Quarter' }, { v: 'Sales' }],
      [{ v: 'Q1' }, { v: 10000 }],
      [{ v: 'Q2' }, { v: 15000 }],
      [{ v: 'Q3' }, { v: 12000 }],
      [{ v: 'Q4' }, { v: 18000 }]
    ],
    config: {}
  }],
  metadata: {
    created_at: new Date(),
    version: '1.0'
  },
  ...overrides
});

export const createMockUserAction = (overrides: Partial<UserAction> = {}): UserAction => ({
  timestamp: Date.now(),
  type: 'cell_edit',
  cell_reference: 'C2',
  old_value: null,
  new_value: '=SUM(B2:B5)',
  formula: '=SUM(B2:B5)',
  action_data: {},
  ...overrides
});

export const createMockConceptualProgress = (overrides: Partial<ConceptualProgress> = {}): ConceptualProgress => ({
  questions_answered: 5,
  correct_answers: 4,
  total_score: 80,
  category_scores: {
    'Functions': 85,
    'Formulas': 75,
    'Data Analysis': 80,
    'Charts': 70
  },
  time_spent: 900000, // 15 minutes
  ...overrides
});

export const createMockPracticalProgress = (overrides: Partial<PracticalProgress> = {}): PracticalProgress => ({
  tasks_completed: 3,
  total_accuracy_score: 85,
  total_efficiency_score: 75,
  total_best_practices_score: 80,
  time_spent: 1800000, // 30 minutes
  functions_demonstrated: ['SUM', 'AVERAGE', 'VLOOKUP', 'IF'],
  ...overrides
});

export const createMockExcelAnalytics = (overrides: Partial<ExcelAnalytics> = {}): ExcelAnalytics => ({
  overall_score: 82,
  overall_feedback: 'Strong performance with good Excel fundamentals. Areas for improvement in advanced functions.',
  skill_level_assessment: {
    current_level: 'intermediate',
    recommended_level: 'intermediate',
    readiness_score: 82,
    confidence_interval: 12
  },
  conceptual_analysis: {
    total_score: 80,
    category_breakdown: {
      'Functions': {
        score: 85,
        max_score: 100,
        percentage: 85,
        feedback: 'Excellent understanding of basic functions'
      },
      'Formulas': {
        score: 75,
        max_score: 100,
        percentage: 75,
        feedback: 'Good formula construction skills'
      }
    },
    knowledge_gaps: ['Advanced functions', 'Array formulas'],
    strengths: ['Basic functions', 'Data manipulation']
  },
  practical_analysis: {
    total_score: 80,
    task_breakdown: [{
      task_id: 'test-task-1',
      task_name: 'Sales Analysis',
      accuracy_score: 85,
      efficiency_score: 75,
      best_practices_score: 80,
      completion_time: 900000,
      feedback: 'Good analysis with room for efficiency improvement'
    }],
    formula_proficiency: {
      functions_used: ['SUM', 'AVERAGE', 'VLOOKUP'],
      functions_mastered: ['SUM', 'AVERAGE'],
      functions_struggled: ['VLOOKUP'],
      complexity_level_achieved: 2,
      formula_accuracy_rate: 85
    },
    efficiency_metrics: {
      average_task_completion_time: 15,
      optimal_solution_rate: 75,
      unnecessary_steps_count: 3,
      keyboard_shortcuts_used: 2
    },
    best_practices_adherence: {
      score: 80,
      practices_followed: ['Proper cell referencing', 'Clear formatting'],
      practices_violated: ['Missing documentation'],
      recommendations: ['Add comments to complex formulas']
    }
  },
  excel_skill_breakdown: {
    formula_accuracy: {
      score: 85,
      feedback: 'Strong formula construction skills',
      examples: ['=SUM(B2:B5)', '=AVERAGE(B2:B5)'],
      improvement_areas: ['Complex nested formulas']
    },
    data_analysis: {
      score: 80,
      feedback: 'Good analytical approach',
      examples: ['Quarterly trend analysis'],
      improvement_areas: ['Statistical functions']
    },
    efficiency: {
      score: 75,
      feedback: 'Room for improvement in speed',
      examples: ['Task completion within time limit'],
      improvement_areas: ['Keyboard shortcuts', 'Template usage']
    },
    best_practices: {
      score: 80,
      feedback: 'Generally follows good practices',
      examples: ['Consistent formatting'],
      improvement_areas: ['Documentation', 'Error handling']
    },
    presentation: {
      score: 78,
      feedback: 'Clear and professional presentation',
      examples: ['Well-formatted tables'],
      improvement_areas: ['Chart design', 'Color usage']
    },
    problem_solving: {
      score: 82,
      feedback: 'Systematic approach to problems',
      examples: ['Step-by-step analysis'],
      improvement_areas: ['Alternative solution exploration']
    }
  },
  improvement_plan: [{
    priority: 'high',
    skill: 'Advanced Functions',
    current_level: 60,
    target_level: 80,
    recommendation: 'Practice INDEX/MATCH and array formulas',
    resources: [{
      type: 'tutorial',
      title: 'Advanced Excel Functions Course',
      description: 'Comprehensive guide to advanced Excel functions'
    }],
    estimated_time: '2-3 weeks'
  }],
  competency_matrix: {
    basic_functions: {
      level: 'advanced',
      score: 90,
      evidence: ['Excellent SUM/AVERAGE usage']
    },
    intermediate_functions: {
      level: 'intermediate',
      score: 75,
      evidence: ['Good VLOOKUP implementation']
    },
    advanced_functions: {
      level: 'beginner',
      score: 45,
      evidence: ['Limited INDEX/MATCH usage']
    },
    data_analysis: {
      level: 'intermediate',
      score: 80,
      evidence: ['Effective trend analysis']
    },
    visualization: {
      level: 'beginner',
      score: 60,
      evidence: ['Basic chart creation']
    },
    automation: {
      level: 'novice',
      score: 30,
      evidence: ['No macro usage observed']
    }
  },
  ...overrides
});

export const createMockExcelSession = (overrides: Partial<ExcelInterviewSession> = {}): ExcelInterviewSession => ({
  id: 1,
  response_id: 1,
  current_state: 'introduction',
  state_data: {
    questions_completed: 0,
    tasks_completed: 0,
    total_questions: 5,
    total_tasks: 3
  },
  conceptual_progress: createMockConceptualProgress(),
  practical_progress: createMockPracticalProgress(),
  start_time: new Date(),
  state_history: [],
  ...overrides
});

// Test Helper Functions

export const waitFor = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export const mockApiResponse = <T>(data: T, delay = 0): Promise<T> => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message: string, delay = 0): Promise<never> => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Mock OpenAI Response Generator
export const createMockOpenAIResponse = (content: any) => ({
  choices: [{
    message: {
      content: JSON.stringify(content)
    }
  }]
});

// Skill Level Test Data
export const skillLevelTestData: Record<ExcelSkillLevel, {
  questions: ExcelQuestion[];
  tasks: PracticalTask[];
  expectedScores: { min: number; max: number };
}> = {
  basic: {
    questions: [
      createMockExcelQuestion({
        id: 'basic-q1',
        question: 'How do you create a SUM formula?',
        difficulty_rating: 3,
        expected_functions: ['SUM']
      }),
      createMockExcelQuestion({
        id: 'basic-q2',
        question: 'What does the AVERAGE function do?',
        difficulty_rating: 2,
        expected_functions: ['AVERAGE']
      })
    ],
    tasks: [
      createMockPracticalTask({
        id: 'basic-t1',
        name: 'Simple Calculations',
        difficulty_rating: 3,
        required_functions: ['SUM', 'AVERAGE'],
        time_limit: 10
      })
    ],
    expectedScores: { min: 60, max: 80 }
  },
  intermediate: {
    questions: [
      createMockExcelQuestion({
        id: 'int-q1',
        question: 'Explain the difference between VLOOKUP and INDEX/MATCH',
        difficulty_rating: 6,
        expected_functions: ['VLOOKUP', 'INDEX', 'MATCH']
      }),
      createMockExcelQuestion({
        id: 'int-q2',
        question: 'How do you create a pivot table?',
        difficulty_rating: 5,
        category: 'Data Analysis'
      })
    ],
    tasks: [
      createMockPracticalTask({
        id: 'int-t1',
        name: 'Data Analysis with Lookups',
        difficulty_rating: 6,
        required_functions: ['VLOOKUP', 'SUMIF', 'COUNTIF'],
        time_limit: 20
      })
    ],
    expectedScores: { min: 70, max: 90 }
  },
  advanced: {
    questions: [
      createMockExcelQuestion({
        id: 'adv-q1',
        question: 'How do you create dynamic array formulas?',
        difficulty_rating: 9,
        expected_functions: ['FILTER', 'SORT', 'UNIQUE']
      }),
      createMockExcelQuestion({
        id: 'adv-q2',
        question: 'Explain Power Query and its applications',
        difficulty_rating: 8,
        category: 'Data Analysis'
      })
    ],
    tasks: [
      createMockPracticalTask({
        id: 'adv-t1',
        name: 'Complex Data Modeling',
        difficulty_rating: 9,
        required_functions: ['INDEX', 'MATCH', 'INDIRECT', 'OFFSET'],
        time_limit: 30
      })
    ],
    expectedScores: { min: 80, max: 95 }
  }
};

// Test Assertion Helpers
export const assertValidExcelAnalytics = (analytics: ExcelAnalytics): void => {
  expect(analytics.overall_score).toBeGreaterThanOrEqual(0);
  expect(analytics.overall_score).toBeLessThanOrEqual(100);
  expect(analytics.overall_feedback).toBeDefined();
  expect(analytics.skill_level_assessment).toBeDefined();
  expect(analytics.conceptual_analysis).toBeDefined();
  expect(analytics.practical_analysis).toBeDefined();
  expect(analytics.excel_skill_breakdown).toBeDefined();
  expect(analytics.improvement_plan).toBeInstanceOf(Array);
  expect(analytics.competency_matrix).toBeDefined();
};

export const assertValidSpreadsheetResult = (result: any): void => {
  expect(result.task_id).toBeDefined();
  expect(result.accuracy_score).toBeGreaterThanOrEqual(0);
  expect(result.accuracy_score).toBeLessThanOrEqual(100);
  expect(result.efficiency_score).toBeGreaterThanOrEqual(0);
  expect(result.efficiency_score).toBeLessThanOrEqual(100);
  expect(result.best_practices_score).toBeGreaterThanOrEqual(0);
  expect(result.best_practices_score).toBeLessThanOrEqual(100);
  expect(result.completion_time).toBeGreaterThan(0);
};

// Mock Environment Setup
export const setupTestEnvironment = () => {
  // Mock console methods
  global.console = {
    ...console,
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  // Mock localStorage
  const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  };
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
  });

  // Mock fetch
  global.fetch = jest.fn();

  // Mock Date.now for consistent timestamps
  const mockDate = new Date('2024-01-01T00:00:00.000Z');
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate);
};

// Cleanup function
export const cleanupTestEnvironment = () => {
  jest.restoreAllMocks();
  jest.clearAllMocks();
};

// Export commonly used expect functions for convenience
export { expect } from '@jest/globals';