# Skill System Architecture

This document describes the comprehensive skill system architecture implemented for the RPG application. The system is designed to be scalable, performant, and maintainable with clear separation of concerns.

## Architecture Overview

The skill system consists of three main components working together:

1. **SkillsDB** - The "Knowledge Base" (authoritative and minimal in-memory)
2. **ClientsideSkillStorage** - The "Player's Bookshelf" (runtime state only)
3. **SkillSystemManager** - System-wide coordination and optimization
4. **SkillWebSocketManager** - Network optimization and real-time sync

## Component Details

### 1. SkillsDB (Knowledge Base)

**Location**: `src/services/SkillsDB.ts`

**Purpose**: Serves as the authoritative, minimal in-memory database for all skills in the system.

**Key Features**:
- **Authoritative Storage**: Single source of truth for all skill data
- **Minimal In-Memory**: Only stores essential data in memory
- **Two Views**: Summary (lightweight) and Full Engine Data (heavy, loaded on demand)
- **UUID-based Ownership**: Skills tagged with player UUIDs for fast filtering
- **64-Alphanumeric IDs**: Unique skill IDs for admin-inserted skills
- **LRU Cache**: Foundation for full engine data caching
- **Secondary Indexes**: Fast queries by owner, category, and template status

**Interfaces**:
```typescript
interface SkillSummary {
  id: string;
  name: string;
  description: string;
  category: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  abilities: SkillAbility[];
  ownerId?: string; // UUID from PlayerDB
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SkillEngineData {
  id: string;
  formulas: Record<string, any>;
  cooldowns: Record<string, number>;
  internalCalculations: Record<string, any>;
  version: number;
  lastModified: string;
}
```

**Usage**:
```typescript
import { skillsDB } from './SkillsDB';

// Get skill summary (always available)
const summary = await skillsDB.getSkillSummary(skillId);

// Get full skill with engine data (loaded on demand)
const fullSkill = await skillsDB.getSkill(skillId, true);

// Get skills by owner
const playerSkills = await skillsDB.getSkillsByOwner(playerUUID);

// Create new skill
const newSkill = await skillsDB.createSkill(skillData, engineData);
```

### 2. ClientsideSkillStorage (Player's Bookshelf)

**Location**: `src/services/ClientsideSkillStorage.ts`

**Purpose**: Stores only runtime state per skill, acting as a "borrower card" that references SkillsDB.

**Key Features**:
- **Runtime State Only**: No duplication of names/descriptions
- **Player UUID Indexing**: Fast lookups by player UUID
- **Lightweight UI Rendering**: Optimized for FlatList and virtualization
- **Battle-Specific Fetch**: Merges runtime state with SkillsDB full engine data
- **AsyncStorage Integration**: Persistent local storage

**Interfaces**:
```typescript
interface PlayerSkillState {
  skillId: string; // References SkillsDB skill
  level: number;
  experience: number;
  isActive: boolean;
  lastUsed?: string;
  acquiredAt: string;
  customizations?: Record<string, any>;
  cooldownEndTime?: number;
  charges?: number;
}

interface SkillDisplayItem {
  skillId: string;
  name: string;
  description: string;
  category: string;
  rarity: string;
  level: number;
  experience: number;
  isActive: boolean;
  isLoaded: boolean;
}
```

**Usage**:
```typescript
import { ClientsideSkillStorage } from './ClientsideSkillStorage';

// Get skill display items for UI
const displayItems = await ClientsideSkillStorage.getSkillDisplayItems(playerUUID);

// Get battle-ready skill
const battleSkill = await ClientsideSkillStorage.getPlayerSkillForBattle(playerUUID, skillId);

// Update skill state
await ClientsideSkillStorage.updateSkillState(playerUUID, skillId, { level: 5 });
```

### 3. SkillSystemManager (System Coordination)

**Location**: `src/services/SkillSystemManager.ts`

**Purpose**: Coordinates between SkillsDB and ClientsideSkillStorage, implements system-wide optimizations.

**Key Features**:
- **Lazy Loading**: Don't load all 500 skill templates at login
- **Diff-based Sync**: Sync only changed skills, not entire sets
- **Shared Registry**: SkillsDB holds one copy of each skill template globally
- **Debug & Monitoring**: Memory usage, AsyncStorage size, WebSocket traffic
- **Performance Tracking**: Cache hit rates, load times, sync operations

