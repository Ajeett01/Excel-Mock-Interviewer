import { ExcelEvaluationService } from '../services/excel-evaluation.service';
import { ExcelQuestion, PracticalTask, ExcelSkillLevel, SpreadsheetData, UserAction } from '../types/excel';

// Mock OpenAI
jest.mock('openai', () => ({
  OpenAI: jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{
            message: {
              content: JSON.stringify({
                score: 85,
                feedback: "Excellent understanding of Excel formulas",
                strengths: ["Strong formula knowledge", "Good problem-solving approach"],
                improvements: ["Could improve efficiency"],
                followUpSuggested: false,
                technicalAccuracy: 90,
                practicalUnderstanding: 80,
                communicationClarity: 85
              })
            }
          }]
        })
      }
    }
  }))
}));

describe('ExcelEvaluationService', () => {
  const mockQuestion: ExcelQuestion = {
    id: 'test-question-1',
    question: 'What is the VLOOKUP function used for?',
    type: 'conceptual',
    skill_level: 'intermediate',
    category: 'Functions',
    expected_functions: ['VLOOKUP'],
    difficulty_rating: 6,
    follow_up_count: 0
  };

  const mockTask: PracticalTask = {
    id: 'test-task-1',
    name: 'Sales Analysis',
    description: 'Analyze quarterly sales data',
    scenario: 'You have sales data for Q1-Q4',
    skill_level: 'intermediate',
    initial_data: {
      sheets: [{
        name: 'Sales Data',
        data: [
          [{ v: 'Quarter' }, { v: 'Sales' }],
          [{ v: 'Q1' }, { v: 10000 }],
          [{ v: 'Q2' }, { v: 15000 }]
        ],
        config: {}
      }],
      metadata: {
        created_at: new Date(),
        version: '1.0'
      }
    },
    expected_outcome: {
      sheets: [{
        name: 'Sales Data',
        data: [
          [{ v: 'Quarter' }, { v: 'Sales' }, { v: 'Total' }],
          [{ v: 'Q1' }, { v: 10000 }, { f: '=SUM(B2:B3)' }],
          [{ v: 'Q2' }, { v: 15000 }, { f: '=SUM(B2:B3)' }]
        ],
        config: {}
      }],
      metadata: {
        created_at: new Date(),
        version: '1.0'
      }
    },
    evaluation_criteria: {
      formula_accuracy_weight: 40,
      efficiency_weight: 30,
      presentation_weight: 15,
      best_practices_weight: 15,
      required_formulas: ['SUM'],
      optional_formulas: [],
      expected_charts: []
    },
    time_limit: 15,
    difficulty_rating: 5,
    business_context: 'Sales analysis for quarterly review',
    required_functions: ['SUM']
  };

  const mockUserActions: UserAction[] = [
    {
      timestamp: Date.now(),
      type: 'cell_edit',
      cell_reference: 'C2',
      old_value: null,
      new_value: '=SUM(B2:B3)',
      formula: '=SUM(B2:B3)',
      action_data: {}
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('evaluateConceptualResponse', () => {
    it('should evaluate a conceptual response correctly', async () => {
      const result = await ExcelEvaluationService.evaluateConceptualResponse(
        mockQuestion,
        'VLOOKUP is used to search for a value in the first column of a table and return a value in the same row from another column.',
        'intermediate'
      );

      expect(result).toBeDefined();
      expect(result.score).toBe(85);
      expect(result.feedback).toBe("Excellent understanding of Excel formulas");
      expect(result.strengths).toContain("Strong formula knowledge");
      expect(result.improvements).toContain("Could improve efficiency");
      expect(result.followUpSuggested).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      const result = await ExcelEvaluationService.evaluateConceptualResponse(
        mockQuestion,
        'Test response',
        'intermediate'
      );

      expect(result.score).toBe(0);
      expect(result.feedback).toBe("Error occurred during evaluation");
      expect(result.improvements).toContain("Technical evaluation error occurred");
    });
  });

  describe('evaluatePracticalTask', () => {
    it('should evaluate a practical task correctly', async () => {
      const result = await ExcelEvaluationService.evaluatePracticalTask(
        mockTask,
        mockTask.initial_data,
        mockTask.expected_outcome,
        mockUserActions,
        900000 // 15 minutes in milliseconds
      );

      expect(result).toBeDefined();
      expect(result.task_id).toBe('test-task-1');
      expect(result.completion_time).toBe(900000);
      expect(result.accuracy_score).toBeGreaterThan(0);
      expect(result.efficiency_score).toBeGreaterThan(0);
      expect(result.best_practices_score).toBeGreaterThan(0);
    });

    it('should handle empty user actions', async () => {
      const result = await ExcelEvaluationService.evaluatePracticalTask(
        mockTask,
        mockTask.initial_data,
        mockTask.initial_data, // No changes made
        [],
        300000 // 5 minutes
      );

      expect(result).toBeDefined();
      expect(result.accuracy_score).toBe(0);
      expect(result.functions_used).toHaveLength(0);
    });
  });

  describe('generateExcelAnalytics', () => {
    it('should generate comprehensive analytics', async () => {
      const conceptualProgress = {
        questions_answered: 5,
        correct_answers: 4,
        total_score: 80,
        category_scores: { 'Functions': 85, 'Formulas': 75 },
        time_spent: 900000
      };

      const practicalProgress = {
        tasks_completed: 3,
        total_accuracy_score: 85,
        total_efficiency_score: 75,
        total_best_practices_score: 80,
        time_spent: 1800000,
        functions_demonstrated: ['SUM', 'VLOOKUP', 'IF']
      };

      const spreadsheetResults = [{
        id: 1,
        response_id: 1,
        task_id: 'test-task-1',
        task_name: 'Sales Analysis',
        initial_state: mockTask.initial_data,
        final_state: mockTask.expected_outcome,
        user_actions: mockUserActions,
        formulas_used: ['=SUM(B2:B3)'],
        functions_used: ['SUM'],
        completion_time: 900000,
        accuracy_score: 85,
        efficiency_score: 75,
        best_practices_score: 80,
        task_feedback: 'Good work on the analysis',
        expected_solution: mockTask.expected_outcome,
        created_at: new Date()
      }];

      const analytics = await ExcelEvaluationService.generateExcelAnalytics(
        'intermediate',
        conceptualProgress,
        practicalProgress,
        spreadsheetResults,
        2700000 // 45 minutes total
      );

      expect(analytics).toBeDefined();
      expect(analytics.overall_score).toBeGreaterThan(0);
      expect(analytics.overall_feedback).toBeDefined();
      expect(analytics.skill_level_assessment).toBeDefined();
      expect(analytics.conceptual_analysis).toBeDefined();
      expect(analytics.practical_analysis).toBeDefined();
      expect(analytics.excel_skill_breakdown).toBeDefined();
      expect(analytics.improvement_plan).toBeDefined();
      expect(analytics.competency_matrix).toBeDefined();
    });

    it('should return basic analytics on error', async () => {
      // Mock API error
      const mockOpenAI = require('openai').OpenAI;
      mockOpenAI.mockImplementationOnce(() => ({
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error('API Error'))
          }
        }
      }));

      const analytics = await ExcelEvaluationService.generateExcelAnalytics(
        'basic',
        { questions_answered: 0, correct_answers: 0, total_score: 0, category_scores: {}, time_spent: 0 },
        { tasks_completed: 0, total_accuracy_score: 0, total_efficiency_score: 0, total_best_practices_score: 0, time_spent: 0, functions_demonstrated: [] },
        [],
        0
      );

      expect(analytics).toBeDefined();
      expect(analytics.overall_score).toBeDefined();
      expect(analytics.overall_feedback).toContain('basic level Excel skills');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined inputs gracefully', async () => {
      const result = await ExcelEvaluationService.evaluateConceptualResponse(
        mockQuestion,
        '',
        'basic'
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should handle invalid skill levels', async () => {
      const result = await ExcelEvaluationService.evaluateConceptualResponse(
        mockQuestion,
        'Test response',
        'invalid' as ExcelSkillLevel
      );

      expect(result).toBeDefined();
      expect(result.score).toBeGreaterThanOrEqual(0);
    });
  });
});