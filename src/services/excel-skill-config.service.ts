import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { ExcelSkillConfig, ExcelSkillLevel, EvaluationCriteria, TimeAllocation } from "@/types/excel";

const supabase = createClientComponentClient();

/**
 * Service for managing Excel skill level configurations
 */
export class ExcelSkillConfigService {
  /**
   * Get all Excel skill configurations
   */
  static async getAllConfigs(): Promise<ExcelSkillConfig[]> {
    try {
      const { data, error } = await supabase
        .from("excel_skill_config")
        .select("*")
        .order("complexity_level", { ascending: true });

      if (error) {
        console.error("Error fetching Excel skill configs:", error);
        return [];
      }

      return data.map(this.mapDatabaseToConfig);
    } catch (error) {
      console.error("Error in getAllConfigs:", error);
      return [];
    }
  }

  /**
   * Get configuration for a specific skill level
   */
  static async getConfigByLevel(level: ExcelSkillLevel): Promise<ExcelSkillConfig | null> {
    try {
      const { data, error } = await supabase
        .from("excel_skill_config")
        .select("*")
        .eq("skill_level", level)
        .single();

      if (error) {
        console.error(`Error fetching config for level ${level}:`, error);
        return null;
      }

      return this.mapDatabaseToConfig(data);
    } catch (error) {
      console.error("Error in getConfigByLevel:", error);
      return null;
    }
  }

  /**
   * Create a new skill configuration
   */
  static async createConfig(config: Omit<ExcelSkillConfig, 'id' | 'created_at' | 'updated_at'>): Promise<ExcelSkillConfig | null> {
    try {
      const { data, error } = await supabase
        .from("excel_skill_config")
        .insert({
          skill_level: config.skill_level,
          conceptual_topics: config.conceptual_topics,
          practical_skills: config.practical_skills,
          evaluation_criteria: config.evaluation_criteria,
          function_requirements: config.function_requirements,
          complexity_level: config.complexity_level,
          time_allocation: config.time_allocation
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating Excel skill config:", error);
        return null;
      }

      return this.mapDatabaseToConfig(data);
    } catch (error) {
      console.error("Error in createConfig:", error);
      return null;
    }
  }

  /**
   * Update an existing skill configuration
   */
  static async updateConfig(id: number, updates: Partial<ExcelSkillConfig>): Promise<ExcelSkillConfig | null> {
    try {
      const { data, error } = await supabase
        .from("excel_skill_config")
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating Excel skill config:", error);
        return null;
      }

      return this.mapDatabaseToConfig(data);
    } catch (error) {
      console.error("Error in updateConfig:", error);
      return null;
    }
  }

  /**
   * Delete a skill configuration
   */
  static async deleteConfig(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("excel_skill_config")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error deleting Excel skill config:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in deleteConfig:", error);
      return false;
    }
  }

  /**
   * Get recommended skill level based on user performance
   */
  static async getRecommendedLevel(
    currentLevel: ExcelSkillLevel,
    performanceScore: number,
    functionsUsed: string[]
  ): Promise<ExcelSkillLevel> {
    try {
      const configs = await this.getAllConfigs();
      const currentConfig = configs.find(c => c.skill_level === currentLevel);
      
      if (!currentConfig) return currentLevel;

      // If performance is excellent (>85%) and user demonstrated advanced functions
      if (performanceScore > 85) {
        const advancedFunctions = functionsUsed.filter(func => 
          ['VLOOKUP', 'INDEX', 'MATCH', 'INDIRECT', 'OFFSET', 'SUMPRODUCT'].includes(func)
        );

        if (currentLevel === 'basic' && advancedFunctions.length > 0) {
          return 'intermediate';
        }
        if (currentLevel === 'intermediate' && advancedFunctions.length > 2) {
          return 'advanced';
        }
      }

      // If performance is poor (<60%), recommend staying at current level or going down
      if (performanceScore < 60) {
        if (currentLevel === 'advanced') return 'intermediate';
        if (currentLevel === 'intermediate') return 'basic';
      }

      return currentLevel;
    } catch (error) {
      console.error("Error in getRecommendedLevel:", error);
      return currentLevel;
    }
  }

  /**
   * Get functions required for a specific skill level
   */
  static async getRequiredFunctions(level: ExcelSkillLevel): Promise<string[]> {
    const config = await this.getConfigByLevel(level);
    return config?.function_requirements || [];
  }

  /**
   * Get evaluation criteria for a specific skill level
   */
  static async getEvaluationCriteria(level: ExcelSkillLevel): Promise<EvaluationCriteria | null> {
    const config = await this.getConfigByLevel(level);
    return config?.evaluation_criteria || null;
  }

  /**
   * Get time allocation for a specific skill level
   */
  static async getTimeAllocation(level: ExcelSkillLevel): Promise<TimeAllocation | null> {
    const config = await this.getConfigByLevel(level);
    return config?.time_allocation || null;
  }

  /**
   * Check if user meets requirements for a skill level
   */
  static async checkSkillLevelRequirements(
    level: ExcelSkillLevel,
    userFunctions: string[],
    performanceScore: number
  ): Promise<{
    meets: boolean;
    missingFunctions: string[];
    scoreRequirement: number;
    actualScore: number;
  }> {
    try {
      const config = await this.getConfigByLevel(level);
      if (!config) {
        return {
          meets: false,
          missingFunctions: [],
          scoreRequirement: 0,
          actualScore: performanceScore
        };
      }

      const requiredFunctions = config.function_requirements;
      const missingFunctions = requiredFunctions.filter(func => !userFunctions.includes(func));
      const scoreRequirement = config.evaluation_criteria.formula_accuracy;
      const meets = missingFunctions.length === 0 && performanceScore >= scoreRequirement;

      return {
        meets,
        missingFunctions,
        scoreRequirement,
        actualScore: performanceScore
      };
    } catch (error) {
      console.error("Error in checkSkillLevelRequirements:", error);
      return {
        meets: false,
        missingFunctions: [],
        scoreRequirement: 0,
        actualScore: performanceScore
      };
    }
  }

  /**
   * Map database row to ExcelSkillConfig interface
   */
  private static mapDatabaseToConfig(data: any): ExcelSkillConfig {
    return {
      id: data.id,
      skill_level: data.skill_level,
      conceptual_topics: data.conceptual_topics || [],
      practical_skills: data.practical_skills || [],
      evaluation_criteria: data.evaluation_criteria || {
        formula_accuracy: 70,
        efficiency: 60,
        best_practices: 50
      },
      function_requirements: data.function_requirements || [],
      complexity_level: data.complexity_level || 1,
      time_allocation: data.time_allocation || {
        conceptual: 10,
        practical: 15,
        total: 25
      },
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at)
    };
  }
}

