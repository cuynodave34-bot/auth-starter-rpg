# SkillsDB - Optimized Central Database for All Skills

## Overview

The SkillsDB is a comprehensive, scalable skill database management system designed for real-time multiplayer games. It provides advanced caching, offline persistence, WebSocket connectivity, and robust data consistency features.

## Key Features

### 🚀 Performance & Scalability
- **LRU Cache**: Configurable cache size with automatic eviction of least recently used items
- **Secondary Indexes**: O(1) lookups by owner and category
- **Memory Management**: Automatic cleanup and optimization
- **Batch Processing**: Efficient handling of multiple operations

### 🔄 Offline & Persistence
- **AsyncStorage Integration**: Persistent local storage across app restarts
- **Offline Support**: Continue working without network connection
- **Data Synchronization**: Automatic sync when connection is restored
- **Backup & Recovery**: Built-in data backup mechanisms

### 🌐 WebSocket Optimization
- **Batched Updates**: Collects updates and sends in batches (configurable interval)
- **Debouncing**: Prevents spam from rapid successive updates
- **Acknowledgment System**: Ensures reliable message delivery
- **Auto-Reconnection**: Automatic reconnection with exponential backoff

### 🔒 Data Consistency & Security
- **Version Control**: Conflict resolution using version numbers
- **Owner Validation**: Ensures users can only modify their own skills
- **UUID Integration**: Seamless integration with PlayerDB UUIDs
- **Input Validation**: Comprehensive data validation

### 📊 Monitoring & Debugging
- **Cache Statistics**: Hit/miss rates, size monitoring
- **Event System**: Real-time notifications for all operations
- **Debug Mode**: Comprehensive logging for development
- **Performance Metrics**: Built-in performance monitoring

## Quick Start

### Basic Usage

```typescript
import { skillsDB } from './services/SkillsDB';

// Initialize the database
await skillsDB.initialize();

// Create a new skill
const skill = await skillsDB.createSkill({
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

// Get skills by owner
const playerSkills = await skillsDB.getSkillsByOwner('player-uuid-123');

// Update a skill
await skillsDB.updateSkill(skill.id, { level: 2 }, 'player-uuid-123');
```

### Advanced Configuration

```typescript
import { AdvancedSkillsDB } from './services/SkillsDBAdvanced';

const advancedDB = new AdvancedSkillsDB({
  maxCacheSize: 1000,
  persistenceKey: 'my_skills_cache',
  wsConfig: {
    url: 'ws://localhost:8080/skills',
    reconnectInterval: 2000,
    maxReconnectAttempts: 10,
    batchInterval: 150,
    debounceDelay: 50,
  },
  debug: true,
});

await advancedDB.initialize();
```

## API Reference

### Core Methods

#### `initialize(): Promise<void>`
Initializes the SkillsDB, loads from storage, and connects to WebSocket.

#### `createSkill(skill: Omit<Skill, 'id' | 'version' | 'createdAt' | 'updatedAt'>): Promise<Skill>`
Creates a new skill with automatic ID generation and versioning.

#### `getSkill(id: string): Promise<Skill | null>`
Retrieves a skill by ID with cache optimization.

#### `getSkillsByOwner(ownerId: string): Promise<Skill[]>`
Gets all skills belonging to a specific player (O(1) lookup).

#### `getSkillsByCategory(category: string): Promise<Skill[]>`
Gets all skills in a specific category (O(1) lookup).

#### `updateSkill(id: string, updates: Partial<Skill>, ownerId: string): Promise<Skill>`
Updates a skill with ownership validation and version increment.

#### `deleteSkill(id: string, ownerId: string): Promise<void>`
Deletes a skill with ownership validation.

### Monitoring & Debug

#### `getCacheStats(): CacheStats`
Returns cache performance statistics.

```typescript
const stats = skillsDB.getCacheStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Cache size: ${stats.size}/${stats.maxSize}`);
```

#### `enableDebug(): void` / `disableDebug(): void`
Controls debug logging.

#### `getDebugInfo(): any`
Returns comprehensive debug information.

### Events

The SkillsDB extends EventEmitter and provides the following events:

```typescript
skillsDB.on('skillCreated', (skill: Skill) => {
  console.log('New skill created:', skill.name);
});

skillsDB.on('skillUpdated', (skill: Skill) => {
  console.log('Skill updated:', skill.name);
});

skillsDB.on('skillDeleted', (skillId: string) => {
  console.log('Skill deleted:', skillId);
});

skillsDB.on('connected', () => {
  console.log('Connected to WebSocket');
});

skillsDB.on('disconnected', () => {
  console.log('Disconnected from WebSocket');
});

