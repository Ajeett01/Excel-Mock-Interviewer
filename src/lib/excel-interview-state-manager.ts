import { 
  ExcelInterviewState, 
  ExcelInterviewSession, 
  StateTransition, 
  StateData, 
  ConceptualProgress, 
  PracticalProgress,
  CompletionCriteria,
  ExcelInterviewStateManager
} from '@/types/excel';

/**
 * State management for Excel interviews following the 5-state flow:
 * Introduction → Conceptual Questions → Practical Tasks → Feedback Generation → Conclusion
 */
export class ExcelInterviewStateManagerImpl implements ExcelInterviewStateManager {
  private session: ExcelInterviewSession;
  private stateTransitionCallbacks: Map<ExcelInterviewState, (() => Promise<void>)[]> = new Map();
  private completionCriteria: CompletionCriteria;

  constructor(session: ExcelInterviewSession) {
    this.session = session;
    this.completionCriteria = this.initializeCompletionCriteria();
    this.initializeStateCallbacks();
  }

  get current_state(): ExcelInterviewState {
    return this.session.current_state;
  }

  get session_data(): ExcelInterviewSession {
    return { ...this.session };
  }

  /**
   * Transition to a new state with validation and callbacks
   */
  async transition_to(new_state: ExcelInterviewState, data?: any): Promise<boolean> {
    const currentState = this.session.current_state;

    // Validate transition
    if (!this.can_transition(new_state)) {
      console.warn(`Invalid transition from ${currentState} to ${new_state}`);
      return false;
    }

    try {
      // Execute pre-transition callbacks
      await this.executeStateCallbacks(currentState);

      // Record state transition
      const transition: StateTransition = {
        from_state: currentState,
        to_state: new_state,
        timestamp: new Date(),
        trigger: data?.trigger || 'automatic',
        data: data
      };

      // Update session
      this.session.current_state = new_state;
      this.session.state_history.push(transition);
      
      // Update state-specific data
      this.updateStateData(new_state, data);

      // Execute post-transition callbacks
      await this.executeStateCallbacks(new_state);

      console.log(`State transition: ${currentState} → ${new_state}`);
      return true;
    } catch (error) {
      console.error(`Error during state transition: ${error}`);
      return false;
    }
  }

  /**
   * Check if transition to a state is valid
   */
  can_transition(to_state: ExcelInterviewState): boolean {
    const currentState = this.session.current_state;
    const validTransitions = this.getValidTransitions(currentState);
    return validTransitions.includes(to_state);
  }

  /**
   * Get completion criteria for current state
   */
  get_completion_criteria(): CompletionCriteria {
    return { ...this.completionCriteria };
  }

  /**
   * Check if current state is complete and ready for transition
   */
  isCurrentStateComplete(): boolean {
    switch (this.session.current_state) {
      case 'introduction':
        return this.isIntroductionComplete();
      case 'conceptual_questions':
        return this.isConceptualQuestionsComplete();
      case 'practical_tasks':
        return this.isPracticalTasksComplete();
      case 'feedback_generation':
        return this.isFeedbackGenerationComplete();
      case 'conclusion':
        return true; // Conclusion is always complete
      default:
        return false;
    }
  }

  /**
   * Get next state in the flow
   */
  getNextState(): ExcelInterviewState | null {
    const stateFlow: ExcelInterviewState[] = [
      'introduction',
      'conceptual_questions',
      'practical_tasks',
      'feedback_generation',
      'conclusion'
    ];

    const currentIndex = stateFlow.indexOf(this.session.current_state);
    return currentIndex < stateFlow.length - 1 ? stateFlow[currentIndex + 1] : null;
  }

  /**
   * Auto-progress to next state if current state is complete
   */
  async autoProgress(): Promise<boolean> {
    if (!this.isCurrentStateComplete()) {
      return false;
    }

    const nextState = this.getNextState();
    if (!nextState) {
      return false;
    }

    return await this.transition_to(nextState, { trigger: 'auto_progress' });
  }

  /**
   * Update conceptual progress
   */
  updateConceptualProgress(progress: Partial<ConceptualProgress>): void {
    this.session.conceptual_progress = {
      ...this.session.conceptual_progress,
      ...progress
    };
    this.updateCompletionCriteria();
  }

  /**
   * Update practical progress
   */
  updatePracticalProgress(progress: Partial<PracticalProgress>): void {
    this.session.practical_progress = {
      ...this.session.practical_progress,
      ...progress
    };
    this.updateCompletionCriteria();
  }

  /**
   * Add state transition callback
   */
  addStateCallback(state: ExcelInterviewState, callback: () => Promise<void>): void {
    if (!this.stateTransitionCallbacks.has(state)) {
      this.stateTransitionCallbacks.set(state, []);
    }
    this.stateTransitionCallbacks.get(state)!.push(callback);
  }