**Usage**:
```typescript
import { skillSystemManager } from './SkillSystemManager';

// Initialize the system
await skillSystemManager.initialize();

// Enable debug mode
skillSystemManager.enableDebugMode();

// Get system status
const status = skillSystemManager.getSystemStatus();

// Sync player skills (diff-based)
await skillSystemManager.syncPlayerSkills(playerUUID, changedSkillIds);
```

### 4. SkillWebSocketManager (Network Optimization)

**Location**: `src/services/SkillWebSocketManager.ts`

**Purpose**: Handles all WebSocket communication with network optimization features.

**Key Features**:
- **Batch Updates**: Collect updates and flush every X ms
- **Debouncing**: Avoid flooding on rapid updates
- **Ack System**: Wait for server acknowledgment before finalizing
- **Diff-based Sync**: Only send changed data
- **Retry Logic**: Handle failed sends with exponential backoff
- **Message Queue**: Queue messages when offline, auto-send when reconnected
- **Connection Management**: Auto-reconnect with configurable attempts

**Usage**:
```typescript
import { skillWebSocketManager } from './SkillWebSocketManager';

// Connect to WebSocket
await skillWebSocketManager.connect();

// Send skill update (with batching)
skillWebSocketManager.sendSkillUpdate(update);

// Send diff sync
skillWebSocketManager.sendDiffSync(changedSkillIds, playerUUID);

// Get network stats
const stats = skillWebSocketManager.getNetworkStats();
```

## System-Wide Recommendations Implementation

### 1. Lazy Loading
- **Implementation**: `SkillSystemManager.loadInitialTemplates()`
- **Benefit**: Only loads essential templates at startup, loads others on demand
- **Configuration**: `maxTemplatesToLoadAtStartup: 50`

### 2. Diff-based Sync
- **Implementation**: `SkillSystemManager.syncPlayerSkills()`
- **Benefit**: Sync only changed skills, not entire skill sets
- **Configuration**: `enableDiffSync: true`

### 3. Shared Registry for Static Templates
- **Implementation**: SkillsDB holds one copy of each skill template globally
- **Benefit**: No duplication of static text/data across player storage
- **Usage**: Player storage never duplicates static skill information

### 4. Debug & Monitoring Tools
- **Implementation**: `SkillSystemManager.enableDebugMode()`
- **Features**: Memory usage, AsyncStorage size, WebSocket traffic logging
- **Configuration**: `debugLogInterval: 30000` (30 seconds)

## Performance Optimizations

### Memory Management
- **LRU Cache**: Full engine data cached with configurable size limits
- **Minimal In-Memory**: Only summaries stored in memory by default
- **Memory Monitoring**: Real-time memory usage tracking with warnings

### Network Optimization
- **Batching**: Updates collected and sent in batches (200ms default)
- **Debouncing**: Rapid updates debounced to prevent flooding
- **Diff Sync**: Only changed data transmitted
- **Bandwidth Tracking**: Monitor bytes saved through optimization

### UI Performance
- **FlatList Support**: Optimized for virtualization with large skill lists
- **Lazy Loading**: Skills loaded on demand for UI rendering
- **Display Items**: Lightweight objects for UI consumption

## Configuration

### SkillsDB Configuration
```typescript
const config = {
  maxSummaryCacheSize: 1000,
  maxEngineCacheSize: 100,
  persistenceKey: 'skillsdb_knowledge_base',
  debug: false,
  enableLRU: true,
};
```

### SkillSystemManager Configuration
```typescript
const config = {
  enableLazyLoading: true,
  enableDiffSync: true,
  enableDebugMode: false,
  maxTemplatesToLoadAtStartup: 50,
  syncBatchSize: 20,
  debugLogInterval: 30000,
  memoryWarningThreshold: 100, // MB
};
```

### WebSocket Configuration
```typescript
const config = {
  url: 'ws://localhost:8080/skills',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  batchInterval: 200,
  debounceDelay: 100,
  enableDiffSync: true,
  enableAckSystem: true,
  enableRetryLogic: true,
};
```

## Usage Examples