/**
 * Utility class for Excel skill level operations
 */
export class ExcelSkillLevelUtils {
  /**
   * Get all available skill levels in order
   */
  static getAllLevels(): ExcelSkillLevel[] {
    return ['basic', 'intermediate', 'advanced'];
  }

  /**
   * Get the next skill level
   */
  static getNextLevel(currentLevel: ExcelSkillLevel): ExcelSkillLevel | null {
    const levels = this.getAllLevels();
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
  }

  /**
   * Get the previous skill level
   */
  static getPreviousLevel(currentLevel: ExcelSkillLevel): ExcelSkillLevel | null {
    const levels = this.getAllLevels();
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex > 0 ? levels[currentIndex - 1] : null;
  }

  /**
   * Compare two skill levels
   */
  static compareSkillLevels(level1: ExcelSkillLevel, level2: ExcelSkillLevel): number {
    const levels = this.getAllLevels();
    const index1 = levels.indexOf(level1);
    const index2 = levels.indexOf(level2);
    return index1 - index2;
  }

  /**
   * Check if a skill level is higher than another
   */
  static isHigherLevel(level1: ExcelSkillLevel, level2: ExcelSkillLevel): boolean {
    return this.compareSkillLevels(level1, level2) > 0;
  }

  /**
   * Get skill level display name
   */
  static getDisplayName(level: ExcelSkillLevel): string {
    const displayNames: Record<ExcelSkillLevel, string> = {
      'basic': 'Basic',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return displayNames[level];
  }

  /**
   * Get skill level description
   */
  static getDescription(level: ExcelSkillLevel): string {
    const descriptions: Record<ExcelSkillLevel, string> = {
      'basic': 'Fundamental Excel skills including basic formulas, formatting, and simple charts',
      'intermediate': 'Advanced formulas, data analysis, pivot tables, and complex functions',
      'advanced': 'Expert-level skills including macros, VBA, advanced analytics, and automation'
    };
    return descriptions[level];
  }

  /**
   * Get recommended functions for a skill level
   */
  static getRecommendedFunctions(level: ExcelSkillLevel): string[] {
    const functions: Record<ExcelSkillLevel, string[]> = {
      'basic': ['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'IF'],
      'intermediate': ['VLOOKUP', 'HLOOKUP', 'SUMIF', 'COUNTIF', 'CONCATENATE', 'LEFT', 'RIGHT', 'MID'],
      'advanced': ['INDEX', 'MATCH', 'INDIRECT', 'OFFSET', 'SUMPRODUCT', 'ARRAY_FORMULAS']
    };
    return functions[level] || [];
  }

  /**
   * Get complexity score for a skill level
   */
  static getComplexityScore(level: ExcelSkillLevel): number {
    const scores: Record<ExcelSkillLevel, number> = {
      'basic': 1,
      'intermediate': 2,
      'advanced': 3
    };
    return scores[level];
  }

  /**
   * Determine skill level from performance metrics
   */
  static determineSkillLevel(
    functionsUsed: string[],
    accuracyScore: number,
    complexityScore: number
  ): ExcelSkillLevel {
    const basicFunctions = this.getRecommendedFunctions('basic');
    const intermediateFunctions = this.getRecommendedFunctions('intermediate');
    const advancedFunctions = this.getRecommendedFunctions('advanced');

    const hasBasicFunctions = basicFunctions.some(func => functionsUsed.includes(func));
    const hasIntermediateFunctions = intermediateFunctions.some(func => functionsUsed.includes(func));
    const hasAdvancedFunctions = advancedFunctions.some(func => functionsUsed.includes(func));

    // Advanced level: high accuracy + advanced functions + high complexity
    if (hasAdvancedFunctions && accuracyScore >= 80 && complexityScore >= 3) {
      return 'advanced';
    }

    // Intermediate level: good accuracy + intermediate functions
    if (hasIntermediateFunctions && accuracyScore >= 70 && complexityScore >= 2) {
      return 'intermediate';
    }

    // Basic level: basic functions or low performance
    return 'basic';
  }
}

export default ExcelSkillConfigService;