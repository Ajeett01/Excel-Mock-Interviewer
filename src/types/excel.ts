// Excel Interview Types and Interfaces

// Enums matching database schema
export type ExcelSkillLevel = 'basic' | 'intermediate' | 'advanced';
export type InterviewType = 'general' | 'excel';
export type ExcelInterviewState = 'introduction' | 'conceptual_questions' | 'practical_tasks' | 'feedback_generation' | 'conclusion';

// Excel Skill Configuration
export interface ExcelSkillConfig {
  id: number;
  skill_level: ExcelSkillLevel;
  conceptual_topics: string[];
  practical_skills: string[];
  evaluation_criteria: EvaluationCriteria;
  function_requirements: string[];
  complexity_level: number;
  time_allocation: TimeAllocation;
  created_at: Date;
  updated_at: Date;
}

export interface EvaluationCriteria {
  formula_accuracy: number;
  efficiency: number;
  best_practices: number;
}

export interface TimeAllocation {
  conceptual: number;
  practical: number;
  total: number;
}

// Excel Question Types
export interface ExcelQuestion {
  id: string;
  question: string;
  type: 'conceptual' | 'practical';
  skill_level: ExcelSkillLevel;
  category: string;
  expected_functions?: string[];
  difficulty_rating: number;
  follow_up_count: number;
}

export interface PracticalTask {
  id: string;
  name: string;
  description: string;
  scenario: string;
  skill_level: ExcelSkillLevel;
  initial_data: SpreadsheetData;
  expected_outcome: SpreadsheetData;
  evaluation_criteria: TaskEvaluationCriteria;
  time_limit: number;
  difficulty_rating: number;
  business_context: string;
  required_functions: string[];
}

// Spreadsheet Data Structures
export interface SpreadsheetData {
  sheets: SpreadsheetSheet[];
  metadata: SpreadsheetMetadata;
}

export interface SpreadsheetSheet {
  name: string;
  data: CellData[][];
  config: SheetConfig;
}

export interface CellData {
  v?: any; // value
  f?: string; // formula
  ct?: CellType; // cell type
  s?: CellStyle; // style
  m?: string; // display value
}

export interface CellType {
  fa: string; // format
  t: string; // type
}

export interface CellStyle {
  bg?: string; // background color
  fc?: string; // font color
  ff?: string; // font family
  fs?: number; // font size
  bl?: number; // bold
  it?: number; // italic
  cl?: number; // color
  ul?: number; // underline
  ht?: number; // horizontal alignment
  vt?: number; // vertical alignment
}

export interface SheetConfig {
  merge?: MergeRange[];
  borderInfo?: BorderInfo[];
  rowlen?: { [key: string]: number };
  columnlen?: { [key: string]: number };
}

export interface MergeRange {
  r: number; // row
  c: number; // column
  rs: number; // row span
  cs: number; // column span
}

export interface BorderInfo {
  rangeType: string;
  value: {
    row_index: number;
    col_index: number;
    l?: BorderStyle;
    r?: BorderStyle;
    t?: BorderStyle;
    b?: BorderStyle;
  };
}

export interface BorderStyle {
  style: number;
  color: string;
}

export interface SpreadsheetMetadata {
  created_at: Date;
  version: string;
  author?: string;
}

// Task Evaluation
export interface TaskEvaluationCriteria {
  formula_accuracy_weight: number;
  efficiency_weight: number;
  presentation_weight: number;
  best_practices_weight: number;
  required_formulas: string[];
  optional_formulas: string[];
  expected_charts?: ChartRequirement[];
}

export interface ChartRequirement {
  type: string;
  data_range: string;
  required: boolean;
}

// Spreadsheet Results and Actions
export interface SpreadsheetResult {
  id: number;
  response_id: number;
  task_id: string;
  task_name: string;
  initial_state: SpreadsheetData;
  final_state: SpreadsheetData;
  user_actions: UserAction[];
  formulas_used: string[];
  functions_used: string[];
  completion_time: number;
  accuracy_score: number;
  efficiency_score: number;
  best_practices_score: number;
  task_feedback: string;
  expected_solution: SpreadsheetData;
  created_at: Date;
}

export interface UserAction {
  timestamp: number;
  type: ActionType;
  cell_reference?: string;
  old_value?: any;
  new_value?: any;
  formula?: string;
  range?: string;
  action_data: any;
}

export type ActionType = 
  | 'cell_edit'
  | 'formula_input'
  | 'format_change'
  | 'insert_row'
  | 'insert_column'
  | 'delete_row'
  | 'delete_column'
  | 'merge_cells'
  | 'unmerge_cells'
  | 'create_chart'
  | 'modify_chart'
  | 'sort_data'
  | 'filter_data'
  | 'pivot_table'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'undo'
  | 'redo';

