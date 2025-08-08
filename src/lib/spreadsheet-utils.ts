import { SpreadsheetData, UserAction, ActionType, SpreadsheetResult, TaskEvaluationCriteria } from '@/types/excel';

/**
 * Utility functions for spreadsheet operations and evaluation
 */

// Formula parsing and validation
export class FormulaParser {
  static parseFormula(formula: string): {
    functions: string[];
    references: string[];
    isValid: boolean;
    complexity: number;
  } {
    if (!formula || !formula.startsWith('=')) {
      return { functions: [], references: [], isValid: false, complexity: 0 };
    }

    const functions: string[] = [];
    const references: string[] = [];
    let complexity = 0;

    // Extract functions (e.g., SUM, VLOOKUP, IF)
    const functionRegex = /([A-Z][A-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = functionRegex.exec(formula)) !== null) {
      functions.push(match[1]);
      complexity += this.getFunctionComplexity(match[1]);
    }

    // Extract cell references (e.g., A1, B2:C5)
    const referenceRegex = /([A-Z]+[0-9]+(?::[A-Z]+[0-9]+)?)/g;
    while ((match = referenceRegex.exec(formula)) !== null) {
      references.push(match[1]);
    }

    // Basic validation
    const isValid = this.validateFormula(formula);

    return { functions, references, isValid, complexity };
  }

  private static getFunctionComplexity(functionName: string): number {
    const complexityMap: { [key: string]: number } = {
      'SUM': 1,
      'AVERAGE': 1,
      'COUNT': 1,
      'MAX': 1,
      'MIN': 1,
      'IF': 2,
      'SUMIF': 2,
      'COUNTIF': 2,
      'VLOOKUP': 3,
      'HLOOKUP': 3,
      'INDEX': 3,
      'MATCH': 3,
      'INDIRECT': 4,
      'OFFSET': 4,
      'SUMPRODUCT': 4,
      'ARRAY': 5
    };
    return complexityMap[functionName] || 2;
  }

  private static validateFormula(formula: string): boolean {
    try {
      // Basic validation - check for balanced parentheses
      let openParens = 0;
      for (const char of formula) {
        if (char === '(') openParens++;
        if (char === ')') openParens--;
        if (openParens < 0) return false;
      }
      return openParens === 0;
    } catch {
      return false;
    }
  }
}

// Spreadsheet data comparison and analysis
export class SpreadsheetAnalyzer {
  static compareSpreadsheets(
    initial: SpreadsheetData,
    final: SpreadsheetData,
    expected?: SpreadsheetData
  ): {
    changedCells: Array<{
      cell: string;
      oldValue: any;
      newValue: any;
      formula?: string;
    }>;
    addedFormulas: string[];
    accuracy: number;
    efficiency: number;
  } {
    const changedCells: Array<{
      cell: string;
      oldValue: any;
      newValue: any;
      formula?: string;
    }> = [];
    const addedFormulas: string[] = [];

    // Compare each sheet
    for (let sheetIndex = 0; sheetIndex < Math.max(initial.sheets.length, final.sheets.length); sheetIndex++) {
      const initialSheet = initial.sheets[sheetIndex];
      const finalSheet = final.sheets[sheetIndex];

      if (!initialSheet || !finalSheet) continue;

      // Compare cell data
      const maxRows = Math.max(initialSheet.data.length, finalSheet.data.length);
      const maxCols = Math.max(
        initialSheet.data[0]?.length || 0,
        finalSheet.data[0]?.length || 0
      );

      for (let r = 0; r < maxRows; r++) {
        for (let c = 0; c < maxCols; c++) {
          const initialCell = initialSheet.data[r]?.[c];
          const finalCell = finalSheet.data[r]?.[c];

          if (JSON.stringify(initialCell) !== JSON.stringify(finalCell)) {
            const cellRef = this.getCellReference(r, c);
            changedCells.push({
              cell: cellRef,
              oldValue: initialCell?.v,
              newValue: finalCell?.v,
              formula: finalCell?.f
            });

            if (finalCell?.f) {
              addedFormulas.push(finalCell.f);
            }
          }
        }
      }
    }

    // Calculate accuracy and efficiency
    let accuracy = 0;
    let efficiency = 0;

    if (expected) {
      accuracy = this.calculateAccuracy(final, expected);
      efficiency = this.calculateEfficiency(changedCells, addedFormulas);
    }

    return { changedCells, addedFormulas, accuracy, efficiency };
  }

