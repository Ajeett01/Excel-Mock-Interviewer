import { ExcelSkillConfig, ExcelSkillLevel, ExcelInterviewConfig, TimeAllocation } from '@/types/excel';
import { ExcelSkillConfigService, ExcelSkillLevelUtils } from '@/services/excel-skill-config.service';

/**
 * Central configuration manager for Excel interviews
 */
export class ExcelConfigManager {
  private static instance: ExcelConfigManager;
  private configCache: Map<ExcelSkillLevel, ExcelSkillConfig> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastCacheUpdate: number = 0;

  private constructor() {}

  static getInstance(): ExcelConfigManager {
    if (!ExcelConfigManager.instance) {
      ExcelConfigManager.instance = new ExcelConfigManager();
    }
    return ExcelConfigManager.instance;
  }

  /**
   * Get configuration for a skill level with caching
   */
  async getSkillConfig(level: ExcelSkillLevel): Promise<ExcelSkillConfig | null> {
    // Check cache first
    if (this.isCacheValid() && this.configCache.has(level)) {
      return this.configCache.get(level) || null;
    }

    // Fetch from database
    const config = await ExcelSkillConfigService.getConfigByLevel(level);
    if (config) {
      this.configCache.set(level, config);
      this.lastCacheUpdate = Date.now();
    }

    return config;
  }

  /**
   * Get all skill configurations with caching
   */
  async getAllSkillConfigs(): Promise<ExcelSkillConfig[]> {
    if (this.isCacheValid() && this.configCache.size > 0) {
      return Array.from(this.configCache.values());
    }

    const configs = await ExcelSkillConfigService.getAllConfigs();
    this.configCache.clear();
    configs.forEach(config => {
      this.configCache.set(config.skill_level, config);
    });
    this.lastCacheUpdate = Date.now();

    return configs;
  }

  /**
   * Create interview configuration based on skill level and requirements
   */
  async createInterviewConfig(
    skillLevel: ExcelSkillLevel,
    customOptions?: Partial<ExcelInterviewConfig>
  ): Promise<ExcelInterviewConfig> {
    const skillConfig = await this.getSkillConfig(skillLevel);
    
    if (!skillConfig) {
      throw new Error(`Configuration not found for skill level: ${skillLevel}`);
    }

    const defaultConfig: ExcelInterviewConfig = {
      skill_level: skillLevel,
      conceptual_question_count: this.getDefaultQuestionCount(skillLevel),
      practical_task_count: this.getDefaultTaskCount(skillLevel),
      time_allocation: skillConfig.time_allocation,
      difficulty_progression: true,
      adaptive_questioning: true,
      business_scenarios: this.getDefaultBusinessScenarios(skillLevel),
      industry_context: undefined
    };

    return {
      ...defaultConfig,
      ...customOptions
    };
  }

  /**
   * Validate interview configuration
   */
  validateInterviewConfig(config: ExcelInterviewConfig): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate question counts
    if (config.conceptual_question_count < 1) {
      errors.push('Conceptual question count must be at least 1');
    }
    if (config.conceptual_question_count > 20) {
      warnings.push('High conceptual question count may lead to long interviews');
    }

    if (config.practical_task_count < 1) {
      errors.push('Practical task count must be at least 1');
    }
    if (config.practical_task_count > 5) {
      warnings.push('High practical task count may lead to very long interviews');
    }

    // Validate time allocation
    const totalTime = config.time_allocation.total;
    if (totalTime < 15) {
      warnings.push('Interview duration may be too short for meaningful assessment');
    }
    if (totalTime > 90) {
      warnings.push('Interview duration may be too long for candidate engagement');
    }

