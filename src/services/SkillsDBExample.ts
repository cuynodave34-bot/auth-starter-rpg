/**
 * SkillsDB Usage Examples and Testing
 * 
 * This file demonstrates how to use the optimized SkillsDB with all its features
 * including caching, WebSocket connectivity, offline persistence, and more.
 */

import { skillsDB, Skill, SkillSummary } from './SkillsDB';
import { AdvancedSkillsDB } from './SkillsDBAdvanced';

// Example 1: Basic Usage
export async function basicUsageExample() {
  try {
    // Initialize the SkillsDB
    await skillsDB.initialize();
    
    // Enable debug mode for development
    skillsDB.enableDebug();
    
    // Create a new skill
    const newSkill = await skillsDB.createSkill({
      name: 'Fireball',
      description: 'A powerful fire spell',
      category: 'Magic',
      rarity: 'common',
      abilities: [
        {
          id: 'fireball-1',
          name: 'Cast Fireball',
          description: 'Launch a fireball at the target',
          cooldown: 3000,
          manaCost: 50,
          damage: 100,
          effects: ['burn', 'knockback']
        }
      ],
      ownerId: 'player-uuid-123',
      isTemplate: false,
    });
    
    console.log('Created skill:', newSkill);
    
    // Get skills by owner
    const playerSkills = await skillsDB.getSkillsByOwner('player-uuid-123');
    console.log('Player skills:', playerSkills);
    
    // Update a skill
    const updatedSkill = await skillsDB.updateSkill(
      newSkill.summary.id,
      { 
        name: 'Enhanced Fireball',
        description: 'An even more powerful fire spell'
      },
      undefined,
      'player-uuid-123'
    );
    console.log('Updated skill:', updatedSkill);
    
    // Get cache statistics
    const stats = skillsDB.getCacheStats();
    console.log('Cache stats:', stats);
    
  } catch (error) {
    console.error('Error in basic usage:', error);
  }
}

// Example 2: Advanced Configuration
export async function advancedConfigurationExample() {
  const advancedDB = new AdvancedSkillsDB({
    maxCacheSize: 1000,
    persistenceKey: 'advanced_skills_cache',
    wsConfig: {
      url: 'ws://localhost:8080/skills',
      reconnectInterval: 2000,
      maxReconnectAttempts: 10,
      batchInterval: 150,
      debounceDelay: 50,
    },
    debug: true,
  });
  
  try {
    await advancedDB.initialize();
    
    // Listen to events
    advancedDB.on('skillCreated', (skill: Skill) => {
      console.log('New skill created:', skill.summary.name);
    });
    
    advancedDB.on('skillUpdated', (skill: Skill) => {
      console.log('Skill updated:', skill.summary.name);
    });
    
    advancedDB.on('connected', () => {
      console.log('Connected to WebSocket server');
    });
    
    advancedDB.on('disconnected', () => {
      console.log('Disconnected from WebSocket server');
    });
    
    advancedDB.on('error', (error: Error) => {
      console.error('SkillsDB error:', error.message);
    });
    
  } catch (error) {
    console.error('Error in advanced configuration:', error);
  }
}

// Example 3: Performance Testing
export async function performanceTestExample() {
  const startTime = Date.now();
  const skillCount = 1000;
  
  try {
    await skillsDB.initialize();
    
    // Create many skills
    const promises = [];
    for (let i = 0; i < skillCount; i++) {
      promises.push(
        skillsDB.createSkill({
          name: `Skill ${i}`,
          description: `Description for skill ${i}`,
          category: ['Magic', 'Combat', 'Utility'][Math.floor(Math.random() * 3)],
          rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)] as any,
          abilities: [
            {
              id: `skill-${i}-ability`,
              name: `Ability ${i}`,
              description: `Ability description ${i}`,
              cooldown: Math.floor(Math.random() * 5000) + 1000,
              manaCost: Math.floor(Math.random() * 100) + 10,
              damage: Math.floor(Math.random() * 200) + 50,
            }
          ],
          ownerId: `player-${Math.floor(Math.random() * 100)}`,
          isTemplate: false,
        })
      );
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    console.log(`Created ${skillCount} skills in ${endTime - startTime}ms`);
    
    // Test query performance
    const queryStartTime = Date.now();
    const allSkills = await skillsDB.getAllSkillSummaries();
    const queryEndTime = Date.now();
    
    console.log(`Retrieved ${allSkills.length} skills in ${queryEndTime - queryStartTime}ms`);
    
    // Test cache performance
    const cacheStats = skillsDB.getCacheStats();
    console.log('Final cache stats:', cacheStats);
    
  } catch (error) {
    console.error('Error in performance test:', error);
  }
}