// Excel Task Template
export interface ExcelTaskTemplate {
  id: number;
  name: string;
  description: string;
  skill_level: ExcelSkillLevel;
  scenario: string;
  initial_data: SpreadsheetData;
  expected_outcome: SpreadsheetData;
  evaluation_criteria: TaskEvaluationCriteria;
  time_limit: number;
  difficulty_rating: number;
  business_context: string;
  required_functions: string[];
  created_at: Date;
  updated_at: Date;
}

// Excel Interview Session
export interface ExcelInterviewSession {
  id: number;
  response_id: number;
  current_state: ExcelInterviewState;
  state_data: StateData;
  conceptual_progress: ConceptualProgress;
  practical_progress: PracticalProgress;
  start_time: Date;
  end_time?: Date;
  total_duration?: number;
  state_history: StateTransition[];
}

export interface StateData {
  current_question_index?: number;
  current_task_index?: number;
  questions_completed: number;
  tasks_completed: number;
  total_questions: number;
  total_tasks: number;
  feedback_generated?: boolean;
}

export interface ConceptualProgress {
  questions_answered: number;
  correct_answers: number;
  total_score: number;
  category_scores: { [category: string]: number };
  time_spent: number;
}

export interface PracticalProgress {
  tasks_completed: number;
  total_accuracy_score: number;
  total_efficiency_score: number;
  total_best_practices_score: number;
  time_spent: number;
  functions_demonstrated: string[];
}

export interface StateTransition {
  from_state: ExcelInterviewState;
  to_state: ExcelInterviewState;
  timestamp: Date;
  trigger: string;
  data?: any;
}

// Excel Analytics
export interface ExcelAnalytics {
  overall_score: number;
  overall_feedback: string;
  skill_level_assessment: SkillLevelAssessment;
  conceptual_analysis: ConceptualAnalysis;
  practical_analysis: PracticalAnalysis;
  excel_skill_breakdown: ExcelSkillBreakdown;
  improvement_plan: ImprovementPlan[];
  competency_matrix: CompetencyMatrix;
}

export interface SkillLevelAssessment {
  current_level: ExcelSkillLevel;
  recommended_level: ExcelSkillLevel;
  readiness_score: number;
  confidence_interval: number;
}

export interface ConceptualAnalysis {
  total_score: number;
  category_breakdown: { [category: string]: CategoryScore };
  knowledge_gaps: string[];
  strengths: string[];
}

export interface CategoryScore {
  score: number;
  max_score: number;
  percentage: number;
  feedback: string;
}

export interface PracticalAnalysis {
  total_score: number;
  task_breakdown: TaskScore[];
  formula_proficiency: FormulaProficiency;
  efficiency_metrics: EfficiencyMetrics;
  best_practices_adherence: BestPracticesScore;
}

export interface TaskScore {
  task_id: string;
  task_name: string;
  accuracy_score: number;
  efficiency_score: number;
  best_practices_score: number;
  completion_time: number;
  feedback: string;
}

export interface FormulaProficiency {
  functions_used: string[];
  functions_mastered: string[];
  functions_struggled: string[];
  complexity_level_achieved: number;
  formula_accuracy_rate: number;
}

export interface EfficiencyMetrics {
  average_task_completion_time: number;
  optimal_solution_rate: number;
  unnecessary_steps_count: number;
  keyboard_shortcuts_used: number;
}

export interface BestPracticesScore {
  score: number;
  practices_followed: string[];
  practices_violated: string[];
  recommendations: string[];
}

export interface ExcelSkillBreakdown {
  formula_accuracy: SkillScore;
  data_analysis: SkillScore;
  efficiency: SkillScore;
  best_practices: SkillScore;
  presentation: SkillScore;
  problem_solving: SkillScore;
}

export interface SkillScore {
  score: number;
  feedback: string;
  examples: string[];
  improvement_areas: string[];
}

export interface ImprovementPlan {
  priority: 'high' | 'medium' | 'low';
  skill: string;
  current_level: number;
  target_level: number;
  recommendation: string;
  resources: LearningResource[];
  estimated_time: string;
}

export interface LearningResource {
  type: 'tutorial' | 'practice' | 'documentation' | 'course';
  title: string;
  url?: string;
  description: string;
}

export interface CompetencyMatrix {
  basic_functions: CompetencyLevel;
  intermediate_functions: CompetencyLevel;
  advanced_functions: CompetencyLevel;
  data_analysis: CompetencyLevel;
  visualization: CompetencyLevel;
  automation: CompetencyLevel;
}

