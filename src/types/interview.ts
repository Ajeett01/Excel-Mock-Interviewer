import { ExcelSkillLevel, InterviewType, ExcelQuestion, PracticalTask, ExcelTaskTemplate } from './excel';

export interface Question {
  id: string;
  question: string;
  follow_up_count: number;
}

export interface Quote {
  quote: string;
  call_id: string;
}

export interface InterviewBase {
  user_id: string;
  organization_id: string;
  name: string;
  interviewer_id: bigint;
  objective: string;
  question_count: number;
  time_duration: string;
  is_anonymous: boolean;
  questions: Question[];
  description: string;
  response_count: bigint;
}

export interface InterviewDetails {
  id: string;
  created_at: Date;
  url: string | null;
  insights: string[];
  quotes: Quote[];
  details: any;
  is_active: boolean;
  theme_color: string;
  logo_url: string;
  respondents: string[];
  readable_slug: string;
}

// Extended Interview interface with Excel support
export interface Interview extends InterviewBase, InterviewDetails {
  // Excel-specific fields
  interview_type?: InterviewType;
  excel_skill_level?: ExcelSkillLevel;
  practical_tasks?: PracticalTask[];
  task_templates?: ExcelTaskTemplate[];
  conceptual_question_count?: number;
  practical_task_count?: number;
  excel_questions?: ExcelQuestion[];
}

// Type guards for Excel interviews
export function isExcelInterview(interview: Interview): boolean {
  return interview.interview_type === 'excel';
}

export function hasExcelSkillLevel(interview: Interview): interview is Interview & { excel_skill_level: ExcelSkillLevel } {
  return interview.excel_skill_level !== undefined;
}
