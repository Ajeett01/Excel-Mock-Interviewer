import { ExcelAnalytics, SpreadsheetResult, ExcelInterviewState, StateTransition, ConceptualProgress, PracticalProgress } from './excel';

export interface Response {
  id: bigint;
  created_at: Date;
  name: string | null;
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
  // Excel-specific fields
  excel_analytics?: ExcelAnalytics;
  spreadsheet_results?: SpreadsheetResult[];
  current_state?: ExcelInterviewState;
  state_transitions?: StateTransition[];
  conceptual_scores?: ConceptualProgress;
  practical_scores?: PracticalProgress;
}

export interface Analytics {
  overallScore: number;
  overallFeedback: string;
  communication: { score: number; feedback: string };
  generalIntelligence: string;
  softSkillSummary: string;
  questionSummaries: Array<{
    question: string;
    summary: string;
  }>;
}

// Extended Analytics interface for Excel interviews
export interface ExtendedAnalytics extends Analytics {
  excel_analytics?: ExcelAnalytics;
  skill_level_assessment?: {
    current_level: string;
    recommended_level: string;
    readiness_score: number;
  };
}

// Type guards for Excel responses
export function hasExcelAnalytics(response: Response): response is Response & { excel_analytics: ExcelAnalytics } {
  return response.excel_analytics !== undefined;
}

export function hasSpreadsheetResults(response: Response): response is Response & { spreadsheet_results: SpreadsheetResult[] } {
  return response.spreadsheet_results !== undefined && response.spreadsheet_results.length > 0;
}

export interface FeedbackData {
  interview_id: string;
  satisfaction: number | null;
  feedback: string | null;
  email: string | null;
}

export interface CallData {
  call_id: string;
  agent_id: string;
  audio_websocket_protocol: string;
  audio_encoding: string;
  sample_rate: number;
  call_status: string;
  end_call_after_silence_ms: number;
  from_number: string;
  to_number: string;
  metadata: Record<string, unknown>;
  retell_llm_dynamic_variables: {
    customer_name: string;
  };
  drop_call_if_machine_detected: boolean;
  opt_out_sensitive_data_storage: boolean;
  start_timestamp: number;
  end_timestamp: number;
  transcript: string;
  transcript_object: {
    role: "agent" | "user";
    content: string;
    words: {
      word: string;
      start: number;
      end: number;
    }[];
  }[];
  transcript_with_tool_calls: {
    role: "agent" | "user";
    content: string;
    words: {
      word: string;
      start: number;
      end: number;
    }[];
  }[];
  recording_url: string;
  public_log_url: string;
  e2e_latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    num: number;
  };
  llm_latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    num: number;
  };
  llm_websocket_network_rtt_latency: {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    max: number;
    min: number;
    num: number;
  };
  disconnection_reason: string;
  call_analysis: {
    call_summary: string;
    user_sentiment: string;
    agent_sentiment: string;
    agent_task_completion_rating: string;
    agent_task_completion_rating_reason: string;
    call_completion_rating: string;
    call_completion_rating_reason: string;
  };
}