export interface CompetencyLevel {
  level: 'novice' | 'beginner' | 'intermediate' | 'advanced' | 'expert';
  score: number;
  evidence: string[];
}

// Excel Interview Configuration
export interface ExcelInterviewConfig {
  skill_level: ExcelSkillLevel;
  conceptual_question_count: number;
  practical_task_count: number;
  time_allocation: TimeAllocation;
  difficulty_progression: boolean;
  adaptive_questioning: boolean;
  business_scenarios: string[];
  industry_context?: string;
}

// API Request/Response Types
export interface CreateExcelInterviewRequest {
  name: string;
  description: string;
  objective: string;
  skill_level: ExcelSkillLevel;
  config: ExcelInterviewConfig;
  organization_id: string;
  user_id: string;
  interviewer_id: number;
}

export interface ExcelQuestionGenerationRequest {
  skill_level: ExcelSkillLevel;
  question_count: number;
  business_context?: string;
  industry?: string;
  job_role?: string;
}

export interface SpreadsheetEvaluationRequest {
  task_id: string;
  initial_state: SpreadsheetData;
  final_state: SpreadsheetData;
  user_actions: UserAction[];
  expected_solution: SpreadsheetData;
  evaluation_criteria: TaskEvaluationCriteria;
}

export interface SpreadsheetEvaluationResponse {
  accuracy_score: number;
  efficiency_score: number;
  best_practices_score: number;
  overall_score: number;
  feedback: string;
  detailed_analysis: DetailedAnalysis;
}

export interface DetailedAnalysis {
  formula_analysis: FormulaAnalysis[];
  efficiency_analysis: string[];
  best_practices_analysis: string[];
  suggestions: string[];
}

export interface FormulaAnalysis {
  cell_reference: string;
  formula: string;
  is_correct: boolean;
  expected_formula?: string;
  feedback: string;
  complexity_score: number;
}

// State Management Types
export interface ExcelInterviewStateManager {
  current_state: ExcelInterviewState;
  session_data: ExcelInterviewSession;
  transition_to: (new_state: ExcelInterviewState, data?: any) => Promise<boolean>;
  can_transition: (to_state: ExcelInterviewState) => boolean;
  get_completion_criteria: () => CompletionCriteria;
}

export interface CompletionCriteria {
  conceptual_questions_completed: boolean;
  practical_tasks_completed: boolean;
  minimum_score_achieved: boolean;
  time_limit_respected: boolean;
}

// Component Props Types
export interface ExcelInterviewCallProps {
  interview: ExcelInterview;
  onStateChange?: (state: ExcelInterviewState) => void;
  onComplete?: (analytics: ExcelAnalytics) => void;
}

export interface SpreadsheetWorkspaceProps {
  task: PracticalTask;
  onActionPerformed: (action: UserAction) => void;
  onTaskComplete: (result: SpreadsheetResult) => void;
  readonly?: boolean;
}

export interface TaskInstructionsProps {
  task: PracticalTask;
  progress: PracticalProgress;
  timeRemaining: number;
}

// Extended Interview Types
export interface ExcelInterview {
  // Base interview properties
  id: string;
  created_at: Date;
  name: string;
  description: string;
  objective: string;
  organization_id: string;
  user_id: string;
  interviewer_id: number;
  is_active: boolean;
  is_anonymous: boolean;
  is_archived: boolean;
  logo_url?: string;
  theme_color: string;
  url?: string;
  readable_slug?: string;
  insights: string[];
  respondents: string[];
  response_count: number;
  time_duration: string;
  
  // Excel-specific properties
  interview_type: InterviewType;
  excel_skill_level: ExcelSkillLevel;
  questions: ExcelQuestion[];
  practical_tasks: PracticalTask[];
  task_templates: ExcelTaskTemplate[];
  conceptual_question_count: number;
  practical_task_count: number;
  question_count: number; // total questions
}

export interface ExcelResponse {
  // Base response properties
  id: number;
  created_at: Date;
  name?: string;
  interview_id: string;
  duration: number;
  call_id: string;
  details: any;
  is_analysed: boolean;
  email: string;
  is_ended: boolean;
  is_viewed: boolean;
  analytics: any;
  candidate_status: string;
  tab_switch_count: number;
  
  // Excel-specific properties
  excel_analytics: ExcelAnalytics;
  spreadsheet_results: SpreadsheetResult[];
  current_state: ExcelInterviewState;
  state_transitions: StateTransition[];
  conceptual_scores: ConceptualProgress;
  practical_scores: PracticalProgress;
}