skillsDB.on('error', (error: Error) => {
  console.error('SkillsDB error:', error);
});
```

## Configuration Options

### SkillsDBConfig

```typescript
interface SkillsDBConfig {
  maxCacheSize: number;           // Maximum number of skills in cache (default: 500)
  persistenceKey: string;         // AsyncStorage key for persistence
  wsConfig: WebSocketConfig;      // WebSocket configuration
  debug: boolean;                 // Enable debug logging
}
```

### WebSocketConfig

```typescript
interface WebSocketConfig {
  url: string;                    // WebSocket server URL
  reconnectInterval: number;      // Reconnection delay in ms (default: 3000)
  maxReconnectAttempts: number;   // Max reconnection attempts (default: 5)
  batchInterval: number;          // Batch update interval in ms (default: 200)
  debounceDelay: number;          // Debounce delay in ms (default: 100)
}
```

## Performance Optimization

### Cache Management
- **LRU Eviction**: Automatically removes least recently used skills when cache is full
- **Smart Indexing**: Maintains secondary indexes for O(1) lookups
- **Memory Monitoring**: Built-in memory usage tracking

### WebSocket Optimization
- **Batching**: Groups multiple updates into single messages
- **Debouncing**: Prevents rapid-fire updates from overwhelming the server
- **Acknowledgment**: Ensures reliable delivery with retry logic

### Data Persistence
- **Incremental Sync**: Only syncs changes, not entire dataset
- **Compression**: Efficient storage format
- **Background Sync**: Non-blocking persistence operations

## Security Features

### Ownership Validation
All skill modifications require owner validation:

```typescript
// This will throw an error if ownerId doesn't match
await skillsDB.updateSkill(skillId, updates, 'different-player-uuid');
```

### UUID Integration
Seamless integration with PlayerDB UUIDs:

```typescript
// Validate against PlayerDB
const isValidOwner = await validatePlayerUUID(ownerId);
```

### Input Sanitization
All inputs are validated and sanitized before processing.

## Error Handling

### Graceful Degradation
- **Offline Mode**: Continues working without network
- **Cache Fallback**: Uses cached data when server is unavailable
- **Retry Logic**: Automatic retry for failed operations

### Error Types
```typescript
// Common error scenarios
try {
  await skillsDB.updateSkill(skillId, updates, ownerId);
} catch (error) {
  if (error.message.includes('Unauthorized')) {
    // Handle ownership validation error
  } else if (error.message.includes('not found')) {
    // Handle skill not found error
  } else {
    // Handle other errors
  }
}
```

## Testing & Examples

### Running Examples
```typescript
import { runAllExamples } from './services/SkillsDBExample';

// Run all examples
await runAllExamples();
```

### Individual Examples
```typescript
import { examples } from './services/SkillsDBExample';

// Run specific examples
await examples.basicUsage();
await examples.performanceTest();
await examples.errorHandling();
```

## Integration with Battle System

```typescript
class BattleSystem {
  constructor() {
    this.setupSkillListeners();
  }
  
  private setupSkillListeners() {
    skillsDB.on('skillUpdated', (skill) => {
      this.updateBattleUI(skill);
      this.recalculateDamage(skill);
    });
  }
  
  async useSkill(skillId: string, playerId: string) {
    const skill = await skillsDB.getSkill(skillId);
    // Battle logic here
    await skillsDB.updateSkill(skillId, {
      lastUsed: new Date().toISOString()
    }, playerId);
  }
}
```

## Best Practices

### 1. Initialize Early
```typescript
// Initialize SkillsDB early in your app lifecycle
await skillsDB.initialize();
```

### 2. Use Events for UI Updates
```typescript
// Listen to events for real-time UI updates
skillsDB.on('skillUpdated', (skill) => {
  updateSkillUI(skill);
});
```

### 3. Handle Errors Gracefully
```typescript
try {
  await skillsDB.createSkill(skillData);
} catch (error) {
  showErrorMessage(error.message);
}
```

### 4. Monitor Performance
```typescript
// Regularly check cache performance
const stats = skillsDB.getCacheStats();
if (stats.hitRate < 0.8) {
  console.warn('Low cache hit rate:', stats.hitRate);
}
```

### 5. Use Debug Mode in Development
```typescript
if (__DEV__) {
  skillsDB.enableDebug();
}
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check server URL and port
   - Verify network connectivity
   - Check firewall settings

2. **Low Cache Hit Rate**
   - Increase cache size if memory allows
   - Review query patterns
   - Check for memory leaks

3. **Slow Performance**
   - Enable debug mode to identify bottlenecks
   - Check cache statistics
   - Review batch settings

4. **Data Not Persisting**
   - Check AsyncStorage permissions
   - Verify persistence key is unique
   - Check storage quota

### Debug Commands
```typescript
// Get comprehensive debug info
const debugInfo = skillsDB.getDebugInfo();
console.log(debugInfo);

// Monitor cache performance
setInterval(() => {
  const stats = skillsDB.getCacheStats();
  console.log('Cache stats:', stats);
}, 5000);
```

## Migration from Previous Version

If you're upgrading from a previous version:

1. **Update Imports**
   ```typescript
   // Old
   import { SkillsDB } from './SkillsDB';
   
   // New
   import { skillsDB } from './SkillsDB';
   ```

2. **Update Initialization**
   ```typescript
   // Old
   const db = new SkillsDB();
   
   // New
   await skillsDB.initialize();
   ```

3. **Update Event Handling**
   ```typescript
   // Events are now available on the singleton instance
   skillsDB.on('skillUpdated', callback);
   ```

## Contributing

When contributing to SkillsDB:

1. Follow the existing code style
2. Add comprehensive tests
3. Update documentation
4. Consider performance implications
5. Test with large datasets

## License

This SkillsDB implementation is part of the TENSEI SLIME project and follows the same licensing terms.