  private static getCellReference(row: number, col: number): string {
    let colRef = '';
    let colNum = col;
    while (colNum >= 0) {
      colRef = String.fromCharCode(65 + (colNum % 26)) + colRef;
      colNum = Math.floor(colNum / 26) - 1;
    }
    return `${colRef}${row + 1}`;
  }

  private static calculateAccuracy(actual: SpreadsheetData, expected: SpreadsheetData): number {
    let totalCells = 0;
    let correctCells = 0;

    for (let sheetIndex = 0; sheetIndex < expected.sheets.length; sheetIndex++) {
      const expectedSheet = expected.sheets[sheetIndex];
      const actualSheet = actual.sheets[sheetIndex];

      if (!actualSheet) continue;

      for (let r = 0; r < expectedSheet.data.length; r++) {
        for (let c = 0; c < expectedSheet.data[r].length; c++) {
          const expectedCell = expectedSheet.data[r][c];
          if (expectedCell && expectedCell.v !== undefined) {
            totalCells++;
            const actualCell = actualSheet.data[r]?.[c];
            if (actualCell && actualCell.v === expectedCell.v) {
              correctCells++;
            }
          }
        }
      }
    }

    return totalCells > 0 ? (correctCells / totalCells) * 100 : 0;
  }

  private static calculateEfficiency(changedCells: any[], formulas: string[]): number {
    // Simple efficiency calculation based on number of operations
    const baseScore = 100;
    const penaltyPerExtraOperation = 2;
    const bonusForOptimalFormulas = 10;

    let score = baseScore;
    
    // Penalize excessive operations
    if (changedCells.length > 10) {
      score -= (changedCells.length - 10) * penaltyPerExtraOperation;
    }

    // Bonus for using efficient formulas
    const efficientFunctions = ['SUMPRODUCT', 'INDEX', 'MATCH', 'VLOOKUP'];
    const usedEfficientFunctions = formulas.some(formula => 
      efficientFunctions.some(func => formula.includes(func))
    );
    
    if (usedEfficientFunctions) {
      score += bonusForOptimalFormulas;
    }

    return Math.max(0, Math.min(100, score));
  }
}

// Action tracking and analysis
export class ActionTracker {
  private actions: UserAction[] = [];

  addAction(action: UserAction): void {
    this.actions.push(action);
  }

  getActions(): UserAction[] {
    return [...this.actions];
  }

  getActionsByType(type: ActionType): UserAction[] {
    return this.actions.filter(action => action.type === type);
  }

  getFormulasUsed(): string[] {
    return this.actions
      .filter(action => action.type === 'formula_input' && action.formula)
      .map(action => action.formula!)
      .filter((formula, index, arr) => arr.indexOf(formula) === index);
  }

  getFunctionsUsed(): string[] {
    const formulas = this.getFormulasUsed();
    const functions: string[] = [];
    
    formulas.forEach(formula => {
      const parsed = FormulaParser.parseFormula(formula);
      functions.push(...parsed.functions);
    });

    return Array.from(new Set(functions));
  }

  getTimeSpent(): number {
    if (this.actions.length === 0) return 0;
    const firstAction = this.actions[0];
    const lastAction = this.actions[this.actions.length - 1];
    return lastAction.timestamp - firstAction.timestamp;
  }

  getEfficiencyMetrics(): {
    totalActions: number;
    formulaActions: number;
    editActions: number;
    averageTimeBetweenActions: number;
  } {
    const totalActions = this.actions.length;
    const formulaActions = this.getActionsByType('formula_input').length;
    const editActions = this.getActionsByType('cell_edit').length;
    
    let averageTimeBetweenActions = 0;
    if (this.actions.length > 1) {
      const totalTime = this.getTimeSpent();
      averageTimeBetweenActions = totalTime / (this.actions.length - 1);
    }

    return {
      totalActions,
      formulaActions,
      editActions,
      averageTimeBetweenActions
    };
  }

  clear(): void {
    this.actions = [];
  }
}