// Example 4: Error Handling and Resilience
export async function errorHandlingExample() {
  try {
    await skillsDB.initialize();
    
    // Test invalid owner validation
    try {
      await skillsDB.createSkill({
        name: 'Invalid Skill',
        description: 'This should fail',
        category: 'Test',
        rarity: 'common',
        abilities: [],
        ownerId: '', // Invalid owner ID
        isTemplate: false,
      });
    } catch (error) {
      console.log('Expected error for invalid owner:', (error as Error).message);
    }
    
    // Test unauthorized update
    try {
      const skill = await skillsDB.createSkill({
        name: 'Test Skill',
        description: 'Test description',
        category: 'Test',
        rarity: 'common',
        abilities: [
          {
            id: 'test-ability',
            name: 'Test Ability',
            description: 'Test ability description',
          }
        ],
        ownerId: 'player-1',
        isTemplate: false,
      });
      
      // Try to update with different owner
      await skillsDB.updateSkill(skill.summary.id, { name: 'Hacked Skill' }, undefined, 'player-2');
    } catch (error) {
      console.log('Expected error for unauthorized update:', (error as Error).message);
    }
    
  } catch (error) {
    console.error('Error in error handling example:', error);
  }
}

// Example 5: Integration with Battle System
export class BattleSystem {
  private skillsDB: typeof skillsDB;
  
  constructor() {
    this.skillsDB = skillsDB;
    this.setupEventListeners();
  }
  
  private setupEventListeners(): void {
    this.skillsDB.on('skillUpdated', (skill: Skill) => {
      console.log(`Battle system: Skill ${skill.summary.name} updated`);
      // Update battle UI, recalculate damage, etc.
    });
    
    this.skillsDB.on('skillCreated', (skill: Skill) => {
      console.log(`Battle system: New skill ${skill.summary.name} available`);
      // Add to available skills list
    });
  }
  
  async getPlayerSkills(playerId: string): Promise<SkillSummary[]> {
    return await this.skillsDB.getSkillsByOwner(playerId);
  }
  
  async useSkill(skillId: string, playerId: string): Promise<void> {
    const skill = await this.skillsDB.getSkill(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    if (skill.summary.ownerId !== playerId) {
      throw new Error('Unauthorized skill use');
    }
    
    // Update last used timestamp (this would need to be added to the SkillSummary interface)
    // For now, we'll just log the usage
    console.log(`Player ${playerId} used skill ${skill.summary.name}`);
  }
}

// Example 6: Debug and Monitoring
export async function debugAndMonitoringExample() {
  try {
    await skillsDB.initialize();
    skillsDB.enableDebug();
    
    // Get debug information
    const debugInfo = skillsDB.getDebugInfo();
    console.log('Debug info:', debugInfo);
    
    // Monitor cache performance
    setInterval(() => {
      const stats = skillsDB.getCacheStats();
      console.log('Cache performance:', {
        summaryHitRate: `${(stats.summaryCache.hitRate * 100).toFixed(2)}%`,
        summarySize: `${stats.summaryCache.size}/${stats.summaryCache.maxSize}`,
        summaryHits: stats.summaryCache.hits,
        summaryMisses: stats.summaryCache.misses,
        engineHitRate: `${(stats.engineCache.hitRate * 100).toFixed(2)}%`,
        engineSize: `${stats.engineCache.size}/${stats.engineCache.maxSize}`,
        engineHits: stats.engineCache.hits,
        engineMisses: stats.engineCache.misses,
      });
    }, 5000);
    
    // Test cache clearing
    setTimeout(() => {
      console.log('Clearing cache...');
      skillsDB.clearCache();
      console.log('Cache cleared');
    }, 10000);
    
  } catch (error) {
    console.error('Error in debug example:', error);
  }
}

// Export all examples for easy testing
export const examples = {
  basicUsage: basicUsageExample,
  advancedConfiguration: advancedConfigurationExample,
  performanceTest: performanceTestExample,
  errorHandling: errorHandlingExample,
  debugAndMonitoring: debugAndMonitoringExample,
};

// Run all examples (for testing)
export async function runAllExamples() {
  console.log('=== Running SkillsDB Examples ===');
  
  for (const [name, example] of Object.entries(examples)) {
    console.log(`\n--- Running ${name} ---`);
    try {
      await example();
      console.log(`✅ ${name} completed successfully`);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  }
  
  console.log('\n=== All Examples Completed ===');
}
