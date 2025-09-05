/**
 * SkillMigrationService - Handles migration of skills from InventoryDB to ClientsideSkillStorage
 * 
 * This service is responsible for:
 * - Fetching skills from Supabase InventoryDB table
 * - Converting them to the ClientsideSkillStorage format
 * - Storing them locally after email confirmation
 * - Handling the migration process during registration
 */

import { supabase } from '../lib/supabase';
import { ClientsideSkillStorage, PlayerSkill } from './ClientsideSkillStorage';

export interface InventoryDBSkill {
  id: string;
  player_uuid: string;
  skill_name: string;
  skill_description: string;
  skill_level: number;
  skill_experience: number;
  skill_category: string;
  skill_rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  acquired_at: string;
  last_used?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class SkillMigrationService {
  /**
   * Fetch skills from InventoryDB table for a specific player
   */
  static async fetchSkillsFromInventoryDB(playerUUID: string): Promise<InventoryDBSkill[]> {
    try {
      const { data, error } = await supabase
        .from('InventoryDB')
        .select('*')
        .eq('player_uuid', playerUUID);

      if (error) {
        console.error('❌ Error fetching skills from InventoryDB:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error in fetchSkillsFromInventoryDB:', error);
      return [];
    }
  }

  /**
   * Convert InventoryDB skill format to ClientsideSkillStorage format
   */
  static convertToPlayerSkill(inventorySkill: InventoryDBSkill): PlayerSkill {
    return {
      id: inventorySkill.id,
      name: inventorySkill.skill_name,
      description: inventorySkill.skill_description,
      level: inventorySkill.skill_level,
      experience: inventorySkill.skill_experience,
      category: inventorySkill.skill_category,
      rarity: inventorySkill.skill_rarity,
      acquiredAt: inventorySkill.acquired_at,
      lastUsed: inventorySkill.last_used,
      isActive: inventorySkill.is_active,
    };
  }

  /**
   * Migrate all skills from InventoryDB to ClientsideSkillStorage
   * This is called after email confirmation during registration
   */
  static async migratePlayerSkills(playerUUID: string): Promise<boolean> {
    try {
      console.log(`🔄 Starting skill migration for player ${playerUUID}`);

      // Check if skills are already migrated
      const hasExistingSkills = await ClientsideSkillStorage.hasPlayerSkills(playerUUID);
      if (hasExistingSkills) {
        console.log(`✅ Skills already migrated for player ${playerUUID}`);
        return true;
      }

      // Fetch skills from InventoryDB
      const inventorySkills = await this.fetchSkillsFromInventoryDB(playerUUID);
      
      if (inventorySkills.length === 0) {
        console.log(`ℹ️ No skills found in InventoryDB for player ${playerUUID}`);
        // Create empty skill storage for the player
        await ClientsideSkillStorage.storePlayerSkills(playerUUID, []);
        return true;
      }

      // Convert to PlayerSkill format
      const playerSkills: PlayerSkill[] = inventorySkills.map(skill => 
        this.convertToPlayerSkill(skill)
      );

      // Store in ClientsideSkillStorage
      await ClientsideSkillStorage.storePlayerSkills(playerUUID, playerSkills);

      console.log(`✅ Successfully migrated ${playerSkills.length} skills for player ${playerUUID}`);
      return true;
    } catch (error) {
      console.error('❌ Error migrating player skills:', error);
      return false;
    }
  }

  /**
   * Check if a player has skills in InventoryDB that need migration
   */
  static async hasSkillsToMigrate(playerUUID: string): Promise<boolean> {
    try {
      const inventorySkills = await this.fetchSkillsFromInventoryDB(playerUUID);
      return inventorySkills.length > 0;
    } catch (error) {
      console.error('❌ Error checking if skills need migration:', error);
      return false;
    }
  }

  /**
   * Get migration status for a player
   */
  static async getMigrationStatus(playerUUID: string): Promise<{
    hasInventorySkills: boolean;
    hasLocalSkills: boolean;
    needsMigration: boolean;
    inventorySkillCount: number;
    localSkillCount: number;
  }> {
    try {
      const [inventorySkills, localSkills] = await Promise.all([
        this.fetchSkillsFromInventoryDB(playerUUID),
        ClientsideSkillStorage.getPlayerSkills(playerUUID)
      ]);

      const hasInventorySkills = inventorySkills.length > 0;
      const hasLocalSkills = localSkills.length > 0;
      const needsMigration = hasInventorySkills && !hasLocalSkills;

      return {
        hasInventorySkills,
        hasLocalSkills,
        needsMigration,
        inventorySkillCount: inventorySkills.length,
        localSkillCount: localSkills.length,
      };
    } catch (error) {
      console.error('❌ Error getting migration status:', error);
      return {
        hasInventorySkills: false,
        hasLocalSkills: false,
        needsMigration: false,
        inventorySkillCount: 0,
        localSkillCount: 0,
      };
    }
  }

  /**
   * Force re-migration of skills (useful for debugging or data corruption recovery)
   */
  static async forceRemigration(playerUUID: string): Promise<boolean> {
    try {
      console.log(`🔄 Force re-migrating skills for player ${playerUUID}`);

      // Clear existing local skills
      await ClientsideSkillStorage.clearPlayerSkills(playerUUID);

      // Fetch and migrate skills again
      const inventorySkills = await this.fetchSkillsFromInventoryDB(playerUUID);
      
      if (inventorySkills.length === 0) {
        console.log(`ℹ️ No skills found in InventoryDB for player ${playerUUID}`);
        return true;
      }

      const playerSkills: PlayerSkill[] = inventorySkills.map(skill => 
        this.convertToPlayerSkill(skill)
      );

      await ClientsideSkillStorage.storePlayerSkills(playerUUID, playerSkills);

      console.log(`✅ Successfully force re-migrated ${playerSkills.length} skills for player ${playerUUID}`);
      return true;
    } catch (error) {
      console.error('❌ Error force re-migrating player skills:', error);
      return false;
    }
  }

  /**
   * Sync skills between InventoryDB and ClientsideSkillStorage
   * This can be used for periodic synchronization
   */
  static async syncSkills(playerUUID: string): Promise<boolean> {
    try {
      console.log(`🔄 Syncing skills for player ${playerUUID}`);

      const migrationStatus = await this.getMigrationStatus(playerUUID);
      
      if (migrationStatus.needsMigration) {
        console.log(`📦 Skills need migration, migrating ${migrationStatus.inventorySkillCount} skills`);
        return await this.migratePlayerSkills(playerUUID);
      } else if (migrationStatus.hasLocalSkills && migrationStatus.hasInventorySkills) {
        console.log(`✅ Skills are already synced (${migrationStatus.localSkillCount} local, ${migrationStatus.inventorySkillCount} inventory)`);
        return true;
      } else if (migrationStatus.hasLocalSkills && !migrationStatus.hasInventorySkills) {
        console.log(`ℹ️ Player has local skills but no inventory skills - this is normal after migration`);
        return true;
      } else {
        console.log(`ℹ️ No skills found for player ${playerUUID}`);
        return true;
      }
    } catch (error) {
      console.error('❌ Error syncing skills:', error);
      return false;
    }
  }
}