  /**
   * Get interview progress percentage
   */
  getProgressPercentage(): number {
    const stateWeights: Record<ExcelInterviewState, number> = {
      'introduction': 5,
      'conceptual_questions': 30,
      'practical_tasks': 50,
      'feedback_generation': 10,
      'conclusion': 5
    };

    const currentStateWeight = stateWeights[this.session.current_state];
    let completedWeight = 0;

    // Add weight for completed states
    const stateOrder: ExcelInterviewState[] = [
      'introduction',
      'conceptual_questions', 
      'practical_tasks',
      'feedback_generation',
      'conclusion'
    ];

    const currentIndex = stateOrder.indexOf(this.session.current_state);
    for (let i = 0; i < currentIndex; i++) {
      completedWeight += stateWeights[stateOrder[i]];
    }

    // Add partial weight for current state
    let currentStateProgress = 0;
    switch (this.session.current_state) {
      case 'conceptual_questions':
        const conceptualTotal = this.session.state_data.total_questions || 1;
        const conceptualCompleted = this.session.state_data.questions_completed || 0;
        currentStateProgress = (conceptualCompleted / conceptualTotal) * currentStateWeight;
        break;
      case 'practical_tasks':
        const practicalTotal = this.session.state_data.total_tasks || 1;
        const practicalCompleted = this.session.state_data.tasks_completed || 0;
        currentStateProgress = (practicalCompleted / practicalTotal) * currentStateWeight;
        break;
      default:
        currentStateProgress = this.isCurrentStateComplete() ? currentStateWeight : 0;
    }

    return Math.min(100, completedWeight + currentStateProgress);
  }

  /**
   * Get time remaining for current state
   */
  getTimeRemaining(): number {
    const stateTimeAllocations: Record<ExcelInterviewState, number> = {
      'introduction': 2, // 2 minutes
      'conceptual_questions': this.session.conceptual_progress?.time_spent || 15,
      'practical_tasks': this.session.practical_progress?.time_spent || 25,
      'feedback_generation': 3, // 3 minutes
      'conclusion': 2 // 2 minutes
    };

    const allocatedTime = stateTimeAllocations[this.session.current_state] * 60 * 1000; // Convert to milliseconds
    const elapsedTime = Date.now() - this.session.start_time.getTime();
    
    return Math.max(0, allocatedTime - elapsedTime);
  }

  /**
   * Export session data for persistence
   */
  exportSession(): ExcelInterviewSession {
    return {
      ...this.session,
      end_time: this.session.current_state === 'conclusion' ? new Date() : undefined,
      total_duration: this.session.current_state === 'conclusion' 
        ? Date.now() - this.session.start_time.getTime()
        : undefined
    };
  }

  // Private helper methods

  private initializeCompletionCriteria(): CompletionCriteria {
    return {
      conceptual_questions_completed: false,
      practical_tasks_completed: false,
      minimum_score_achieved: false,
      time_limit_respected: true
    };
  }

  private initializeStateCallbacks(): void {
    // Initialize empty callback arrays for each state
    const states: ExcelInterviewState[] = [
      'introduction',
      'conceptual_questions',
      'practical_tasks',
      'feedback_generation',
      'conclusion'
    ];

    states.forEach(state => {
      this.stateTransitionCallbacks.set(state, []);
    });
  }

  private getValidTransitions(from_state: ExcelInterviewState): ExcelInterviewState[] {
    const transitions: Record<ExcelInterviewState, ExcelInterviewState[]> = {
      'introduction': ['conceptual_questions'],
      'conceptual_questions': ['practical_tasks'],
      'practical_tasks': ['feedback_generation'],
      'feedback_generation': ['conclusion'],
      'conclusion': [] // Terminal state
    };

    return transitions[from_state] || [];
  }

  private updateStateData(new_state: ExcelInterviewState, data?: any): void {
    switch (new_state) {
      case 'conceptual_questions':
        this.session.state_data.current_question_index = 0;
        this.session.state_data.questions_completed = 0;
        break;
      case 'practical_tasks':
        this.session.state_data.current_task_index = 0;
        this.session.state_data.tasks_completed = 0;
        break;
      case 'feedback_generation':
        // Mark assessment phase as complete
        break;
      case 'conclusion':
        this.session.end_time = new Date();
        this.session.total_duration = Date.now() - this.session.start_time.getTime();
        break;
    }

    if (data) {
      this.session.state_data = { ...this.session.state_data, ...data };
    }
  }

  private async executeStateCallbacks(state: ExcelInterviewState): Promise<void> {
    const callbacks = this.stateTransitionCallbacks.get(state) || [];
    for (const callback of callbacks) {
      try {
        await callback();
      } catch (error) {
        console.error(`Error executing callback for state ${state}:`, error);
      }
    }
  }

  private isIntroductionComplete(): boolean {
    // Introduction is complete after a minimum time or explicit confirmation
    const minIntroTime = 30 * 1000; // 30 seconds
    const elapsedTime = Date.now() - this.session.start_time.getTime();
    return elapsedTime >= minIntroTime;
  }

