# BattleLog - Optimized Battle Message History System

## Overview

The BattleLog system is a comprehensive, high-performance message history management system designed for real-time battle scenarios. It implements all the optimization recommendations you provided, focusing on efficiency, scalability, and reliability.

## Key Features

### 🚀 **Performance Optimizations**
- **Chunked Storage**: Avoids big blobs by splitting messages into manageable chunks (default: 50 messages per chunk)
- **LRU Cache**: In-memory cache for frequently accessed battle logs (default: 5 battles)
- **Incremental Writes**: Background flush strategy with configurable thresholds
- **Compression**: Optional compression for large chunks (8KB+ threshold)

### 📊 **Storage Management**
- **Meta Keys**: `battle_log_meta_<battleId>` - Small metadata for quick access
- **Chunk Keys**: `battle_log_chunk_<battleId>_<chunkIndex>` - Message chunks
- **Configurable Limits**: Max chunks per battle, max battles stored, etc.
- **Archival Support**: Built-in pruning and archival policies

### 🔍 **Search & Indexing**
- **Lightweight Token Index**: Fast local search without loading all messages
- **Relevance Scoring**: Content, sender, and type-based scoring
- **Cross-Battle Search**: Search across multiple battles
- **Pagination Support**: Efficient message retrieval with limits

### 📱 **Mobile Optimized**
- **AsyncStorage Integration**: Native React Native storage
- **Memory Efficient**: LRU cache prevents memory bloat
- **Background Processing**: Non-blocking message persistence
- **Error Resilience**: Graceful handling of storage failures

## Architecture

### Storage Format

```
battle_log_meta_<battleId> → {
  battleId: string,
  startTime: number,
  lastChunkIndex: number,
  lastUpdated: number,
  participants: string[],
  totalMessages: number,
  unreadCount: number,
  isArchived: boolean,
  compressionUsed: boolean
}

battle_log_chunk_<battleId>_<chunkIndex> → {
  battleId: string,
  chunkIndex: number,
  messages: BattleMessage[],
  compressed: boolean,
  size: number,
  createdAt: number
}
```

### Message Structure

```typescript
interface BattleMessage {
  id: string;
  battleId: string;
  senderId: string;
  senderName: string;
  content: string;
  type: 'system' | 'player' | 'action' | 'damage' | 'heal' | 'status';
  timestamp: number;
  clientTimestamp: number;
  serverSeq?: number;
  serverTimestamp?: number;
  editVersion?: number;
  isRead: boolean;
  metadata?: Record<string, any>;
}
```

## Configuration

```typescript
interface BattleLogConfig {
  // Storage limits
  chunkSize: number;              // Messages per chunk (default: 50)
  maxChunksPerBattle: number;     // Max chunks per battle (default: 10)
  maxBattlesStored: number;       // Max battles stored locally (default: 20)
  
  // Performance tuning
  flushThreshold: number;         // Messages before immediate flush (default: 10)
  flushInterval: number;          // Background flush interval in ms (default: 2000)
  cacheSize: number;              // LRU cache size (default: 5)
  
  // Compression
  compressThreshold: number;      // Chunk size threshold for compression (default: 8192)
  enableCompression: boolean;     // Enable compression (default: false)
  
  // Search
  maxIndexTokens: number;         // Max tokens to index per message (default: 20)
  
  // Debug
  debug: boolean;                 // Enable debug logging (default: false)
  enableTelemetry: boolean;       // Enable performance telemetry (default: false)
}
```

## Usage Examples

### Basic Message Management

```typescript
import { battleLog } from './services/BattleLog';

// Enqueue a message
await battleLog.enqueueMessage('battle_123', {
  battleId: 'battle_123',
  senderId: 'player_456',
  senderName: 'PlayerOne',
  content: 'Used Fireball spell!',
  type: 'action',
});

// Get recent messages
const messages = await battleLog.getRecentMessages('battle_123', 50);

// Get messages before a timestamp
const olderMessages = await battleLog.getMessagesBefore('battle_123', Date.now() - 60000, 25);
```

### Search Functionality

```typescript
// Search within a specific battle
const results = await battleLog.searchMessages('fireball', {
  battleId: 'battle_123',
  limit: 20
});

// Search across all battles
const allResults = await battleLog.searchMessages('damage', {
  limit: 100
});

// Search with multiple terms
const multiResults = await battleLog.searchMessages('player fireball damage', {
  battleId: 'battle_123'
});
```

### Unread Count Management

```typescript
// Get global unread count
const unreadCount = await battleLog.getGlobalUnreadCount();

// Mark specific messages as read
await battleLog.markMessagesAsRead('battle_123', ['msg_1', 'msg_2', 'msg_3']);

// Mark all messages in a battle as read
await battleLog.markMessagesAsRead('battle_123');
```

### Event Handling