### Basic Skill Management
```typescript
// Initialize the system
await skillSystemManager.initialize();

// Create a new skill
const skill = await skillsDB.createSkill({
  name: 'Fireball',
  description: 'A powerful fire spell',
  category: 'magic',
  rarity: 'common',
  abilities: [{
    id: 'fireball_cast',
    name: 'Cast Fireball',
    description: 'Launch a fireball at the target',
    damage: 50,
    manaCost: 20
  }],
  isTemplate: true
});

// Add skill to player
await ClientsideSkillStorage.addSkillState(playerUUID, {
  skillId: skill.summary.id,
  level: 1,
  experience: 0,
  isActive: true,
  acquiredAt: new Date().toISOString()
});
```

### UI Rendering
```typescript
// Get display items for FlatList
const displayItems = await ClientsideSkillStorage.getSkillDisplayItems(playerUUID);

// Render in FlatList
<FlatList
  data={displayItems}
  renderItem={({ item }) => (
    <SkillItem
      name={item.name}
      description={item.description}
      level={item.level}
      isLoaded={item.isLoaded}
    />
  )}
  keyExtractor={(item) => item.skillId}
/>
```

### Battle System Integration
```typescript
// Get battle-ready skill
const battleSkill = await ClientsideSkillStorage.getPlayerSkillForBattle(
  playerUUID, 
  skillId
);

if (battleSkill && battleSkill.isReady) {
  // Use skill in battle
  const damage = battleSkill.engineData?.formulas?.damage || 0;
  const cooldown = battleSkill.engineData?.cooldowns?.cast || 0;
  
  // Update cooldown
  await ClientsideSkillStorage.updateSkillCooldown(
    playerUUID, 
    skillId, 
    cooldown
  );
}
```

### Network Sync
```typescript
// Connect WebSocket
await skillWebSocketManager.connect();

// Send skill update
skillWebSocketManager.sendSkillUpdate({
  skillId: 'skill_123',
  type: 'summary',
  data: { level: 5 },
  version: 2,
  timestamp: new Date().toISOString()
});

// Sync changed skills
await skillSystemManager.syncPlayerSkills(playerUUID, ['skill_123', 'skill_456']);
```

## Migration from Previous System

The new system is designed to be backward compatible. To migrate:

1. **Initialize new system**: `await skillSystemManager.initialize()`
2. **Migrate existing skills**: Use `SkillMigrationService` for existing player skills
3. **Update UI components**: Use `ClientsideSkillStorage.getSkillDisplayItems()`
4. **Update battle system**: Use `ClientsideSkillStorage.getPlayerSkillForBattle()`
5. **Enable WebSocket**: Connect `skillWebSocketManager` for real-time sync

## Debugging and Monitoring

### Enable Debug Mode
```typescript
skillSystemManager.enableDebugMode();
```

### Monitor Performance
```typescript
const stats = skillSystemManager.getSystemStatus();
console.log('Memory usage:', stats.performance.memory.estimatedMemoryMB, 'MB');
console.log('Cache hit rate:', stats.performance.performance.cacheHitRate);
```

### WebSocket Monitoring
```typescript
const networkStats = skillWebSocketManager.getNetworkStats();
console.log('Messages sent:', networkStats.messagesSent);
console.log('Bandwidth saved:', networkStats.bandwidthSaved, 'bytes');
```

## Best Practices

1. **Always use SkillsDB for skill data**: Don't duplicate skill information
2. **Use ClientsideSkillStorage for runtime state**: Keep player-specific data separate
3. **Enable lazy loading**: Don't load all skills at startup
4. **Use diff sync**: Only sync changed skills
5. **Monitor performance**: Enable debug mode in development
6. **Handle offline scenarios**: WebSocket manager queues messages when offline
7. **Use FlatList for large skill lists**: Optimize UI performance
8. **Cache engine data**: Use LRU cache for battle calculations

## Troubleshooting

### Common Issues

1. **Skills not loading**: Check if SkillsDB is initialized
2. **UI performance issues**: Use `getSkillDisplayItems()` instead of full skill data
3. **Network sync problems**: Check WebSocket connection status
4. **Memory warnings**: Monitor cache sizes and enable LRU eviction
5. **Battle skills not ready**: Check cooldown and charge states

### Debug Commands
```typescript
// Check system status
const status = skillSystemManager.getSystemStatus();

// Check WebSocket connection
const isConnected = skillWebSocketManager.isConnected();

// Check cache stats
const cacheStats = skillsDB.getCacheStats();

// Clear caches if needed
skillsDB.clearCache();
```

This architecture provides a robust, scalable foundation for the skill system that can handle thousands of skills and players while maintaining optimal performance.
