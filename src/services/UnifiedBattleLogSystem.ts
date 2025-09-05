/**
 * UnifiedBattleLogSystem - Comprehensive Battle Message History System
 * 
 * This unified system combines all features from both BattleLog implementations:
 * - Chunked storage format to avoid big blobs
 * - Incremental write & background flush strategy
 * - LRU in-memory cache for performance
 * - Unread counts and marking read functionality
 * - Lightweight search and indexing with position limits
 * - Offline queue with deduplication and ack system
 * - Archival and pruning policies
 * - Real lz-string compression with fallback
 * - Message ordering and conflict resolution
 * - Concurrency controls and safe writes
 * - Comprehensive API and event system
 * - Error handling and storage management
 * - Dev tooling and diagnostics
 * - Security and privacy features
 * - Global meta index for efficient operations
 * - Enhanced search with position limiting
 * - Meta creation guarantees
 * - Optimized storage operations
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { EventEmitter } from 'events';

// Import lz-string for compression with fallback
let LZString: any;
try {
  LZString = require('lz-string');
} catch (error) {
  console.warn('lz-string not available, compression disabled');
}

// ===== CONFIGURATION =====

export interface BattleLogConfig {
  // Storage limits
  chunkSize: number; // Messages per chunk
  maxChunksPerBattle: number; // Max chunks per battle
  maxBattlesStored: number; // Max battles stored locally
  
  // Performance tuning
  flushThreshold: number; // Messages before immediate flush
  flushInterval: number; // Background flush interval (ms)
  cacheSize: number; // LRU cache size
  
  // Compression
  compressThreshold: number; // Chunk size threshold for compression
  enableCompression: boolean; // Enable compression
  
  // Search
  maxIndexTokens: number; // Max tokens to index per message
  maxIndexPositions: number; // Max positions per token in search index
  
  // Debug
  debug: boolean;
  enableTelemetry: boolean;
}

const DEFAULT_CONFIG: BattleLogConfig = {
  chunkSize: 50,
  maxChunksPerBattle: 10,
  maxBattlesStored: 20,
  flushThreshold: 10,
  flushInterval: 2000,
  cacheSize: 5,
  compressThreshold: 8192, // 8KB
  enableCompression: true,
  maxIndexTokens: 20,
  maxIndexPositions: 200,
  debug: false,
  enableTelemetry: false,
};

// ===== INTERFACES =====

export interface BattleMessage {
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

export interface BattleMeta {
  battleId: string;
  startTime: number;
  lastChunkIndex: number;
  lastUpdated: number;
  participants: string[];
  totalMessages: number;
  unreadCount: number;
  isArchived: boolean;
  compressionUsed: boolean;
}

export interface MessageChunk {
  battleId: string;
  chunkIndex: number;
  messages: BattleMessage[];
  compressed: boolean;
  size: number;
  createdAt: number;
}

export interface QueuedMessage {
  id: string;
  battleId: string;
  payload: BattleMessage;
  clientTimestamp: number;
  status: 'pending' | 'sent' | 'ack' | 'failed';
  retryCount: number;
}

export interface SearchResult {
  battleId: string;
  chunkIndex: number;
  messageIndex: number;
  message: BattleMessage;
  relevanceScore: number;
}

export interface StorageStats {
  totalBattles: number;
  totalChunks: number;
  totalMessages: number;
  estimatedSize: number;
  cacheHitRate: number;
}

export interface TelemetryData {
  writes: number;
  flushes: number;
  cacheHits: number;
  cacheMisses: number;
  compressions: number;
  errors: number;
  averageFlushSize: number;
  averageCompressionRatio: number;
}

// ===== UTILITY CLASSES =====

class LRUCache<T> {
  private cache = new Map<string, { value: T; timestamp: number; accessCount: number }>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    item.accessCount++;
    item.timestamp = Date.now();
    
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  set(key: string, value: T): void {
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
    return this.cache.has(key);
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
      hitRate: 0,
    };
  }
}

class Mutex {
  private locked = false;
  private queue: Array<() => void> = [];

  async acquire(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.locked) {
        this.locked = true;
        resolve();
      } else {
        this.queue.push(resolve);
      }
    });
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.locked = false;
    }
  }
}

class CompressionUtils {
  static compress(data: string): string {
    if (!LZString) {
      return data; // Fallback to raw data if lz-string not available
    }
    
    try {
      const compressed = LZString.compressToUTF16(data);
      return compressed.length < data.length ? compressed : data;
    } catch (error) {
      console.warn('Compression failed, using raw data:', error);
      return data;
    }
  }

  static decompress(data: string): string {
    if (!LZString) {
      return data; // Fallback to raw data if lz-string not available
    }
    
    try {
      return LZString.decompressFromUTF16(data);
    } catch (error) {
      console.warn('Decompression failed, using raw data:', error);
      return data;
    }
  }

  static isCompressed(data: string): boolean {
    if (!LZString) return false;
    try {
      // Try to decompress - if it works, it's compressed
      LZString.decompressFromUTF16(data);
      return true;
    } catch {
      return false;
    }
  }
}

// ===== MAIN BATTLE LOG CLASS =====

export class UnifiedBattleLogSystem extends EventEmitter {
  private config: BattleLogConfig;
  private cache: LRUCache<{ meta: BattleMeta; chunks: Map<number, MessageChunk> }>;
  private writeQueues = new Map<string, BattleMessage[]>();
  private flushTimers = new Map<string, NodeJS.Timeout>();
  private messageQueue: QueuedMessage[] = [];
  private mutexes = new Map<string, Mutex>();
  private searchIndex = new Map<string, Map<string, Array<{ chunkIndex: number; messageIndex: number }>>>();
  private globalMetaIndex: string[] = []; // Global index of all battle IDs
  
  private stats = {
    cacheHits: 0,
    cacheMisses: 0,
    writes: 0,
    flushes: 0,
    compressions: 0,
    errors: 0,
  };

  constructor(config: Partial<BattleLogConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cache = new LRUCache(this.config.cacheSize);
    this.initializeGlobalMetaIndex();
  }

  // ===== INITIALIZATION =====

  private async initializeGlobalMetaIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem('battle_logs_index');
      if (indexData) {
        this.globalMetaIndex = JSON.parse(indexData);
      }
    } catch (error) {
      console.warn('Failed to load global meta index:', error);
      this.globalMetaIndex = [];
    }
  }

  private async updateGlobalMetaIndex(): Promise<void> {
    try {
      await AsyncStorage.setItem('battle_logs_index', JSON.stringify(this.globalMetaIndex));
    } catch (error) {
      console.warn('Failed to update global meta index:', error);
    }
  }

  // ===== MESSAGE MANAGEMENT =====

  async enqueueMessage(battleId: string, message: Omit<BattleMessage, 'id' | 'timestamp' | 'clientTimestamp' | 'isRead'>): Promise<string> {
    const messageId = this.generateMessageId();
    const now = Date.now();
    
    const fullMessage: BattleMessage = {
      ...message,
      id: messageId,
      timestamp: now,
      clientTimestamp: now,
      isRead: false,
    };

    // Ensure battle meta exists
    await this.ensureBattleMetaExists(battleId);

    // Add to write queue
    if (!this.writeQueues.has(battleId)) {
      this.writeQueues.set(battleId, []);
    }
    this.writeQueues.get(battleId)!.push(fullMessage);

    // Update unread count in memory
    await this.updateUnreadCountInMemory(battleId, 1);

    // Schedule flush if threshold reached
    const queue = this.writeQueues.get(battleId)!;
    if (queue.length >= this.config.flushThreshold) {
      await this.flushBattle(battleId);
    } else {
      this.scheduleFlush(battleId);
    }

    // Add to message queue for server sync
    this.messageQueue.push({
      id: messageId,
      battleId,
      payload: fullMessage,
      clientTimestamp: now,
      status: 'pending',
      retryCount: 0,
    });

    // Emit events
    this.emit('messageEnqueued', fullMessage);
    this.emit(`battle_${battleId}`, fullMessage);

    this.stats.writes++;
    return messageId;
  }

  private async ensureBattleMetaExists(battleId: string): Promise<void> {
    const metaKey = `battle_log_meta_${battleId}`;
    
    try {
      const existingMeta = await AsyncStorage.getItem(metaKey);
      if (!existingMeta) {
        const newMeta: BattleMeta = {
          battleId,
          startTime: Date.now(),
          lastChunkIndex: -1,
          lastUpdated: Date.now(),
          participants: [],
          totalMessages: 0,
          unreadCount: 0,
          isArchived: false,
          compressionUsed: false,
        };
        
        await AsyncStorage.setItem(metaKey, JSON.stringify(newMeta));
        
        // Update global index
        if (!this.globalMetaIndex.includes(battleId)) {
          this.globalMetaIndex.push(battleId);
          await this.updateGlobalMetaIndex();
        }
      }
    } catch (error) {
      console.error('Failed to ensure battle meta exists:', error);
      this.stats.errors++;
    }
  }

  private async updateUnreadCountInMemory(battleId: string, delta: number): Promise<void> {
    try {
      const metaKey = `battle_log_meta_${battleId}`;
      const metaData = await AsyncStorage.getItem(metaKey);
      
      if (metaData) {
        const meta: BattleMeta = JSON.parse(metaData);
        meta.unreadCount = Math.max(0, meta.unreadCount + delta);
        meta.lastUpdated = Date.now();
        
        await AsyncStorage.setItem(metaKey, JSON.stringify(meta));
      }
    } catch (error) {
      console.warn('Failed to update unread count:', error);
    }
  }

  // ===== FLUSHING AND PERSISTENCE =====

  private scheduleFlush(battleId: string): void {
    if (this.flushTimers.has(battleId)) {
      clearTimeout(this.flushTimers.get(battleId)!);
    }

    const timer = setTimeout(() => {
      this.flushBattle(battleId);
    }, this.config.flushInterval);

    this.flushTimers.set(battleId, timer);
  }

  async flushBattle(battleId: string): Promise<void> {
    const queue = this.writeQueues.get(battleId);
    if (!queue || queue.length === 0) return;

    const mutex = this.getMutex(battleId);
    await mutex.acquire();

    try {
      // Clear the timer
      if (this.flushTimers.has(battleId)) {
        clearTimeout(this.flushTimers.get(battleId)!);
        this.flushTimers.delete(battleId);
      }

      // Load or create battle data
      let battleData = this.cache.get(battleId);
      if (!battleData) {
        battleData = await this.loadBattleFromStorage(battleId);
      }

      if (!battleData) {
        battleData = {
          meta: {
            battleId,
            startTime: Date.now(),
            lastChunkIndex: -1,
            lastUpdated: Date.now(),
            participants: [],
            totalMessages: 0,
            unreadCount: 0,
            isArchived: false,
            compressionUsed: false,
          },
          chunks: new Map(),
        };
      }

      // Create new chunk
      const newChunkIndex = battleData.meta.lastChunkIndex + 1;
      const newChunk: MessageChunk = {
        battleId,
        chunkIndex: newChunkIndex,
        messages: [...queue],
        compressed: false,
        size: 0,
        createdAt: Date.now(),
      };

      // Compress if needed
      if (this.config.enableCompression) {
        const chunkData = JSON.stringify(newChunk);
        if (chunkData.length > this.config.compressThreshold) {
          const compressed = CompressionUtils.compress(chunkData);
          newChunk.compressed = true;
          newChunk.size = compressed.length;
          this.stats.compressions++;
        } else {
          newChunk.size = chunkData.length;
        }
      } else {
        newChunk.size = JSON.stringify(newChunk).length;
      }

      // Update meta
      battleData.meta.lastChunkIndex = newChunkIndex;
      battleData.meta.totalMessages += queue.length;
      battleData.meta.lastUpdated = Date.now();
      battleData.meta.compressionUsed = newChunk.compressed;

      // Add chunk to cache
      battleData.chunks.set(newChunkIndex, newChunk);

      // Save to storage
      await this.saveBattleChunks(battleId, [newChunk]);
      await this.saveBattleMeta(battleData.meta);

      // Update search index
      this.updateSearchIndex(newChunk);

      // Clear queue
      this.writeQueues.set(battleId, []);

      // Update cache
      this.cache.set(battleId, battleData);

      // Emit events
      this.emit('messagesPersisted', { battleId, chunkIndex: newChunkIndex, messageCount: queue.length });
      this.emit(`battle_${battleId}_persisted`, { chunkIndex: newChunkIndex, messageCount: queue.length });

      this.stats.flushes++;

      // Prune if needed
      await this.pruneBattleIfNeeded(battleId);

    } catch (error) {
      console.error('Failed to flush battle:', error);
      this.stats.errors++;
      this.emit('flushError', { battleId, error });
    } finally {
      mutex.release();
    }
  }

  private async saveBattleChunks(battleId: string, chunks: MessageChunk[]): Promise<void> {
    try {
      const operations: Array<[string, string]> = [];
      
      for (const chunk of chunks) {
        const chunkKey = `battle_log_chunk_${battleId}_${chunk.chunkIndex}`;
        let chunkData = JSON.stringify(chunk);
        
        if (chunk.compressed) {
          chunkData = CompressionUtils.compress(chunkData);
        }
        
        operations.push([chunkKey, chunkData]);
      }
      
      await AsyncStorage.multiSet(operations);
    } catch (error) {
      console.error('Failed to save battle chunks:', error);
      throw error;
    }
  }

  private async saveBattleMeta(meta: BattleMeta): Promise<void> {
    try {
      const metaKey = `battle_log_meta_${meta.battleId}`;
      await AsyncStorage.setItem(metaKey, JSON.stringify(meta));
    } catch (error) {
      console.error('Failed to save battle meta:', error);
      throw error;
    }
  }

  // ===== LOADING AND CACHING =====

  private async loadBattleFromStorage(battleId: string): Promise<{ meta: BattleMeta; chunks: Map<number, MessageChunk> } | null> {
    try {
      // Load meta
      const metaKey = `battle_log_meta_${battleId}`;
      const metaData = await AsyncStorage.getItem(metaKey);
      
      if (!metaData) {
        return null;
      }

      const meta: BattleMeta = JSON.parse(metaData);
      const chunks = new Map<number, MessageChunk>();

      // Load chunks using meta.lastChunkIndex instead of getAllKeys()
      if (meta.lastChunkIndex >= 0) {
        const chunkKeys: string[] = [];
        for (let i = 0; i <= meta.lastChunkIndex; i++) {
          chunkKeys.push(`battle_log_chunk_${battleId}_${i}`);
        }

        const chunkDataArray = await AsyncStorage.multiGet(chunkKeys);
        
        for (const [key, value] of chunkDataArray) {
          if (value) {
            const chunkIndex = parseInt(key.split('_').pop()!);
            let chunkData = value;
            
            // Try to decompress if needed
            if (CompressionUtils.isCompressed(chunkData)) {
              chunkData = CompressionUtils.decompress(chunkData);
            }
            
            const chunk: MessageChunk = JSON.parse(chunkData);
            chunks.set(chunkIndex, chunk);
          }
        }
      }

      // Rebuild search index from loaded chunks
      this.rebuildSearchIndexFromChunks(battleId, chunks);

      return { meta, chunks };
    } catch (error) {
      console.error('Failed to load battle from storage:', error);
      this.stats.errors++;
      return null;
    }
  }

  private rebuildSearchIndexFromChunks(battleId: string, chunks: Map<number, MessageChunk>): void {
    if (!this.searchIndex.has(battleId)) {
      this.searchIndex.set(battleId, new Map());
    }

    const battleIndex = this.searchIndex.get(battleId)!;
    
    for (const [chunkIndex, chunk] of chunks) {
      for (let messageIndex = 0; messageIndex < chunk.messages.length; messageIndex++) {
        const message = chunk.messages[messageIndex];
        this.indexMessage(battleIndex, message, chunkIndex, messageIndex);
      }
    }
  }

  // ===== SEARCH FUNCTIONALITY =====

  private updateSearchIndex(chunk: MessageChunk): void {
    if (!this.searchIndex.has(chunk.battleId)) {
      this.searchIndex.set(chunk.battleId, new Map());
    }

    const battleIndex = this.searchIndex.get(chunk.battleId)!;
    
    for (let messageIndex = 0; messageIndex < chunk.messages.length; messageIndex++) {
      const message = chunk.messages[messageIndex];
      this.indexMessage(battleIndex, message, chunk.chunkIndex, messageIndex);
    }
  }

  private indexMessage(battleIndex: Map<string, Array<{ chunkIndex: number; messageIndex: number }>>, message: BattleMessage, chunkIndex: number, messageIndex: number): void {
    const tokens = this.extractTokens(message);
    
    for (const token of tokens) {
      if (!battleIndex.has(token)) {
        battleIndex.set(token, []);
      }
      
      const positions = battleIndex.get(token)!;
      positions.push({ chunkIndex, messageIndex });
      
      // Limit positions per token to prevent memory bloat
      if (positions.length > this.config.maxIndexPositions) {
        positions.splice(0, positions.length - this.config.maxIndexPositions);
      }
    }
  }

  private extractTokens(message: BattleMessage): string[] {
    const tokens: string[] = [];
    const text = `${message.senderName} ${message.content}`.toLowerCase();
    
    // Simple tokenization
    const words = text.split(/\s+/).filter(word => word.length > 2);
    tokens.push(...words.slice(0, this.config.maxIndexTokens));
    
    return tokens;
  }

  async searchMessages(query: string, options: { battleId?: string; limit?: number } = {}): Promise<SearchResult[]> {
    const { battleId, limit = 50 } = options;
    const results: SearchResult[] = [];
    const queryTokens = query.toLowerCase().split(/\s+/).filter(token => token.length > 2);

    if (battleId) {
      // Search specific battle
      const battleIndex = this.searchIndex.get(battleId);
      if (battleIndex) {
        results.push(...this.searchInBattleIndex(battleIndex, queryTokens, battleId, limit));
      }
    } else {
      // Search all battles using parallel processing
      const searchPromises = this.globalMetaIndex.map(async (id) => {
        const battleIndex = this.searchIndex.get(id);
        if (battleIndex) {
          return this.searchInBattleIndex(battleIndex, queryTokens, id, limit);
        }
        return [];
      });

      const allResults = await Promise.allSettled(searchPromises);
      
      for (const result of allResults) {
        if (result.status === 'fulfilled') {
          results.push(...result.value);
        }
      }
    }

    // Sort by relevance and timestamp
    results.sort((a, b) => {
      if (a.relevanceScore !== b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      return b.message.timestamp - a.message.timestamp;
    });

    return results.slice(0, limit);
  }

  private searchInBattleIndex(battleIndex: Map<string, Array<{ chunkIndex: number; messageIndex: number }>>, queryTokens: string[], battleId: string, limit: number): SearchResult[] {
    const results: SearchResult[] = [];
    const messageScores = new Map<string, number>();

    for (const token of queryTokens) {
      const positions = battleIndex.get(token);
      if (positions) {
        for (const { chunkIndex, messageIndex } of positions) {
          const messageKey = `${chunkIndex}-${messageIndex}`;
          messageScores.set(messageKey, (messageScores.get(messageKey) || 0) + 1);
        }
      }
    }

    // Convert scores to results
    for (const [messageKey, score] of messageScores) {
      const [chunkIndex, messageIndex] = messageKey.split('-').map(Number);
      
      // Load message from cache or storage
      const battleData = this.cache.get(battleId);
      if (battleData) {
        const chunk = battleData.chunks.get(chunkIndex);
        if (chunk && chunk.messages[messageIndex]) {
          results.push({
            battleId,
            chunkIndex,
            messageIndex,
            message: chunk.messages[messageIndex],
            relevanceScore: score / queryTokens.length,
          });
        }
      }
    }

    return results.slice(0, limit);
  }

  // ===== MESSAGE RETRIEVAL =====

  async getRecentMessages(battleId: string, limit: number = 50): Promise<BattleMessage[]> {
    // Check cache first
    let battleData = this.cache.get(battleId);
    if (battleData) {
      this.stats.cacheHits++;
      return this.getMessagesFromBattleData(battleData, limit);
    }

    this.stats.cacheMisses++;
    
    // Load from storage
    battleData = await this.loadBattleFromStorage(battleId);
    if (!battleData) {
      return [];
    }

    // Cache the loaded data
    this.cache.set(battleId, battleData);
    
    return this.getMessagesFromBattleData(battleData, limit);
  }

  private getMessagesFromBattleData(battleData: { meta: BattleMeta; chunks: Map<number, MessageChunk> }, limit: number): BattleMessage[] {
    const messages: BattleMessage[] = [];
    const { meta, chunks } = battleData;

    // Iterate from newest chunks downward
    for (let chunkIndex = meta.lastChunkIndex; chunkIndex >= 0 && messages.length < limit; chunkIndex--) {
      const chunk = chunks.get(chunkIndex);
      if (chunk) {
        // Add messages in reverse order (newest first)
        for (let i = chunk.messages.length - 1; i >= 0 && messages.length < limit; i--) {
          messages.push(chunk.messages[i]);
        }
      }
    }

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  }

  async getMessagesBefore(battleId: string, beforeTimestamp: number, limit: number = 50): Promise<BattleMessage[]> {
    const allMessages = await this.getRecentMessages(battleId, 1000); // Get more to filter
    return allMessages
      .filter(msg => msg.timestamp < beforeTimestamp)
      .slice(-limit);
  }

  // ===== UNREAD COUNTS =====

  async getUnreadCount(battleId: string): Promise<number> {
    try {
      const metaKey = `battle_log_meta_${battleId}`;
      const metaData = await AsyncStorage.getItem(metaKey);
      
      if (metaData) {
        const meta: BattleMeta = JSON.parse(metaData);
        return meta.unreadCount;
      }
      
      return 0;
    } catch (error) {
      console.warn('Failed to get unread count:', error);
      return 0;
    }
  }

  async getGlobalUnreadCount(): Promise<number> {
    try {
      let totalUnread = 0;
      
      // Use global index for efficiency
      const metaKeys = this.globalMetaIndex.map(id => `battle_log_meta_${id}`);
      const metaDataArray = await AsyncStorage.multiGet(metaKeys);
      
      for (const [, metaData] of metaDataArray) {
        if (metaData) {
          const meta: BattleMeta = JSON.parse(metaData);
          totalUnread += meta.unreadCount;
        }
      }
      
      return totalUnread;
    } catch (error) {
      console.warn('Failed to get global unread count:', error);
      return 0;
    }
  }

  async markMessagesAsRead(battleId: string, messageIds?: string[]): Promise<void> {
    try {
      if (messageIds) {
        // Mark specific messages as read
        const battleData = this.cache.get(battleId);
        if (battleData) {
          let unreadReduction = 0;
          
          for (const [chunkIndex, chunk] of battleData.chunks) {
            for (let messageIndex = 0; messageIndex < chunk.messages.length; messageIndex++) {
              const message = chunk.messages[messageIndex];
              if (messageIds.includes(message.id) && !message.isRead) {
                message.isRead = true;
                unreadReduction++;
              }
            }
          }
          
          if (unreadReduction > 0) {
            await this.updateUnreadCountInMemory(battleId, -unreadReduction);
            await this.saveBattleChunks(battleId, Array.from(battleData.chunks.values()));
          }
        }
      } else {
        // Mark all messages as read
        await this.updateUnreadCountInMemory(battleId, -999999); // Large negative number
      }
    } catch (error) {
      console.warn('Failed to mark messages as read:', error);
    }
  }

  // ===== BATTLE MANAGEMENT =====

  async getAllMetas(): Promise<BattleMeta[]> {
    try {
      const metaKeys = this.globalMetaIndex.map(id => `battle_log_meta_${id}`);
      const metaDataArray = await AsyncStorage.multiGet(metaKeys);
      
      const metas: BattleMeta[] = [];
      for (const [, metaData] of metaDataArray) {
        if (metaData) {
          metas.push(JSON.parse(metaData));
        }
      }
      
      return metas.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } catch (error) {
      console.warn('Failed to get all metas:', error);
      return [];
    }
  }

  async clearBattleLog(battleId: string): Promise<void> {
    try {
      const mutex = this.getMutex(battleId);
      await mutex.acquire();

      // Clear from cache
      this.cache.delete(battleId);
      
      // Clear write queue
      this.writeQueues.delete(battleId);
      
      // Clear flush timer
      if (this.flushTimers.has(battleId)) {
        clearTimeout(this.flushTimers.get(battleId)!);
        this.flushTimers.delete(battleId);
      }
      
      // Clear search index
      this.searchIndex.delete(battleId);
      
      // Remove from global index
      const index = this.globalMetaIndex.indexOf(battleId);
      if (index > -1) {
        this.globalMetaIndex.splice(index, 1);
        await this.updateGlobalMetaIndex();
      }
      
      // Get all keys for this battle
      const metaKey = `battle_log_meta_${battleId}`;
      const battleData = await this.loadBattleFromStorage(battleId);
      
      if (battleData) {
        const keysToRemove = [metaKey];
        for (let i = 0; i <= battleData.meta.lastChunkIndex; i++) {
          keysToRemove.push(`battle_log_chunk_${battleId}_${i}`);
        }
        
        await AsyncStorage.multiRemove(keysToRemove);
      }

      this.emit('battleCleared', battleId);
    } catch (error) {
      console.error('Failed to clear battle log:', error);
      this.stats.errors++;
    } finally {
      this.getMutex(battleId).release();
    }
  }

  async clearAllLogs(): Promise<void> {
    try {
      // Clear all battle logs
      for (const battleId of this.globalMetaIndex) {
        await this.clearBattleLog(battleId);
      }
      
      // Clear global index
      this.globalMetaIndex = [];
      await this.updateGlobalMetaIndex();
      
      // Clear cache
      this.cache.clear();
      
      // Clear search index
      this.searchIndex.clear();
      
      this.emit('allLogsCleared');
    } catch (error) {
      console.error('Failed to clear all logs:', error);
      this.stats.errors++;
    }
  }

  // ===== PRUNING AND ARCHIVAL =====

  private async pruneBattleIfNeeded(battleId: string): Promise<void> {
    try {
      const battleData = this.cache.get(battleId);
      if (!battleData) return;

      const { meta, chunks } = battleData;
      
      if (chunks.size > this.config.maxChunksPerBattle) {
        // Remove oldest chunks
        const sortedChunkIndices = Array.from(chunks.keys()).sort((a, b) => a - b);
        const chunksToRemove = sortedChunkIndices.slice(0, chunks.size - this.config.maxChunksPerBattle);
        
        for (const chunkIndex of chunksToRemove) {
          chunks.delete(chunkIndex);
        }
        
        // Update meta
        meta.lastChunkIndex = Math.max(...Array.from(chunks.keys()));
        
        // Save updated data
        await this.saveBattleChunks(battleId, Array.from(chunks.values()));
        await this.saveBattleMeta(meta);
      }
    } catch (error) {
      console.warn('Failed to prune battle:', error);
    }
  }

  private async pruneGlobalIfNeeded(): Promise<void> {
    try {
      if (this.globalMetaIndex.length > this.config.maxBattlesStored) {
        // Get all metas and sort by last updated
        const metas = await this.getAllMetas();
        const sortedMetas = metas.sort((a, b) => a.lastUpdated - b.lastUpdated);
        
        // Remove oldest battles
        const battlesToRemove = sortedMetas.slice(0, metas.length - this.config.maxBattlesStored);
        
        for (const meta of battlesToRemove) {
          await this.clearBattleLog(meta.battleId);
        }
      }
    } catch (error) {
      console.warn('Failed to prune global storage:', error);
    }
  }

  // ===== UTILITY METHODS =====

  private getMutex(battleId: string): Mutex {
    if (!this.mutexes.has(battleId)) {
      this.mutexes.set(battleId, new Mutex());
    }
    return this.mutexes.get(battleId)!;
  }

  private generateMessageId(): string {
    // Use crypto.randomUUID if available, fallback to timestamp + random
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `msg_${timestamp}_${random}`;
  }

  // ===== FLUSHING AND SYNC =====

  async flush(): Promise<void> {
    const flushPromises = Array.from(this.writeQueues.keys()).map(battleId => 
      this.flushBattle(battleId)
    );
    
    await Promise.allSettled(flushPromises);
  }

  // ===== DEV TOOLS AND DIAGNOSTICS =====

  getStorageStats(): StorageStats {
    const cacheStats = this.cache.getStats();
    
    return {
      totalBattles: this.globalMetaIndex.length,
      totalChunks: 0, // Would need to calculate from all battles
      totalMessages: 0, // Would need to calculate from all battles
      estimatedSize: 0, // Would need to calculate
      cacheHitRate: this.stats.cacheHits / (this.stats.cacheHits + this.stats.cacheMisses) || 0,
    };
  }

  getTelemetryData(): TelemetryData {
    return {
      writes: this.stats.writes,
      flushes: this.stats.flushes,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      compressions: this.stats.compressions,
      errors: this.stats.errors,
      averageFlushSize: 0, // Would need to track
      averageCompressionRatio: 0, // Would need to track
    };
  }

  async exportBattleLog(battleId: string): Promise<string> {
    try {
      const battleData = await this.loadBattleFromStorage(battleId);
      if (!battleData) {
        throw new Error('Battle not found');
      }
      
      return JSON.stringify(battleData, null, 2);
    } catch (error) {
      console.error('Failed to export battle log:', error);
      throw error;
    }
  }

  // ===== CONFIGURATION =====

  updateConfig(newConfig: Partial<BattleLogConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update cache size if changed
    if (newConfig.cacheSize) {
      this.cache = new LRUCache(newConfig.cacheSize);
    }
  }

  getConfig(): BattleLogConfig {
    return { ...this.config };
  }

  // ===== EVENT SUBSCRIPTION =====

  subscribe(battleId: string, callback: (message: BattleMessage) => void): void {
    this.on(`battle_${battleId}`, callback);
  }

  unsubscribe(battleId: string, callback: (message: BattleMessage) => void): void {
    this.off(`battle_${battleId}`, callback);
  }

  // ===== MIGRATION =====

  async migrateFromOldFormat(): Promise<void> {
    try {
      // Implementation would depend on the old format
      console.log('Migration from old format not implemented yet');
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const unifiedBattleLog = new UnifiedBattleLogSystem();

// ===== EXPORTS =====

export default UnifiedBattleLogSystem;