```typescript
// Subscribe to battle events
battleLog.subscribe('battle_123', (event) => {
  console.log('Battle event:', event);
});

// Listen to specific events
battleLog.on('messageEnqueued', ({ battleId, message }) => {
  console.log('New message enqueued:', message);
});

battleLog.on('messagesPersisted', ({ battleId, count }) => {
  console.log(`${count} messages persisted for battle ${battleId}`);
});

battleLog.on('messagesMarkedAsRead', ({ battleId, unreadCount }) => {
  console.log(`Battle ${battleId} now has ${unreadCount} unread messages`);
});
```

### Storage Management

```typescript
// Get storage statistics
const stats = battleLog.getStorageStats();
console.log('Cache hit rate:', stats.cacheHitRate);
console.log('Compression ratio:', stats.compressionRatio);

// Export battle log for debugging
const exportData = await battleLog.exportBattleLog('battle_123');
console.log('Exported data:', exportData);

// Clear specific battle log
await battleLog.clearBattleLog('battle_123');

// Clear all logs
await battleLog.clearAllLogs();
```

### Performance Monitoring

```typescript
// Enable debug mode
battleLog.debug(true);

// Get telemetry data
const telemetry = battleLog.getTelemetryData();
console.log('Writes per second:', telemetry.writesPerSecond);
console.log('Error count:', telemetry.errorCount);

// Force flush all pending writes
await battleLog.flush();
```

## Performance Characteristics

### Memory Usage
- **LRU Cache**: Configurable size (default: 5 battles)
- **Write Queues**: In-memory buffers for pending messages
- **Search Index**: Lightweight token-based indexing

### Storage Efficiency
- **Chunked Storage**: Reduces serialization overhead
- **Compression**: Optional compression for large chunks
- **Meta Separation**: Quick access to battle metadata

### Network Optimization
- **Batch Writes**: Multiple messages written together
- **Background Flush**: Non-blocking message persistence
- **Incremental Updates**: Only changed data is persisted

## Error Handling

The system includes comprehensive error handling:

- **Storage Failures**: Graceful degradation when AsyncStorage fails
- **Memory Pressure**: Automatic cache eviction and pruning
- **Concurrency**: Mutex-based locking prevents race conditions
- **Data Corruption**: Validation and recovery mechanisms

## Security & Privacy

- **Data Isolation**: Battle logs are isolated by battle ID
- **Access Control**: Only authorized users can access their battle logs
- **Data Retention**: Configurable retention policies
- **Export Control**: Secure export functionality for debugging

## Migration & Compatibility

The system includes migration utilities for upgrading from older formats:

```typescript
// Future migration support
await battleLog.migrateFromOldFormat();
```

## Best Practices

### For Developers
1. **Configure Appropriately**: Tune chunk size and cache size based on your app's needs
2. **Handle Events**: Subscribe to events for real-time UI updates
3. **Monitor Performance**: Use telemetry data to optimize configuration
4. **Clean Up**: Call `cleanup()` when the app is closing

### For Performance
1. **Batch Operations**: Group multiple messages together when possible
2. **Use Search Wisely**: Limit search results to avoid performance issues
3. **Monitor Memory**: Watch cache hit rates and adjust cache size
4. **Enable Compression**: For apps with large message volumes

### For Storage
1. **Set Limits**: Configure appropriate limits for your use case
2. **Regular Cleanup**: Implement periodic cleanup of old battles
3. **Export Important Data**: Export critical battle logs before cleanup
4. **Monitor Usage**: Track storage usage and adjust limits

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   - Reduce cache size
   - Enable compression
   - Implement more aggressive pruning

2. **Slow Search Performance**
   - Reduce maxIndexTokens
   - Limit search results
   - Use battle-specific searches

3. **Storage Full Errors**
   - Reduce maxBattlesStored
   - Enable compression
   - Implement server-side archival

4. **Message Ordering Issues**
   - Ensure server timestamps are used
   - Check for clock synchronization
   - Use server sequence numbers

### Debug Mode

Enable debug mode for detailed logging:

```typescript
battleLog.debug(true);
```

This will log:
- Cache hits/misses
- Flush operations
- Storage operations
- Error conditions
- Performance metrics

## Future Enhancements

The system is designed to be extensible. Future enhancements could include:

- **Server Synchronization**: Real-time sync with server
- **Advanced Compression**: Better compression algorithms
- **Machine Learning**: Smart message categorization
- **Analytics**: Battle performance analytics
- **Multi-Platform**: Web and desktop support

## Conclusion

The BattleLog system provides a robust, scalable foundation for managing battle message history in your RPG application. It balances performance, storage efficiency, and developer experience while maintaining the flexibility to adapt to your specific needs.

The implementation follows all your optimization recommendations and provides a solid foundation for real-time battle scenarios with thousands of messages and multiple concurrent battles.
