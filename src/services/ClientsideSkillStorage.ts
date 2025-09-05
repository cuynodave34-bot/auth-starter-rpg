/**
 * ClientsideSkillStorage - Player's Bookshelf (Borrower Card)
 * 
 * This file serves as the "Player's Bookshelf" - storing only runtime state per skill.
 * It works together with SkillsDB (the Knowledge Base) to provide a complete skill system.
 * 
 * Architecture:
 * - Store only runtime state per skill (no duplication of names/descriptions)
 * - Index by Player UUID for fast lookups
 * - Lightweight UI rendering with FlatList support
 * - Battle-specific fetch that merges with SkillsDB full engine data
 * - Resolve skill names/descriptions via SkillsDB
 * 
 * Key Concepts:
 * - SkillsDB = Knowledge Base (authoritative skill templates)
 * - ClientsideSkillStorage = Player's Bookshelf (runtime state only)
 * - Player pulls skills from SkillsDB based on ownership tag (UUID)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { skillsDB, SkillSummary, Skill } from './SkillsDB';

// Runtime State Interfaces
export interface PlayerSkillState {
  skillId: string; // References SkillsDB skill
  level: number;
  experience: number;
  isActive: boolean;
  lastUsed?: string;
  acquiredAt: string;
  customizations?: Record<string, any>; // Player-specific customizations
  cooldownEndTime?: number; // Runtime cooldown state
  charges?: number; // Runtime charges/uses remaining
}

export interface PlayerSkillInventory {
  playerUUID: string;
  skillStates: PlayerSkillState[];
  lastUpdated: string;
  totalSkills: number;
  version: number; // For conflict resolution
}

// UI Rendering Interfaces
export interface SkillDisplayItem {
  skillId: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  experience: number;
  isActive: boolean;
  lastUsed?: string;
  acquiredAt: string;
  // UI-specific properties
  isLoaded: boolean; // Whether the skill data is fully loaded
  displayName?: string; // Custom display name if set
}

// Battle Interface
export interface BattleSkill {
  skillId: string;
  summary: SkillSummary;
  engineData?: any; // Full engine data from SkillsDB
  runtimeState: PlayerSkillState;
  isReady: boolean; // Whether skill is off cooldown and has charges
  remainingCooldown?: number;
  remainingCharges?: number;
}

export class ClientsideSkillStorage {
  private static readonly STORAGE_KEY_PREFIX = 'player_skills_index_';
  private static readonly INVENTORY_KEY_PREFIX = 'player_inventory_';
  
  /**
   * Get storage key for player skill index
   */
  private static getIndexStorageKey(playerUUID: string): string {
    return `${this.STORAGE_KEY_PREFIX}${playerUUID}`;
  }

  /**
   * Get storage key for player inventory
   */
  private static getInventoryStorageKey(playerUUID: string): string {
    return `${this.INVENTORY_KEY_PREFIX}${playerUUID}`;
  }

  // ===== CORE INVENTORY MANAGEMENT =====

  /**
   * Store player skill states (runtime data only)
   */
  static async storePlayerSkillStates(
    playerUUID: string, 
    skillStates: PlayerSkillState[]
  ): Promise<void> {
    try {
      const inventory: PlayerSkillInventory = {
        playerUUID,
        skillStates,
        lastUpdated: new Date().toISOString(),
        totalSkills: skillStates.length,
        version: 1,
      };

      const inventoryKey = this.getInventoryStorageKey(playerUUID);
      await AsyncStorage.setItem(inventoryKey, JSON.stringify(inventory));

      // Update skill index for fast lookups
      const skillIds = skillStates.map(state => state.skillId);
      await this.updateSkillIndex(playerUUID, skillIds);
      
      console.log(`✅ Stored ${skillStates.length} skill states for player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error storing player skill states:', error);
      throw new Error('Failed to store player skill states');
    }
  }

  /**
   * Get player skill states (runtime data only)
   */
  static async getPlayerSkillStates(playerUUID: string): Promise<PlayerSkillState[]> {
    try {
      const inventoryKey = this.getInventoryStorageKey(playerUUID);
      const storedData = await AsyncStorage.getItem(inventoryKey);
      
      if (!storedData) {
        return [];
      }

      const inventory: PlayerSkillInventory = JSON.parse(storedData);
      return inventory.skillStates;
    } catch (error) {
      console.error('❌ Error retrieving player skill states:', error);
      return [];
    }
  }

  /**
   * Get complete player inventory
   */
  static async getPlayerInventory(playerUUID: string): Promise<PlayerSkillInventory | null> {
    try {
      const inventoryKey = this.getInventoryStorageKey(playerUUID);
      const storedData = await AsyncStorage.getItem(inventoryKey);
      
      if (!storedData) {
        return null;
      }

      return JSON.parse(storedData) as PlayerSkillInventory;
    } catch (error) {
      console.error('❌ Error retrieving player inventory:', error);
      return null;
    }
  }

  // ===== SKILL INDEX MANAGEMENT =====

  /**
   * Update skill index for fast lookups
   */
  private static async updateSkillIndex(playerUUID: string, skillIds: string[]): Promise<void> {
    try {
      const indexKey = this.getIndexStorageKey(playerUUID);
      await AsyncStorage.setItem(indexKey, JSON.stringify(skillIds));
    } catch (error) {
      console.error('❌ Error updating skill index:', error);
    }
  }

  /**
   * Get skill index for player
   */
  static async getPlayerSkillIndex(playerUUID: string): Promise<string[]> {
    try {
      const indexKey = this.getIndexStorageKey(playerUUID);
      const storedData = await AsyncStorage.getItem(indexKey);
      
      if (!storedData) {
        return [];
      }

      return JSON.parse(storedData) as string[];
    } catch (error) {
      console.error('❌ Error retrieving skill index:', error);
      return [];
    }
  }

  // ===== LIGHTWEIGHT UI RENDERING =====

  /**
   * Get skill display items for UI rendering (optimized for FlatList)
   * Only fetches skill.name, ability.name, ability.description from SkillsDB
   */
  static async getSkillDisplayItems(playerUUID: string): Promise<SkillDisplayItem[]> {
    try {
      const skillStates = await this.getPlayerSkillStates(playerUUID);
      const displayItems: SkillDisplayItem[] = [];

      for (const state of skillStates) {
        // Fetch only summary from SkillsDB (lightweight)
        const skillSummary = await skillsDB.getSkillSummary(state.skillId);
        
        if (skillSummary) {
          const displayItem: SkillDisplayItem = {
            skillId: state.skillId,
            name: skillSummary.name,
            description: skillSummary.description,
            category: skillSummary.category,
            rarity: skillSummary.rarity,
            level: state.level,
            experience: state.experience,
            isActive: state.isActive,
            lastUsed: state.lastUsed,
            acquiredAt: state.acquiredAt,
            isLoaded: true,
            displayName: state.customizations?.displayName,
          };
          displayItems.push(displayItem);
        } else {
          // Skill not found in SkillsDB - mark as not loaded
          const displayItem: SkillDisplayItem = {
            skillId: state.skillId,
            name: 'Unknown Skill',
            description: 'Skill data not available',
            category: 'unknown',
            rarity: 'common',
            level: state.level,
            experience: state.experience,
            isActive: state.isActive,
            lastUsed: state.lastUsed,
            acquiredAt: state.acquiredAt,
            isLoaded: false,
          };
          displayItems.push(displayItem);
        }
      }

      return displayItems;
    } catch (error) {
      console.error('❌ Error getting skill display items:', error);
      return [];
    }
  }

  /**
   * Get skill display items by category (for filtered UI)
   */
  static async getSkillDisplayItemsByCategory(
    playerUUID: string, 
    category: string
  ): Promise<SkillDisplayItem[]> {
    const allItems = await this.getSkillDisplayItems(playerUUID);
    return allItems.filter(item => item.category === category);
  }

  /**
   * Get active skill display items only
   */
  static async getActiveSkillDisplayItems(playerUUID: string): Promise<SkillDisplayItem[]> {
    const allItems = await this.getSkillDisplayItems(playerUUID);
    return allItems.filter(item => item.isActive);
  }

  // ===== BATTLE-SPECIFIC METHODS =====

  /**
   * Get player skill for battle (merges ClientsideSkillStorage state + SkillsDB full engine data)
   */
  static async getPlayerSkillForBattle(
    playerUUID: string, 
    skillId: string
  ): Promise<BattleSkill | null> {
    try {
      // Get runtime state from ClientsideSkillStorage
      const skillStates = await this.getPlayerSkillStates(playerUUID);
      const runtimeState = skillStates.find(state => state.skillId === skillId);
      
      if (!runtimeState) {
        return null;
      }

      // Get full skill data from SkillsDB (including engine data)
      const fullSkill = await skillsDB.getPlayerSkillForBattle(playerUUID, skillId);
      
      if (!fullSkill) {
        return null;
      }

      // Calculate battle readiness
      const now = Date.now();
      const isReady = this.isSkillReadyForBattle(runtimeState, now);
      const remainingCooldown = this.getRemainingCooldown(runtimeState, now);
      const remainingCharges = this.getRemainingCharges(runtimeState);

      const battleSkill: BattleSkill = {
        skillId,
        summary: fullSkill.summary,
        engineData: fullSkill.engineData,
        runtimeState,
        isReady,
        remainingCooldown,
        remainingCharges,
      };

      return battleSkill;
    } catch (error) {
      console.error('❌ Error getting battle skill:', error);
      return null;
    }
  }

  /**
   * Get all battle-ready skills for a player
   */
  static async getBattleReadySkills(playerUUID: string): Promise<BattleSkill[]> {
    try {
      const skillStates = await this.getPlayerSkillStates(playerUUID);
      const battleSkills: BattleSkill[] = [];

      for (const state of skillStates) {
        if (state.isActive) {
          const battleSkill = await this.getPlayerSkillForBattle(playerUUID, state.skillId);
          if (battleSkill && battleSkill.isReady) {
            battleSkills.push(battleSkill);
          }
        }
      }

      return battleSkills;
    } catch (error) {
      console.error('❌ Error getting battle ready skills:', error);
      return [];
    }
  }

  // ===== RUNTIME STATE MANAGEMENT =====

  /**
   * Add a new skill state to player's inventory
   */
  static async addSkillState(playerUUID: string, skillState: PlayerSkillState): Promise<void> {
    try {
      const currentStates = await this.getPlayerSkillStates(playerUUID);
      
      // Check if skill already exists
      const existingIndex = currentStates.findIndex(state => state.skillId === skillState.skillId);
      if (existingIndex >= 0) {
        throw new Error('Skill already exists in player inventory');
      }

      const updatedStates = [...currentStates, skillState];
      await this.storePlayerSkillStates(playerUUID, updatedStates);
      
      console.log(`✅ Added skill state for "${skillState.skillId}" to player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error adding skill state:', error);
      throw new Error('Failed to add skill state');
    }
  }

  /**
   * Update an existing skill state
   */
  static async updateSkillState(
    playerUUID: string, 
    skillId: string, 
    updates: Partial<PlayerSkillState>
  ): Promise<void> {
    try {
      const currentStates = await this.getPlayerSkillStates(playerUUID);
      const updatedStates = currentStates.map(state => 
        state.skillId === skillId ? { ...state, ...updates } : state
      );
      
      await this.storePlayerSkillStates(playerUUID, updatedStates);
      console.log(`✅ Updated skill state ${skillId} for player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error updating skill state:', error);
      throw new Error('Failed to update skill state');
    }
  }

  /**
   * Remove a skill state from player's inventory
   */
  static async removeSkillState(playerUUID: string, skillId: string): Promise<void> {
    try {
      const currentStates = await this.getPlayerSkillStates(playerUUID);
      const updatedStates = currentStates.filter(state => state.skillId !== skillId);
      
      await this.storePlayerSkillStates(playerUUID, updatedStates);
      console.log(`✅ Removed skill state ${skillId} from player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error removing skill state:', error);
      throw new Error('Failed to remove skill state');
    }
  }

  /**
   * Update skill cooldown (battle system integration)
   */
  static async updateSkillCooldown(
    playerUUID: string, 
    skillId: string, 
    cooldownDuration: number
  ): Promise<void> {
    const cooldownEndTime = Date.now() + cooldownDuration;
    await this.updateSkillState(playerUUID, skillId, { cooldownEndTime });
  }

  /**
   * Update skill charges (battle system integration)
   */
  static async updateSkillCharges(
    playerUUID: string, 
    skillId: string, 
    charges: number
  ): Promise<void> {
    await this.updateSkillState(playerUUID, skillId, { charges });
  }

  /**
   * Mark skill as used (update lastUsed timestamp)
   */
  static async markSkillAsUsed(playerUUID: string, skillId: string): Promise<void> {
    await this.updateSkillState(playerUUID, skillId, { 
      lastUsed: new Date().toISOString() 
    });
  }

  // ===== UTILITY METHODS =====

  /**
   * Check if skill is ready for battle
   */
  private static isSkillReadyForBattle(state: PlayerSkillState, currentTime: number): boolean {
    // Check cooldown
    if (state.cooldownEndTime && currentTime < state.cooldownEndTime) {
      return false;
    }

    // Check charges
    if (state.charges !== undefined && state.charges <= 0) {
      return false;
    }

    return state.isActive;
  }

  /**
   * Get remaining cooldown time
   */
  private static getRemainingCooldown(state: PlayerSkillState, currentTime: number): number | undefined {
    if (!state.cooldownEndTime) return undefined;
    const remaining = state.cooldownEndTime - currentTime;
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Get remaining charges
   */
  private static getRemainingCharges(state: PlayerSkillState): number | undefined {
    return state.charges;
  }

  /**
   * Clear all skill states for a player (useful for account deletion)
   */
  static async clearPlayerSkillStates(playerUUID: string): Promise<void> {
    try {
      const inventoryKey = this.getInventoryStorageKey(playerUUID);
      const indexKey = this.getIndexStorageKey(playerUUID);
      
      await AsyncStorage.removeItem(inventoryKey);
      await AsyncStorage.removeItem(indexKey);
      
      console.log(`✅ Cleared all skill states for player ${playerUUID}`);
    } catch (error) {
      console.error('❌ Error clearing player skill states:', error);
      throw new Error('Failed to clear player skill states');
    }
  }

  /**
   * Check if player has skill states stored
   */
  static async hasPlayerSkillStates(playerUUID: string): Promise<boolean> {
    try {
      const states = await this.getPlayerSkillStates(playerUUID);
      return states.length > 0;
    } catch (error) {
      console.error('❌ Error checking player skill states:', error);
      return false;
    }
  }

  /**
   * Get skill count for a player
   */
  static async getSkillCount(playerUUID: string): Promise<number> {
    try {
      const states = await this.getPlayerSkillStates(playerUUID);
      return states.length;
    } catch (error) {
      console.error('❌ Error getting skill count:', error);
      return 0;
    }
  }

  /**
   * Get skills by category (returns skill states only)
   */
  static async getSkillStatesByCategory(
    playerUUID: string, 
    category: string
  ): Promise<PlayerSkillState[]> {
    try {
      const states = await this.getPlayerSkillStates(playerUUID);
      const skillIds = states.map(state => state.skillId);
      
      // Get summaries to filter by category
      const summaries = await Promise.all(
        skillIds.map(id => skillsDB.getSkillSummary(id))
      );
      
      const filteredStates: PlayerSkillState[] = [];
      for (let i = 0; i < states.length; i++) {
        const summary = summaries[i];
        if (summary && summary.category === category) {
          filteredStates.push(states[i]);
        }
      }
      
      return filteredStates;
    } catch (error) {
      console.error('❌ Error getting skill states by category:', error);
      return [];
    }
  }

  /**
   * Get active skill states only
   */
  static async getActiveSkillStates(playerUUID: string): Promise<PlayerSkillState[]> {
    try {
      const states = await this.getPlayerSkillStates(playerUUID);
      return states.filter(state => state.isActive);
    } catch (error) {
      console.error('❌ Error getting active skill states:', error);
      return [];
    }
  }
}