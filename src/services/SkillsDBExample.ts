/**
 * SkillsDB Usage Examples and Testing
 * 
 * This file demonstrates how to use the optimized SkillsDB with all its features
 * including caching, WebSocket connectivity, offline persistence, and more.
 */

import { skillsDB, Skill } from './SkillsDB';
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
      level: 1,
      experience: 0,
      category: 'Magic',
      rarity: 'common',
      ownerId: 'player-uuid-123',
      acquiredAt: new Date().toISOString(),
      isActive: true,
    });
    
    console.log('Created skill:', newSkill);
    
    // Get skills by owner
    const playerSkills = await skillsDB.getSkillsByOwner('player-uuid-123');
    console.log('Player skills:', playerSkills);
    
    // Update a skill
    const updatedSkill = await skillsDB.updateSkill(
      newSkill.id,
      { level: 2, experience: 100 },
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
      console.log('New skill created:', skill.name);
    });
    
    advancedDB.on('skillUpdated', (skill: Skill) => {
      console.log('Skill updated:', skill.name, 'Level:', skill.level);
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
          level: Math.floor(Math.random() * 10) + 1,
          experience: Math.floor(Math.random() * 1000),
          category: ['Magic', 'Combat', 'Utility'][Math.floor(Math.random() * 3)],
          rarity: ['common', 'uncommon', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 5)] as any,
          ownerId: `player-${Math.floor(Math.random() * 100)}`,
          acquiredAt: new Date().toISOString(),
          isActive: true,
        })
      );
    }
    
    await Promise.all(promises);
    
    const endTime = Date.now();
    console.log(`Created ${skillCount} skills in ${endTime - startTime}ms`);
    
    // Test query performance
    const queryStartTime = Date.now();
    const allSkills = await skillsDB.getAllSkills();
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
        level: 1,
        experience: 0,
        category: 'Test',
        rarity: 'common',
        ownerId: '', // Invalid owner ID
        acquiredAt: new Date().toISOString(),
        isActive: true,
      });
    } catch (error) {
      console.log('Expected error for invalid owner:', error.message);
    }
    
    // Test unauthorized update
    try {
      const skill = await skillsDB.createSkill({
        name: 'Test Skill',
        description: 'Test description',
        level: 1,
        experience: 0,
        category: 'Test',
        rarity: 'common',
        ownerId: 'player-1',
        acquiredAt: new Date().toISOString(),
        isActive: true,
      });
      
      // Try to update with different owner
      await skillsDB.updateSkill(skill.id, { level: 2 }, 'player-2');
    } catch (error) {
      console.log('Expected error for unauthorized update:', error.message);
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
      console.log(`Battle system: Skill ${skill.name} updated to level ${skill.level}`);
      // Update battle UI, recalculate damage, etc.
    });
    
    this.skillsDB.on('skillCreated', (skill: Skill) => {
      console.log(`Battle system: New skill ${skill.name} available`);
      // Add to available skills list
    });
  }
  
  async getPlayerSkills(playerId: string): Promise<Skill[]> {
    return await this.skillsDB.getSkillsByOwner(playerId);
  }
  
  async useSkill(skillId: string, playerId: string): Promise<void> {
    const skill = await this.skillsDB.getSkill(skillId);
    if (!skill) {
      throw new Error('Skill not found');
    }
    
    if (skill.ownerId !== playerId) {
      throw new Error('Unauthorized skill use');
    }
    
    // Update last used timestamp
    await this.skillsDB.updateSkill(skillId, {
      lastUsed: new Date().toISOString(),
    }, playerId);
    
    console.log(`Player ${playerId} used skill ${skill.name}`);
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
        hitRate: `${(stats.hitRate * 100).toFixed(2)}%`,
        size: `${stats.size}/${stats.maxSize}`,
        hits: stats.hits,
        misses: stats.misses,
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