// Task evaluation utilities
export class TaskEvaluator {
  static evaluateTask(
    taskId: string,
    initialState: SpreadsheetData,
    finalState: SpreadsheetData,
    expectedSolution: SpreadsheetData,
    userActions: UserAction[],
    criteria: TaskEvaluationCriteria
  ): SpreadsheetResult {
    const analysis = SpreadsheetAnalyzer.compareSpreadsheets(initialState, finalState, expectedSolution);
    const tracker = new ActionTracker();
    userActions.forEach(action => tracker.addAction(action));

    // Calculate scores
    const accuracyScore = analysis.accuracy;
    const efficiencyScore = analysis.efficiency;
    const bestPracticesScore = this.calculateBestPracticesScore(tracker, criteria);

    // Generate feedback
    const feedback = this.generateTaskFeedback(analysis, tracker, criteria);

    return {
      id: 0, // Will be set by database
      response_id: 0, // Will be set by caller
      task_id: taskId,
      task_name: `Task ${taskId}`,
      initial_state: initialState,
      final_state: finalState,
      user_actions: userActions,
      formulas_used: tracker.getFormulasUsed(),
      functions_used: tracker.getFunctionsUsed(),
      completion_time: tracker.getTimeSpent(),
      accuracy_score: accuracyScore,
      efficiency_score: efficiencyScore,
      best_practices_score: bestPracticesScore,
      task_feedback: feedback,
      expected_solution: expectedSolution,
      created_at: new Date()
    };
  }

  private static calculateBestPracticesScore(
    tracker: ActionTracker,
    criteria: TaskEvaluationCriteria
  ): number {
    let score = 100;
    const functions = tracker.getFunctionsUsed();
    
    // Check if required functions were used
    const requiredFunctions = criteria.required_formulas || [];
    const missingRequired = requiredFunctions.filter(func => !functions.includes(func));
    score -= missingRequired.length * 20;

    // Bonus for using optional advanced functions
    const optionalFunctions = criteria.optional_formulas || [];
    const usedOptional = optionalFunctions.filter(func => functions.includes(func));
    score += usedOptional.length * 10;

    // Check for best practices
    const metrics = tracker.getEfficiencyMetrics();
    if (metrics.averageTimeBetweenActions < 1000) { // Less than 1 second between actions
      score -= 10; // Penalty for rushing
    }

    return Math.max(0, Math.min(100, score));
  }

  private static generateTaskFeedback(
    analysis: any,
    tracker: ActionTracker,
    criteria: TaskEvaluationCriteria
  ): string {
    const feedback: string[] = [];
    
    if (analysis.accuracy >= 90) {
      feedback.push("Excellent accuracy in your solution!");
    } else if (analysis.accuracy >= 70) {
      feedback.push("Good accuracy, but there's room for improvement.");
    } else {
      feedback.push("Your solution needs significant improvement in accuracy.");
    }

    const functions = tracker.getFunctionsUsed();
    const requiredFunctions = criteria.required_formulas || [];
    const missingFunctions = requiredFunctions.filter(func => !functions.includes(func));
    
    if (missingFunctions.length > 0) {
      feedback.push(`Consider using these functions: ${missingFunctions.join(', ')}`);
    }

    if (analysis.efficiency >= 80) {
      feedback.push("Your approach was efficient and well-structured.");
    } else {
      feedback.push("Try to find more efficient ways to solve similar problems.");
    }

    return feedback.join(' ');
  }
}

// Utility functions for cell references and ranges
export const CellUtils = {
  columnToLetter: (col: number): string => {
    let result = '';
    while (col >= 0) {
      result = String.fromCharCode(65 + (col % 26)) + result;
      col = Math.floor(col / 26) - 1;
    }
    return result;
  },

  letterToColumn: (letter: string): number => {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 64);
    }
    return result - 1;
  },

  getCellReference: (row: number, col: number): string => {
    return `${CellUtils.columnToLetter(col)}${row + 1}`;
  },

  parseCellReference: (ref: string): { row: number; col: number } | null => {
    const match = ref.match(/^([A-Z]+)(\d+)$/);
    if (!match) return null;
    
    return {
      row: parseInt(match[2]) - 1,
      col: CellUtils.letterToColumn(match[1])
    };
  },

  isValidRange: (range: string): boolean => {
    const rangePattern = /^[A-Z]+\d+:[A-Z]+\d+$/;
    return rangePattern.test(range);
  }
};

export default {
  FormulaParser,
  SpreadsheetAnalyzer,
  ActionTracker,
  TaskEvaluator,
  CellUtils
};