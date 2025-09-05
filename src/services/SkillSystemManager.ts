/**
 * SkillSystemManager - System-wide Skill Management
 * 
 * This file implements the system-wide recommendations for the skill system:
 * - Lazy Loading: Don't load all 500 skill templates at login
 * - Diff-based Sync: Sync only changed skills, not entire sets
 * - Shared Registry for Static Templates: SkillsDB holds one copy globally
 * - Debug & Monitoring Tools: Memory usage, AsyncStorage size, WebSocket traffic
 * 
 * This manager coordinates between SkillsDB and ClientsideSkillStorage
 * to provide an optimized, scalable skill system.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { skillsDB, SkillSummary, Skill } from './SkillsDB';
import { ClientsideSkillStorage, PlayerSkillState, SkillDisplayItem } from './ClientsideSkillStorage';

// System Configuration
export interface SkillSystemConfig {
  enableLazyLoading: boolean;
  enableDiffSync: boolean;
  enableDebugMode: boolean;
  maxTemplatesToLoadAtStartup: number;
  syncBatchSize: number;
  debugLogInterval: number; // milliseconds
  memoryWarningThreshold: number; // MB
}

// Performance Monitoring
export interface SystemPerformanceStats {
  memory: {
    totalSkills: number;
    loadedTemplates: number;
    loadedEngineData: number;
    estimatedMemoryMB: number;
    asyncStorageSizeKB: number;
  };
  performance: {
    averageLoadTime: number;
    cacheHitRate: number;
    syncOperations: number;
    lastSyncTime?: string;
  };
  network: {
    websocketConnected: boolean;
    pendingUpdates: number;
    batchUpdatesSent: number;
    diffUpdatesSent: number;
  };
}

// Lazy Loading State
export interface LazyLoadingState {
  isInitialized: boolean;
  templatesLoaded: number;
  totalTemplates: number;
  loadingProgress: number; // 0-100
  lastLoadTime?: string;
}

// Diff Sync State
export interface DiffSyncState {
  lastSyncTimestamp: string;
  pendingChanges: string[]; // skillIds with pending changes
  syncInProgress: boolean;
  lastSyncDuration?: number;
}

const DEFAULT_CONFIG: SkillSystemConfig = {
  enableLazyLoading: true,
  enableDiffSync: true,
  enableDebugMode: false,
  maxTemplatesToLoadAtStartup: 50, // Load only 50 templates at startup
  syncBatchSize: 20,
  debugLogInterval: 30000, // 30 seconds
  memoryWarningThreshold: 100, // 100MB
};

export class SkillSystemManager {
  private config: SkillSystemConfig;
  private performanceStats: SystemPerformanceStats;
  private lazyLoadingState: LazyLoadingState;
  private diffSyncState: DiffSyncState;
  private debugTimer?: NodeJS.Timeout;
  private isInitialized = false;

  constructor(config: Partial<SkillSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.performanceStats = this.initializePerformanceStats();
    this.lazyLoadingState = this.initializeLazyLoadingState();
    this.diffSyncState = this.initializeDiffSyncState();
  }

  // ===== INITIALIZATION =====

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🚀 Initializing Skill System Manager...');

      // Initialize SkillsDB
      await skillsDB.initialize();

      // Load initial templates (lazy loading)
      if (this.config.enableLazyLoading) {
        await this.loadInitialTemplates();
      } else {
        await this.loadAllTemplates();
      }

      // Start debug monitoring if enabled
      if (this.config.enableDebugMode) {
        this.startDebugMonitoring();
      }

      this.isInitialized = true;
      console.log('✅ Skill System Manager initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Skill System Manager:', error);
      throw error;
    }
  }

  // ===== LAZY LOADING IMPLEMENTATION =====

  /**
   * Load initial templates (lazy loading approach)
   * Only loads essential templates at startup
   */
  private async loadInitialTemplates(): Promise<void> {
    console.log('📚 Loading initial skill templates (lazy loading)...');
    
    try {
      // Load only the most common/essential templates
      const essentialCategories = ['combat', 'magic', 'utility'];
      let loadedCount = 0;

      for (const category of essentialCategories) {
        if (loadedCount >= this.config.maxTemplatesToLoadAtStartup) break;

        // Load templates for this category
        const templates = await this.loadTemplatesForCategory(category);
        loadedCount += templates.length;

        this.updateLazyLoadingProgress(loadedCount);
      }

      this.lazyLoadingState.isInitialized = true;
      this.lazyLoadingState.lastLoadTime = new Date().toISOString();
      
      console.log(`✅ Loaded ${loadedCount} initial templates`);
    } catch (error) {
      console.error('❌ Error loading initial templates:', error);
      throw error;
    }
  }

  /**
   * Load all templates (non-lazy approach)
   */
  private async loadAllTemplates(): Promise<void> {
    console.log('📚 Loading all skill templates...');
    
    try {
      // This would typically load from a server or database
      // For now, we'll simulate loading all templates
      const allTemplates = await this.loadTemplatesFromServer();
      
      for (const template of allTemplates) {
        await skillsDB.createSkill(template);
      }

      this.lazyLoadingState.isInitialized = true;
      this.lazyLoadingState.templatesLoaded = allTemplates.length;
      this.lazyLoadingState.totalTemplates = allTemplates.length;
      this.lazyLoadingState.loadingProgress = 100;
      
      console.log(`✅ Loaded ${allTemplates.length} templates`);
    } catch (error) {
      console.error('❌ Error loading all templates:', error);
      throw error;
    }
  }

  /**
   * Load templates for a specific category
   */
  private async loadTemplatesForCategory(category: string): Promise<SkillSummary[]> {
    // This would typically fetch from server
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Load templates from server (placeholder)
   */
  private async loadTemplatesFromServer(): Promise<Omit<SkillSummary, 'id' | 'createdAt' | 'updatedAt'>[]> {
    // This would typically make an API call to fetch templates
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Load template on demand (when player needs it)
   */
  async loadTemplateOnDemand(skillId: string): Promise<SkillSummary | null> {
    try {
      // Check if already loaded
      const existing = await skillsDB.getSkillSummary(skillId);
      if (existing) {
        return existing;
      }

      // Load from server
      const template = await this.fetchTemplateFromServer(skillId);
      if (template) {
        await skillsDB.createSkill(template);
        this.updatePerformanceStats();
        return template;
      }

      return null;
    } catch (error) {
      console.error('❌ Error loading template on demand:', error);
      return null;
    }
  }

  /**
   * Fetch template from server (placeholder)
   */
  private async fetchTemplateFromServer(skillId: string): Promise<Omit<SkillSummary, 'id' | 'createdAt' | 'updatedAt'> | null> {
    // This would typically make an API call
    // For now, return null as placeholder
    return null;
  }

  /**
   * Update lazy loading progress
   */
  private updateLazyLoadingProgress(loadedCount: number): void {
    this.lazyLoadingState.templatesLoaded = loadedCount;
    this.lazyLoadingState.loadingProgress = Math.min(
      (loadedCount / this.config.maxTemplatesToLoadAtStartup) * 100,
      100
    );
  }

  // ===== DIFF-BASED SYNC IMPLEMENTATION =====

  /**
   * Sync only changed skills (diff-based sync)
   */
  async syncPlayerSkills(playerUUID: string, changedSkillIds: string[]): Promise<void> {
    if (!this.config.enableDiffSync) {
      return this.syncAllPlayerSkills(playerUUID);
    }

    try {
      this.diffSyncState.syncInProgress = true;
      const startTime = Date.now();

      console.log(`🔄 Syncing ${changedSkillIds.length} changed skills for player ${playerUUID}`);

      // Sync only the changed skills
      for (const skillId of changedSkillIds) {
        await this.syncSingleSkill(playerUUID, skillId);
      }

      // Update sync state
      this.diffSyncState.lastSyncTimestamp = new Date().toISOString();
      this.diffSyncState.pendingChanges = this.diffSyncState.pendingChanges.filter(
        id => !changedSkillIds.includes(id)
      );
      this.diffSyncState.lastSyncDuration = Date.now() - startTime;

      this.performanceStats.network.diffUpdatesSent += changedSkillIds.length;
      this.performanceStats.performance.lastSyncTime = this.diffSyncState.lastSyncTimestamp;

      console.log(`✅ Synced ${changedSkillIds.length} skills in ${this.diffSyncState.lastSyncDuration}ms`);
    } catch (error) {
      console.error('❌ Error in diff sync:', error);
      throw error;
    } finally {
      this.diffSyncState.syncInProgress = false;
    }
  }

  /**
   * Sync all player skills (fallback)
   */
  async syncAllPlayerSkills(playerUUID: string): Promise<void> {
    try {
      console.log(`🔄 Syncing all skills for player ${playerUUID}`);
      
      // Get all player skills from SkillsDB
      const playerSkills = await skillsDB.getSkillsByOwner(playerUUID);
      
      // Convert to skill states for ClientsideSkillStorage
      const skillStates: PlayerSkillState[] = playerSkills.map(skill => ({
        skillId: skill.id,
        level: 1, // Default level
        experience: 0, // Default experience
        isActive: true,
        acquiredAt: skill.createdAt,
      }));

      // Store in ClientsideSkillStorage
      await ClientsideSkillStorage.storePlayerSkillStates(playerUUID, skillStates);
      
      this.performanceStats.network.batchUpdatesSent++;
      console.log(`✅ Synced ${playerSkills.length} skills for player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error syncing all player skills:', error);
      throw error;
    }
  }

  /**
   * Sync a single skill
   */
  private async syncSingleSkill(playerUUID: string, skillId: string): Promise<void> {
    try {
      // Get skill from SkillsDB
      const skill = await skillsDB.getSkill(skillId);
      if (!skill) {
        console.warn(`⚠️ Skill ${skillId} not found in SkillsDB`);
        return;
      }

      // Check if player owns this skill
      if (skill.summary.ownerId !== playerUUID) {
        console.warn(`⚠️ Player ${playerUUID} does not own skill ${skillId}`);
        return;
      }

      // Update or create skill state in ClientsideSkillStorage
      const existingStates = await ClientsideSkillStorage.getPlayerSkillStates(playerUUID);
      const existingState = existingStates.find(state => state.skillId === skillId);

      if (existingState) {
        // Update existing state
        await ClientsideSkillStorage.updateSkillState(playerUUID, skillId, {
          // Update any relevant fields from SkillsDB
          lastUsed: existingState.lastUsed,
        });
      } else {
        // Create new state
        const newState: PlayerSkillState = {
          skillId,
          level: 1,
          experience: 0,
          isActive: true,
          acquiredAt: skill.summary.createdAt,
        };
        await ClientsideSkillStorage.addSkillState(playerUUID, newState);
      }
    } catch (error) {
      console.error(`❌ Error syncing skill ${skillId}:`, error);
    }
  }

  /**
   * Mark skill as changed (for diff sync)
   */
  markSkillAsChanged(skillId: string): void {
    if (!this.diffSyncState.pendingChanges.includes(skillId)) {
      this.diffSyncState.pendingChanges.push(skillId);
    }
  }

  // ===== DEBUG & MONITORING TOOLS =====

  /**
   * Start debug monitoring
   */
  private startDebugMonitoring(): void {
    if (this.debugTimer) {
      clearInterval(this.debugTimer);
    }

    this.debugTimer = setInterval(() => {
      this.logDebugInfo();
    }, this.config.debugLogInterval);

    console.log('🔍 Debug monitoring started');
  }

  /**
   * Stop debug monitoring
   */
  stopDebugMonitoring(): void {
    if (this.debugTimer) {
      clearInterval(this.debugTimer);
      this.debugTimer = undefined;
    }
    console.log('🔍 Debug monitoring stopped');
  }

  /**
   * Log debug information
   */
  private logDebugInfo(): void {
    this.updatePerformanceStats();
    
    const stats = this.performanceStats;
    const lazyState = this.lazyLoadingState;
    const syncState = this.diffSyncState;

    console.log('📊 Skill System Debug Info:');
    console.log(`  Memory: ${stats.memory.estimatedMemoryMB}MB (${stats.memory.totalSkills} skills)`);
    console.log(`  Cache Hit Rate: ${(stats.performance.cacheHitRate * 100).toFixed(1)}%`);
    console.log(`  Lazy Loading: ${lazyState.templatesLoaded}/${lazyState.totalTemplates} (${lazyState.loadingProgress.toFixed(1)}%)`);
    console.log(`  Sync: ${syncState.pendingChanges.length} pending, last sync: ${syncState.lastSyncTimestamp}`);
    console.log(`  Network: WS ${stats.network.websocketConnected ? 'connected' : 'disconnected'}, ${stats.network.pendingUpdates} pending`);

    // Check for memory warnings
    if (stats.memory.estimatedMemoryMB > this.config.memoryWarningThreshold) {
      console.warn(`⚠️ Memory usage (${stats.memory.estimatedMemoryMB}MB) exceeds threshold (${this.config.memoryWarningThreshold}MB)`);
    }
  }

  /**
   * Update performance statistics
   */
  private updatePerformanceStats(): void {
    const cacheStats = skillsDB.getCacheStats();
    
    this.performanceStats.memory = {
      totalSkills: cacheStats.memoryUsage.totalSkills,
      loadedTemplates: cacheStats.summaryCache.size,
      loadedEngineData: cacheStats.engineCache.size,
      estimatedMemoryMB: cacheStats.memoryUsage.estimatedMemoryMB,
      asyncStorageSizeKB: 0, // Would need to calculate AsyncStorage size
    };

    this.performanceStats.performance = {
      averageLoadTime: 0, // Would need to track load times
      cacheHitRate: (cacheStats.summaryCache.hitRate + cacheStats.engineCache.hitRate) / 2,
      syncOperations: this.performanceStats.performance.syncOperations,
      lastSyncTime: this.performanceStats.performance.lastSyncTime,
    };
  }

  /**
   * Get comprehensive system status
   */
  getSystemStatus(): {
    performance: SystemPerformanceStats;
    lazyLoading: LazyLoadingState;
    diffSync: DiffSyncState;
    config: SkillSystemConfig;
  } {
    this.updatePerformanceStats();
    
    return {
      performance: this.performanceStats,
      lazyLoading: this.lazyLoadingState,
      diffSync: this.diffSyncState,
      config: this.config,
    };
  }

  /**
   * Enable debug mode
   */
  enableDebugMode(): void {
    this.config.enableDebugMode = true;
    skillsDB.enableDebug();
    this.startDebugMonitoring();
    console.log('🔍 Debug mode enabled');
  }

  /**
   * Disable debug mode
   */
  disableDebugMode(): void {
    this.config.enableDebugMode = false;
    skillsDB.disableDebug();
    this.stopDebugMonitoring();
    console.log('🔍 Debug mode disabled');
  }

  /**
   * Get AsyncStorage size (approximation)
   */
  async getAsyncStorageSize(): Promise<number> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      let totalSize = 0;

      for (const key of keys) {
        if (key.includes('skills') || key.includes('player_')) {
          const value = await AsyncStorage.getItem(key);
          if (value) {
            totalSize += value.length;
          }
        }
      }

      return Math.round(totalSize / 1024); // Return size in KB
    } catch (error) {
      console.error('❌ Error calculating AsyncStorage size:', error);
      return 0;
    }
  }

  // ===== UTILITY METHODS =====

  private initializePerformanceStats(): SystemPerformanceStats {
    return {
      memory: {
        totalSkills: 0,
        loadedTemplates: 0,
        loadedEngineData: 0,
        estimatedMemoryMB: 0,
        asyncStorageSizeKB: 0,
      },
      performance: {
        averageLoadTime: 0,
        cacheHitRate: 0,
        syncOperations: 0,
      },
      network: {
        websocketConnected: false,
        pendingUpdates: 0,
        batchUpdatesSent: 0,
        diffUpdatesSent: 0,
      },
    };
  }

  private initializeLazyLoadingState(): LazyLoadingState {
    return {
      isInitialized: false,
      templatesLoaded: 0,
      totalTemplates: 0,
      loadingProgress: 0,
    };
  }

  private initializeDiffSyncState(): DiffSyncState {
    return {
      lastSyncTimestamp: new Date().toISOString(),
      pendingChanges: [],
      syncInProgress: false,
    };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopDebugMonitoring();
    this.isInitialized = false;
    console.log('🧹 Skill System Manager cleaned up');
  }
}

// Export singleton instance
export const skillSystemManager = new SkillSystemManager();
