import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ExcelInterviewSession, ExcelInterviewState, StateTransition } from "@/types/excel";

const supabase = createClientComponentClient();

/**
 * Service for managing Excel interview sessions in the database
 */
export class ExcelInterviewSessionService {
  /**
   * Create a new Excel interview session
   */
  static async createSession(session: Omit<ExcelInterviewSession, 'id'>): Promise<ExcelInterviewSession | null> {
    try {
      const { data, error } = await supabase
        .from("excel_interview_session")
        .insert({
          response_id: session.response_id,
          current_state: session.current_state,
          state_data: session.state_data,
          conceptual_progress: session.conceptual_progress,
          practical_progress: session.practical_progress,
          start_time: session.start_time.toISOString(),
          end_time: session.end_time?.toISOString(),
          total_duration: session.total_duration,
          state_history: session.state_history
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating Excel interview session:", error);
        return null;
      }

      return this.mapDatabaseToSession(data);
    } catch (error) {
      console.error("Error in createSession:", error);
      return null;
    }
  }

  /**
   * Get session by response ID
   */
  static async getSessionByResponseId(responseId: number): Promise<ExcelInterviewSession | null> {
    try {
      const { data, error } = await supabase
        .from("excel_interview_session")
        .select("*")
        .eq("response_id", responseId)
        .single();

      if (error) {
        console.error("Error fetching session:", error);
        return null;
      }

      return this.mapDatabaseToSession(data);
    } catch (error) {
      console.error("Error in getSessionByResponseId:", error);
      return null;
    }
  }

  /**
   * Update session state and data
   */
  static async updateSession(
    sessionId: number, 
    updates: Partial<ExcelInterviewSession>
  ): Promise<ExcelInterviewSession | null> {
    try {
      const updateData: any = {};

      if (updates.current_state) updateData.current_state = updates.current_state;
      if (updates.state_data) updateData.state_data = updates.state_data;
      if (updates.conceptual_progress) updateData.conceptual_progress = updates.conceptual_progress;
      if (updates.practical_progress) updateData.practical_progress = updates.practical_progress;
      if (updates.end_time) updateData.end_time = updates.end_time.toISOString();
      if (updates.total_duration) updateData.total_duration = updates.total_duration;
      if (updates.state_history) updateData.state_history = updates.state_history;

      const { data, error } = await supabase
        .from("excel_interview_session")
        .update(updateData)
        .eq("id", sessionId)
        .select()
        .single();

      if (error) {
        console.error("Error updating session:", error);
        return null;
      }

      return this.mapDatabaseToSession(data);
    } catch (error) {
      console.error("Error in updateSession:", error);
      return null;
    }
  }

  /**
   * Record state transition
   */
  static async recordStateTransition(
    sessionId: number,
    transition: StateTransition
  ): Promise<boolean> {
    try {
      // Get current session
      const { data: currentSession, error: fetchError } = await supabase
        .from("excel_interview_session")
        .select("state_history, current_state")
        .eq("id", sessionId)
        .single();

      if (fetchError) {
        console.error("Error fetching current session:", fetchError);
        return false;
      }

      // Update state history and current state
      const updatedHistory = [...(currentSession.state_history || []), transition];

      const { error: updateError } = await supabase
        .from("excel_interview_session")
        .update({
          current_state: transition.to_state,
          state_history: updatedHistory
        })
        .eq("id", sessionId);

      if (updateError) {
        console.error("Error recording state transition:", updateError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in recordStateTransition:", error);
      return false;
    }
  }

  /**
   * Get all sessions for an interview
   */
  static async getSessionsByInterviewId(interviewId: string): Promise<ExcelInterviewSession[]> {
    try {
      const { data, error } = await supabase
        .from("excel_interview_session")
        .select(`
          *,
          response!inner(interview_id)
        `)
        .eq("response.interview_id", interviewId)
        .order("start_time", { ascending: false });

      if (error) {
        console.error("Error fetching sessions by interview ID:", error);
        return [];
      }

      return data.map(this.mapDatabaseToSession);
    } catch (error) {
      console.error("Error in getSessionsByInterviewId:", error);
      return [];
    }
  }

  /**
   * Get session statistics
   */
  static async getSessionStats(sessionId: number): Promise<{
    totalDuration: number;
    stateTransitions: number;
    currentProgress: number;
    timePerState: Record<ExcelInterviewState, number>;
  } | null> {
    try {
      const session = await this.getSessionByResponseId(sessionId);
      if (!session) return null;

      const stateTransitions = session.state_history.length;
      const totalDuration = session.total_duration || 0;

      // Calculate time spent in each state
      const timePerState: Record<ExcelInterviewState, number> = {
        'introduction': 0,
        'conceptual_questions': 0,
        'practical_tasks': 0,
        'feedback_generation': 0,
        'conclusion': 0
      };

      // Calculate time spent in each state based on transitions
      for (let i = 0; i < session.state_history.length; i++) {
        const transition = session.state_history[i];
        const nextTransition = session.state_history[i + 1];
        
        const stateStartTime = transition.timestamp.getTime();
        const stateEndTime = nextTransition 
          ? nextTransition.timestamp.getTime()
          : (session.end_time?.getTime() || Date.now());
        
        const stateDuration = stateEndTime - stateStartTime;
        timePerState[transition.to_state] += stateDuration;
      }

      // Calculate current progress
      const stateOrder: ExcelInterviewState[] = [
        'introduction',
        'conceptual_questions',
        'practical_tasks', 
        'feedback_generation',
        'conclusion'
      ];
      const currentStateIndex = stateOrder.indexOf(session.current_state);
      const currentProgress = ((currentStateIndex + 1) / stateOrder.length) * 100;

      return {
        totalDuration,
        stateTransitions,
        currentProgress,
        timePerState
      };
    } catch (error) {
      console.error("Error in getSessionStats:", error);
      return null;
    }
  }

  /**
   * Delete session
   */
  static async deleteSession(sessionId: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("excel_interview_session")
        .delete()
        .eq("id", sessionId);

      if (error) {
        console.error("Error deleting session:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteSession:", error);
      return false;
    }
  }

  /**
   * Get active sessions (not concluded)
   */
  static async getActiveSessions(): Promise<ExcelInterviewSession[]> {
    try {
      const { data, error } = await supabase
        .from("excel_interview_session")
        .select("*")
        .neq("current_state", "conclusion")
        .order("start_time", { ascending: false });

      if (error) {
        console.error("Error fetching active sessions:", error);
        return [];
      }

      return data.map(this.mapDatabaseToSession);
    } catch (error) {
      console.error("Error in getActiveSessions:", error);
      return [];
    }
  }

  /**
   * Map database row to ExcelInterviewSession interface
   */
  private static mapDatabaseToSession(data: any): ExcelInterviewSession {
    return {
      id: data.id,
      response_id: data.response_id,
      current_state: data.current_state,
      state_data: data.state_data || {
        questions_completed: 0,
        tasks_completed: 0,
        total_questions: 0,
        total_tasks: 0
      },
      conceptual_progress: data.conceptual_progress || {
        questions_answered: 0,
        correct_answers: 0,
        total_score: 0,
        category_scores: {},
        time_spent: 0
      },
      practical_progress: data.practical_progress || {
        tasks_completed: 0,
        total_accuracy_score: 0,
        total_efficiency_score: 0,
        total_best_practices_score: 0,
        time_spent: 0,
        functions_demonstrated: []
      },
      start_time: new Date(data.start_time),
      end_time: data.end_time ? new Date(data.end_time) : undefined,
      total_duration: data.total_duration,
      state_history: (data.state_history || []).map((transition: any) => ({
        ...transition,
        timestamp: new Date(transition.timestamp)
      }))
    };
  }
}

export default ExcelInterviewSessionService;