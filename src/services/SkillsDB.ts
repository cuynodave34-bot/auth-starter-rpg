/**
 * SkillsDB - Authoritative Knowledge Base for All Skills
 * 
 * This file serves as the central, authoritative database for all skills in the system.
 * It acts as the "Knowledge Base" - storing skill templates and providing two views:
 * 1. Summary view: Lightweight data for UI rendering (id, name, abilities)
 * 2. Full Engine Data: Heavy formulas, cooldowns, internal calculations (for battle)
 * 
 * Architecture:
 * - Authoritative and minimal in-memory storage
 * - Indexed by skillId for fast lookups
 * - UUID-based ownership tagging with secondary indexes
 * - 64-alphanumeric unique skillIds for admin-inserted skills
 * - LRU cache foundation for full engine data
 * - Diff-based sync and batch updates for WebSocket
 * - Debug and monitoring tools
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Simple EventEmitter implementation for React Native
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  emit(event: string, ...args: any[]) {
    if (!this.events[event]) return;
    this.events[event].forEach(listener => listener(...args));
  }
}

// Core Skill Interfaces
export interface SkillAbility {
  id: string;
  name: string;
  description: string;
  cooldown?: number;
  manaCost?: number;
  damage?: number;
  effects?: string[];
}

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  abilities: SkillAbility[];
  ownerId?: string; // UUID from PlayerDB - undefined for global templates
  isTemplate: boolean; // true for admin-created templates, false for player-owned
  createdAt: string;
  updatedAt: string;
}

export interface SkillEngineData {
  id: string;
  formulas: Record<string, any>; // Heavy calculation formulas
  cooldowns: Record<string, number>; // Detailed cooldown mechanics
  internalCalculations: Record<string, any>; // Complex battle calculations
  version: number;
  lastModified: string;
}

export interface Skill {
  summary: SkillSummary;
  engineData?: SkillEngineData; // Optional - loaded on demand
}

// Cache and Performance Interfaces
export interface CacheStats {
  summaryCache: {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  engineCache: {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
  memoryUsage: {
    totalSkills: number;
    loadedEngineData: number;
    estimatedMemoryMB: number;
  };
}

export interface LRUCacheConfig {
  maxSize: number;
  ttl: number; // Time to live in milliseconds
}

// WebSocket and Sync Interfaces
export interface SkillUpdate {
  skillId: string;
  type: 'summary' | 'engine' | 'both';
  data: Partial<SkillSummary> | Partial<SkillEngineData>;
  version: number;
  timestamp: string;
  ownerId?: string;
}

export interface BatchUpdate {
  updates: SkillUpdate[];
  batchId: string;
  timestamp: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  batchInterval: number;
  debounceDelay: number;
  enableDiffSync: boolean;
}

// Configuration
export interface SkillsDBConfig {
  maxSummaryCacheSize: number;
  maxEngineCacheSize: number;
  persistenceKey: string;
  wsConfig: WebSocketConfig;
  debug: boolean;
  enableLRU: boolean;
  enableBatchUpdates: boolean;
}

// Default Configuration
const DEFAULT_CONFIG: SkillsDBConfig = {
  maxSummaryCacheSize: 1000, // Store up to 1000 skill summaries
  maxEngineCacheSize: 100,   // Store up to 100 full engine data sets
  persistenceKey: 'skillsdb_knowledge_base',
  wsConfig: {
    url: 'ws://localhost:8080/skills',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    batchInterval: 200,
    debounceDelay: 100,
    enableDiffSync: true,
  },
  debug: false,
  enableLRU: true,
  enableBatchUpdates: true,
};

// LRU Cache Implementation (Foundation)
class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number; accessCount: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number, ttl: number = 300000) { // 5 minutes default TTL
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check TTL
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update access info
    item.accessCount++;
    item.timestamp = Date.now();
    
    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key: string, value: T): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 1,
    });
  }

  has(key: string): boolean {
    return this.cache.has(key) && (Date.now() - this.cache.get(key)!.timestamp <= this.ttl);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // Will be calculated by SkillsDB
    };
  }
}

export class SkillsDB extends EventEmitter {
  private config: SkillsDBConfig;
  
  // Core Storage - Authoritative and Minimal
  private summaryCache = new Map<string, SkillSummary>(); // Always in memory
  private engineCache: LRUCache<SkillEngineData>; // LRU for heavy data
  
  // Secondary Indexes for Fast Queries
  private ownerIndex = new Map<string, Set<string>>(); // ownerId -> Set<skillId>
  private categoryIndex = new Map<string, Set<string>>(); // category -> Set<skillId>
  private templateIndex = new Set<string>(); // skillIds that are templates
  
  // Performance Tracking
  private stats = {
    summaryHits: 0,
    summaryMisses: 0,
    engineHits: 0,
    engineMisses: 0,
  };
  
  // Batch Update Management
  private pendingUpdates: SkillUpdate[] = [];
  private batchTimer?: NodeJS.Timeout;
  
  private isInitialized = false;

  constructor(config: Partial<SkillsDBConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.engineCache = new LRUCache<SkillEngineData>(
      this.config.maxEngineCacheSize,
      300000 // 5 minutes TTL
    );
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      await this.loadFromStorage();
      this.isInitialized = true;
      this.emit('initialized');
      this.log('SkillsDB Knowledge Base initialized successfully');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  // ===== CORE SKILL MANAGEMENT =====

  /**
   * Get skill summary (always available, lightweight)
   */
  async getSkillSummary(skillId: string): Promise<SkillSummary | null> {
    const summary = this.summaryCache.get(skillId);
    if (summary) {
      this.stats.summaryHits++;
      return summary;
    }
    
    this.stats.summaryMisses++;
    this.emit('summaryCacheMiss', skillId);
    return null;
  }

  /**
   * Get full skill with engine data (loads engine data on demand)
   */
  async getSkill(skillId: string, loadEngineData: boolean = false): Promise<Skill | null> {
    const summary = await this.getSkillSummary(skillId);
    if (!summary) return null;

    const skill: Skill = { summary };
    
    if (loadEngineData) {
      const engineData = await this.getEngineData(skillId);
      skill.engineData = engineData || undefined;
    }
    
    return skill;
  }

  /**
   * Get engine data (loaded on demand, cached with LRU)
   */
  async getEngineData(skillId: string): Promise<SkillEngineData | null> {
    // Check LRU cache first
    const cached = this.engineCache.get(skillId);
    if (cached) {
      this.stats.engineHits++;
      return cached;
    }

    // Load from storage or generate
    this.stats.engineMisses++;
    const engineData = await this.loadEngineDataFromStorage(skillId);
    
    if (engineData) {
      this.engineCache.set(skillId, engineData);
      return engineData;
    }
    
    return null;
  }

  /**
   * Create a new skill (admin templates or player-owned)
   */
  async createSkill(
    skillData: Omit<SkillSummary, 'id' | 'createdAt' | 'updatedAt'>,
    engineData?: Partial<SkillEngineData>
  ): Promise<Skill> {
    const skillId = this.generateUniqueSkillId();
    const now = new Date().toISOString();

    const summary: SkillSummary = {
      ...skillData,
      id: skillId,
      createdAt: now,
      updatedAt: now,
    };

    // Store summary (always in memory)
    this.summaryCache.set(skillId, summary);
    this.updateIndexes(summary, 'add');

    // Store engine data if provided
    if (engineData) {
      const fullEngineData: SkillEngineData = {
        id: skillId,
        formulas: engineData.formulas || {},
        cooldowns: engineData.cooldowns || {},
        internalCalculations: engineData.internalCalculations || {},
        version: 1,
        lastModified: now,
      };
      
      this.engineCache.set(skillId, fullEngineData);
      await this.saveEngineDataToStorage(skillId, fullEngineData);
    }

    await this.saveToStorage();
    this.emit('skillCreated', { summary, engineData });
    this.log('Skill created:', skillId);

    const finalEngineData = engineData ? await this.getEngineData(skillId) : undefined;
    return { summary, engineData: finalEngineData || undefined };
  }

  /**
   * Update skill (supports partial updates)
   */
  async updateSkill(
    skillId: string,
    updates: Partial<SkillSummary>,
    engineUpdates?: Partial<SkillEngineData>,
    ownerId?: string
  ): Promise<Skill> {
    const existingSummary = this.summaryCache.get(skillId);
    if (!existingSummary) {
      throw new Error('Skill not found');
    }

    // Validate ownership for player-owned skills
    if (existingSummary.ownerId && existingSummary.ownerId !== ownerId) {
      throw new Error('Unauthorized: You can only update your own skills');
    }

    const updatedSummary: SkillSummary = {
      ...existingSummary,
      ...updates,
      id: skillId, // Ensure ID doesn't change
      updatedAt: new Date().toISOString(),
    };

    // Update summary
    this.summaryCache.set(skillId, updatedSummary);
    this.updateIndexes(updatedSummary, 'update', existingSummary);

    // Update engine data if provided
    let updatedEngineData: SkillEngineData | undefined;
    if (engineUpdates) {
      const existingEngineData = await this.getEngineData(skillId);
      updatedEngineData = {
        formulas: {},
        cooldowns: {},
        internalCalculations: {},
        ...existingEngineData,
        ...engineUpdates,
        id: skillId,
        version: (existingEngineData?.version || 0) + 1,
        lastModified: new Date().toISOString(),
      };
      
      this.engineCache.set(skillId, updatedEngineData);
      await this.saveEngineDataToStorage(skillId, updatedEngineData);
    }

    await this.saveToStorage();
    this.emit('skillUpdated', { summary: updatedSummary, engineData: updatedEngineData });
    this.log('Skill updated:', skillId);

    const finalEngineData = updatedEngineData || await this.getEngineData(skillId);
    return { 
      summary: updatedSummary, 
      engineData: finalEngineData || undefined
    };
  }

  /**
   * Delete skill
   */
  async deleteSkill(skillId: string, ownerId?: string): Promise<void> {
    const summary = this.summaryCache.get(skillId);
    if (!summary) {
      throw new Error('Skill not found');
    }

    // Validate ownership for player-owned skills
    if (summary.ownerId && summary.ownerId !== ownerId) {
      throw new Error('Unauthorized: You can only delete your own skills');
    }

    this.summaryCache.delete(skillId);
    this.engineCache.delete(skillId);
    this.updateIndexes(summary, 'remove');
    
    await this.deleteEngineDataFromStorage(skillId);
    await this.saveToStorage();

    this.emit('skillDeleted', skillId);
    this.log('Skill deleted:', skillId);
  }

  // ===== QUERY METHODS =====

  /**
   * Get skills by owner (UUID-based)
   */
  async getSkillsByOwner(ownerId: string): Promise<SkillSummary[]> {
    const skillIds = this.ownerIndex.get(ownerId);
    if (!skillIds) return [];

    const skills: SkillSummary[] = [];
    for (const skillId of skillIds) {
      const summary = this.summaryCache.get(skillId);
      if (summary) {
        skills.push(summary);
      }
    }
    return skills;
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(category: string): Promise<SkillSummary[]> {
    const skillIds = this.categoryIndex.get(category);
    if (!skillIds) return [];

    const skills: SkillSummary[] = [];
    for (const skillId of skillIds) {
      const summary = this.summaryCache.get(skillId);
      if (summary) {
        skills.push(summary);
      }
    }
    return skills;
  }

  /**
   * Get all skill templates (admin-created, no owner)
   */
  async getSkillTemplates(): Promise<SkillSummary[]> {
    const templates: SkillSummary[] = [];
    for (const skillId of this.templateIndex) {
      const summary = this.summaryCache.get(skillId);
      if (summary) {
        templates.push(summary);
      }
    }
    return templates;
  }

  /**
   * Get all skills (summaries only for performance)
   */
  async getAllSkillSummaries(): Promise<SkillSummary[]> {
    return Array.from(this.summaryCache.values());
  }

  // ===== BATTLE-SPECIFIC METHODS =====

  /**
   * Get player skill for battle (merges runtime state with full engine data)
   */
  async getPlayerSkillForBattle(playerUUID: string, skillId: string): Promise<Skill | null> {
    // Verify ownership
    const summary = this.summaryCache.get(skillId);
    if (!summary || summary.ownerId !== playerUUID) {
      return null;
    }

    // Load full engine data for battle
    const engineData = await this.getEngineData(skillId);
    return { summary, engineData: engineData || undefined };
  }

  // ===== INDEX MANAGEMENT =====

  private updateIndexes(
    summary: SkillSummary, 
    operation: 'add' | 'update' | 'remove', 
    oldSummary?: SkillSummary
  ): void {
    if (operation === 'add') {
      // Add to owner index
      if (summary.ownerId) {
        if (!this.ownerIndex.has(summary.ownerId)) {
          this.ownerIndex.set(summary.ownerId, new Set());
        }
        this.ownerIndex.get(summary.ownerId)!.add(summary.id);
      } else {
        // Template skill
        this.templateIndex.add(summary.id);
      }

      // Add to category index
      if (!this.categoryIndex.has(summary.category)) {
        this.categoryIndex.set(summary.category, new Set());
      }
      this.categoryIndex.get(summary.category)!.add(summary.id);

    } else if (operation === 'update' && oldSummary) {
      // Update indexes if owner or category changed
      if (oldSummary.ownerId !== summary.ownerId) {
        if (oldSummary.ownerId) {
          this.ownerIndex.get(oldSummary.ownerId)?.delete(summary.id);
        } else {
          this.templateIndex.delete(summary.id);
        }

        if (summary.ownerId) {
          if (!this.ownerIndex.has(summary.ownerId)) {
            this.ownerIndex.set(summary.ownerId, new Set());
          }
          this.ownerIndex.get(summary.ownerId)!.add(summary.id);
        } else {
          this.templateIndex.add(summary.id);
        }
      }

      if (oldSummary.category !== summary.category) {
        this.categoryIndex.get(oldSummary.category)?.delete(summary.id);
        if (!this.categoryIndex.has(summary.category)) {
          this.categoryIndex.set(summary.category, new Set());
        }
        this.categoryIndex.get(summary.category)!.add(summary.id);
      }

    } else if (operation === 'remove') {
      // Remove from indexes
      if (summary.ownerId) {
        this.ownerIndex.get(summary.ownerId)?.delete(summary.id);
      } else {
        this.templateIndex.delete(summary.id);
      }
      this.categoryIndex.get(summary.category)?.delete(summary.id);
    }
  }

  // ===== PERSISTENCE =====

  private async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.config.persistenceKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.restoreFromData(data);
        this.log(`Loaded ${data.summaries.length} skill summaries from storage`);
      }
    } catch (error) {
      this.log('Failed to load from storage:', error);
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = this.serializeForStorage();
      await AsyncStorage.setItem(this.config.persistenceKey, JSON.stringify(data));
    } catch (error) {
      this.log('Failed to save to storage:', error);
    }
  }

  private serializeForStorage(): any {
    return {
      summaries: Array.from(this.summaryCache.values()),
      indexes: {
        ownerIndex: Object.fromEntries(
          Array.from(this.ownerIndex.entries()).map(([key, set]) => [key, Array.from(set)])
        ),
        categoryIndex: Object.fromEntries(
          Array.from(this.categoryIndex.entries()).map(([key, set]) => [key, Array.from(set)])
        ),
        templateIndex: Array.from(this.templateIndex),
      },
      timestamp: Date.now(),
    };
  }

  private restoreFromData(data: any): void {
    // Restore summaries
    for (const summary of data.summaries) {
      this.summaryCache.set(summary.id, summary);
    }

    // Restore indexes
    if (data.indexes) {
      // Restore owner index
      for (const [ownerId, skillIds] of Object.entries(data.indexes.ownerIndex || {})) {
        this.ownerIndex.set(ownerId, new Set(skillIds as string[]));
      }

      // Restore category index
      for (const [category, skillIds] of Object.entries(data.indexes.categoryIndex || {})) {
        this.categoryIndex.set(category, new Set(skillIds as string[]));
      }

      // Restore template index
      this.templateIndex = new Set(data.indexes.templateIndex || []);
    }
  }

  private async loadEngineDataFromStorage(skillId: string): Promise<SkillEngineData | null> {
    try {
      const key = `${this.config.persistenceKey}_engine_${skillId}`;
      const stored = await AsyncStorage.getItem(key);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      this.log('Failed to load engine data:', error);
      return null;
    }
  }

  private async saveEngineDataToStorage(skillId: string, engineData: SkillEngineData): Promise<void> {
    try {
      const key = `${this.config.persistenceKey}_engine_${skillId}`;
      await AsyncStorage.setItem(key, JSON.stringify(engineData));
    } catch (error) {
      this.log('Failed to save engine data:', error);
    }
  }

  private async deleteEngineDataFromStorage(skillId: string): Promise<void> {
    try {
      const key = `${this.config.persistenceKey}_engine_${skillId}`;
      await AsyncStorage.removeItem(key);
    } catch (error) {
      this.log('Failed to delete engine data:', error);
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Generate 64-alphanumeric unique skill ID
   */
  private generateUniqueSkillId(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < 64; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[SkillsDB]', ...args);
    }
  }

  // ===== PUBLIC API =====

  getCacheStats(): CacheStats {
    const summaryHitRate = this.stats.summaryHits + this.stats.summaryMisses > 0 
      ? this.stats.summaryHits / (this.stats.summaryHits + this.stats.summaryMisses) 
      : 0;

    const engineHitRate = this.stats.engineHits + this.stats.engineMisses > 0 
      ? this.stats.engineHits / (this.stats.engineHits + this.stats.engineMisses) 
      : 0;

    return {
      summaryCache: {
        size: this.summaryCache.size,
        maxSize: this.config.maxSummaryCacheSize,
        hits: this.stats.summaryHits,
        misses: this.stats.summaryMisses,
        hitRate: summaryHitRate,
      },
      engineCache: {
        size: this.engineCache.size(),
        maxSize: this.config.maxEngineCacheSize,
        hits: this.stats.engineHits,
        misses: this.stats.engineMisses,
        hitRate: engineHitRate,
      },
      memoryUsage: {
        totalSkills: this.summaryCache.size,
        loadedEngineData: this.engineCache.size(),
        estimatedMemoryMB: Math.round((this.summaryCache.size * 0.5 + this.engineCache.size() * 2) / 1024),
      },
    };
  }

  clearCache(): void {
    this.summaryCache.clear();
    this.engineCache.clear();
    this.ownerIndex.clear();
    this.categoryIndex.clear();
    this.templateIndex.clear();
    this.stats = { summaryHits: 0, summaryMisses: 0, engineHits: 0, engineMisses: 0 };
    this.emit('cacheCleared');
  }

  // Debug Methods
  enableDebug(): void {
    this.config.debug = true;
  }

  disableDebug(): void {
    this.config.debug = false;
  }

  getDebugInfo(): any {
    return {
      config: this.config,
      cacheStats: this.getCacheStats(),
      indexes: {
        ownerCount: this.ownerIndex.size,
        categoryCount: this.categoryIndex.size,
        templateCount: this.templateIndex.size,
      },
      isInitialized: this.isInitialized,
    };
  }
}

// Export singleton instance
export const skillsDB = new SkillsDB();