  private isConceptualQuestionsComplete(): boolean {
    const completed = this.session.state_data.questions_completed || 0;
    const total = this.session.state_data.total_questions || 0;
    return completed >= total && total > 0;
  }

  private isPracticalTasksComplete(): boolean {
    const completed = this.session.state_data.tasks_completed || 0;
    const total = this.session.state_data.total_tasks || 0;
    return completed >= total && total > 0;
  }

  private isFeedbackGenerationComplete(): boolean {
    // Feedback generation is complete when analysis is done
    // This would typically be triggered by the evaluation system
    return this.session.state_data.feedback_generated === true;
  }

  private updateCompletionCriteria(): void {
    this.completionCriteria.conceptual_questions_completed = this.isConceptualQuestionsComplete();
    this.completionCriteria.practical_tasks_completed = this.isPracticalTasksComplete();
    
    // Update minimum score achievement
    const conceptualScore = this.session.conceptual_progress?.total_score || 0;
    const practicalScore = this.session.practical_progress?.total_accuracy_score || 0;
    const averageScore = (conceptualScore + practicalScore) / 2;
    this.completionCriteria.minimum_score_achieved = averageScore >= 60; // 60% minimum

    // Check time limits
    const totalTime = Date.now() - this.session.start_time.getTime();
    const maxTime = 90 * 60 * 1000; // 90 minutes max
    this.completionCriteria.time_limit_respected = totalTime <= maxTime;
  }
}

/**
 * Factory function to create state manager instances
 */
export function createExcelInterviewStateManager(
  responseId: number,
  totalQuestions: number = 5,
  totalTasks: number = 3
): ExcelInterviewStateManagerImpl {
  const session: ExcelInterviewSession = {
    id: 0, // Will be set by database
    response_id: responseId,
    current_state: 'introduction',
    state_data: {
      current_question_index: 0,
      current_task_index: 0,
      questions_completed: 0,
      tasks_completed: 0,
      total_questions: totalQuestions,
      total_tasks: totalTasks
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
    state_history: []
  };

  return new ExcelInterviewStateManagerImpl(session);
}

/**
 * State validation utilities
 */
export const StateValidationUtils = {
  /**
   * Validate state transition rules
   */
  validateTransition(from: ExcelInterviewState, to: ExcelInterviewState): boolean {
    const validTransitions: Record<ExcelInterviewState, ExcelInterviewState[]> = {
      'introduction': ['conceptual_questions'],
      'conceptual_questions': ['practical_tasks'],
      'practical_tasks': ['feedback_generation'],
      'feedback_generation': ['conclusion'],
      'conclusion': []
    };

    return validTransitions[from]?.includes(to) || false;
  },

  /**
   * Get state display information
   */
  getStateInfo(state: ExcelInterviewState): {
    name: string;
    description: string;
    icon: string;
    color: string;
  } {
    const stateInfo: Record<ExcelInterviewState, any> = {
      'introduction': {
        name: 'Introduction',
        description: 'AI agent introduces the interview process',
        icon: '👋',
        color: '#3B82F6'
      },
      'conceptual_questions': {
        name: 'Conceptual Questions',
        description: 'Voice-based Excel knowledge assessment',
        icon: '❓',
        color: '#8B5CF6'
      },
      'practical_tasks': {
        name: 'Practical Tasks',
        description: 'Hands-on spreadsheet exercises',
        icon: '📊',
        color: '#10B981'
      },
      'feedback_generation': {
        name: 'Feedback Generation',
        description: 'AI analyzes performance and generates insights',
        icon: '🔄',
        color: '#F59E0B'
      },
      'conclusion': {
        name: 'Conclusion',
        description: 'Final feedback and next steps',
        icon: '✅',
        color: '#EF4444'
      }
    };

    return stateInfo[state];
  },

  /**
   * Calculate state completion percentage
   */
  calculateStateCompletion(
    state: ExcelInterviewState,
    stateData: StateData,
    conceptualProgress: ConceptualProgress,
    practicalProgress: PracticalProgress
  ): number {
    switch (state) {
      case 'introduction':
        return 100; // Introduction is binary - complete or not
      case 'conceptual_questions':
        const totalQuestions = stateData.total_questions || 1;
        const answeredQuestions = conceptualProgress.questions_answered || 0;
        return Math.round((answeredQuestions / totalQuestions) * 100);
      case 'practical_tasks':
        const totalTasks = stateData.total_tasks || 1;
        const completedTasks = practicalProgress.tasks_completed || 0;
        return Math.round((completedTasks / totalTasks) * 100);
      case 'feedback_generation':
        return stateData.feedback_generated ? 100 : 0;
      case 'conclusion':
        return 100;
      default:
        return 0;
    }
  }
};

export default ExcelInterviewStateManagerImpl;