    // Validate skill level consistency
    const recommendedQuestions = this.getDefaultQuestionCount(config.skill_level);
    if (Math.abs(config.conceptual_question_count - recommendedQuestions) > 5) {
      warnings.push(`Question count differs significantly from recommended ${recommendedQuestions} for ${config.skill_level} level`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Get recommended configuration based on job requirements
   */
  async getRecommendedConfig(jobRequirements: {
    role: string;
    industry?: string;
    requiredFunctions?: string[];
    experienceLevel?: 'entry' | 'mid' | 'senior';
    timeConstraints?: number; // in minutes
  }): Promise<ExcelInterviewConfig> {
    // Determine skill level based on job requirements
    let skillLevel: ExcelSkillLevel = 'basic';
    
    if (jobRequirements.experienceLevel === 'senior' || 
        (jobRequirements.requiredFunctions && jobRequirements.requiredFunctions.length > 10)) {
      skillLevel = 'advanced';
    } else if (jobRequirements.experienceLevel === 'mid' || 
               (jobRequirements.requiredFunctions && jobRequirements.requiredFunctions.length > 5)) {
      skillLevel = 'intermediate';
    }

    // Adjust for specific roles
    const analyticalRoles = ['analyst', 'data', 'financial', 'business intelligence'];
    if (analyticalRoles.some(role => jobRequirements.role.toLowerCase().includes(role))) {
      skillLevel = skillLevel === 'basic' ? 'intermediate' : 'advanced';
    }

    const config = await this.createInterviewConfig(skillLevel, {
      industry_context: jobRequirements.industry,
      business_scenarios: this.getIndustrySpecificScenarios(jobRequirements.industry || 'general')
    });

    // Adjust time allocation if constraints exist
    if (jobRequirements.timeConstraints) {
      const ratio = jobRequirements.timeConstraints / config.time_allocation.total;
      config.time_allocation = {
        conceptual: Math.round(config.time_allocation.conceptual * ratio),
        practical: Math.round(config.time_allocation.practical * ratio),
        total: jobRequirements.timeConstraints
      };
    }

    return config;
  }

  /**
   * Update skill configuration
   */
  async updateSkillConfig(level: ExcelSkillLevel, updates: Partial<ExcelSkillConfig>): Promise<boolean> {
    const currentConfig = await this.getSkillConfig(level);
    if (!currentConfig) {
      return false;
    }

    const updatedConfig = await ExcelSkillConfigService.updateConfig(currentConfig.id, updates);
    if (updatedConfig) {
      this.configCache.set(level, updatedConfig);
      return true;
    }

    return false;
  }

  /**
   * Clear configuration cache
   */
  clearCache(): void {
    this.configCache.clear();
    this.lastCacheUpdate = 0;
  }

  /**
   * Get configuration statistics
   */
  async getConfigStats(): Promise<{
    totalConfigs: number;
    configsByLevel: Record<ExcelSkillLevel, boolean>;
    averageTimeAllocation: TimeAllocation;
    totalFunctions: number;
  }> {
    const configs = await this.getAllSkillConfigs();
    
    const configsByLevel: Record<ExcelSkillLevel, boolean> = {
      basic: false,
      intermediate: false,
      advanced: false
    };

    let totalConceptualTime = 0;
    let totalPracticalTime = 0;
    let totalTime = 0;
    let totalFunctions = 0;

    configs.forEach(config => {
      configsByLevel[config.skill_level] = true;
      totalConceptualTime += config.time_allocation.conceptual;
      totalPracticalTime += config.time_allocation.practical;
      totalTime += config.time_allocation.total;
      totalFunctions += config.function_requirements.length;
    });

    const count = configs.length || 1;

    return {
      totalConfigs: configs.length,
      configsByLevel,
      averageTimeAllocation: {
        conceptual: Math.round(totalConceptualTime / count),
        practical: Math.round(totalPracticalTime / count),
        total: Math.round(totalTime / count)
      },
      totalFunctions
    };
  }

  // Private helper methods

  private isCacheValid(): boolean {
    return Date.now() - this.lastCacheUpdate < this.cacheExpiry;
  }

  private getDefaultQuestionCount(level: ExcelSkillLevel): number {
    const counts: Record<ExcelSkillLevel, number> = {
      basic: 5,
      intermediate: 7,
      advanced: 10
    };
    return counts[level];
  }

  private getDefaultTaskCount(level: ExcelSkillLevel): number {
    const counts: Record<ExcelSkillLevel, number> = {
      basic: 2,
      intermediate: 3,
      advanced: 4
    };
    return counts[level];
  }

  private getDefaultBusinessScenarios(level: ExcelSkillLevel): string[] {
    const scenarios: Record<ExcelSkillLevel, string[]> = {
      basic: [
        'Sales data analysis',
        'Budget tracking',
        'Inventory management',
        'Employee timesheet calculation'
      ],
      intermediate: [
        'Financial reporting',
        'Customer segmentation analysis',
        'Performance dashboard creation',
        'Cost-benefit analysis',
        'Trend analysis and forecasting'
      ],
      advanced: [
        'Complex financial modeling',
        'Advanced data analysis and visualization',
        'Automated reporting systems',
        'Risk assessment modeling',
        'Strategic planning scenarios'
      ]
    };
    return scenarios[level];
  }

  private getIndustrySpecificScenarios(industry: string): string[] {
    const industryScenarios: Record<string, string[]> = {
      finance: [
        'Portfolio analysis',
        'Risk assessment',
        'Financial statement analysis',
        'Investment calculations'
      ],
      retail: [
        'Sales performance analysis',
        'Inventory optimization',
        'Customer analytics',
        'Seasonal trend analysis'
      ],
      healthcare: [
        'Patient data analysis',
        'Resource allocation',
        'Cost analysis',
        'Performance metrics'
      ],
      manufacturing: [
        'Production planning',
        'Quality control analysis',
        'Supply chain optimization',
        'Cost analysis'
      ],
      general: [
        'Data analysis',
        'Reporting',
        'Budget planning',
        'Performance tracking'
      ]
    };

    return industryScenarios[industry.toLowerCase()] || industryScenarios.general;
  }
}

// Export singleton instance
export const excelConfigManager = ExcelConfigManager.getInstance();

// Export utility functions
export const ExcelConfigUtils = {
  /**
   * Get skill level progression path
   */
  getProgressionPath(currentLevel: ExcelSkillLevel): ExcelSkillLevel[] {
    const allLevels = ExcelSkillLevelUtils.getAllLevels();
    const currentIndex = allLevels.indexOf(currentLevel);
    return allLevels.slice(currentIndex);
  },

  /**
   * Calculate interview difficulty score
   */
  calculateDifficultyScore(config: ExcelInterviewConfig): number {
    const levelScores: Record<ExcelSkillLevel, number> = {
      basic: 1,
      intermediate: 2,
      advanced: 3
    };

    let score = levelScores[config.skill_level] * 10;
    score += config.conceptual_question_count * 2;
    score += config.practical_task_count * 5;
    
    if (config.difficulty_progression) score += 5;
    if (config.adaptive_questioning) score += 3;

    return Math.min(100, score);
  },

  /**
   * Estimate interview completion time
   */
  estimateCompletionTime(config: ExcelInterviewConfig): {
    minimum: number;
    expected: number;
    maximum: number;
  } {
    const baseTime = config.time_allocation.total;
    
    return {
      minimum: Math.round(baseTime * 0.7),
      expected: baseTime,
      maximum: Math.round(baseTime * 1.3)
    };
  }
};

export default ExcelConfigManager;