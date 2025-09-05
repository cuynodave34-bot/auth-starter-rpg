/**
 * Advanced SkillsDB Components
 * 
 * This file contains the advanced components for SkillsDB including:
 * - LRU Cache implementation
 * - WebSocket Manager with batching and debouncing
 * - Advanced caching strategies
 */

import { EventEmitter } from 'events';
import { Skill, SkillUpdate, SkillSummary, SkillEngineData } from './SkillsDB';

// LRU Cache Implementation
export class LRUCache<T> {
  private cache = new Map<string, T>();
  private accessOrder = new Map<string, number>();
  private accessCounter = 0;
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    if (this.cache.has(key)) {
      this.accessOrder.set(key, ++this.accessCounter);
      return this.cache.get(key);
    }
    return undefined;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
      this.accessOrder.set(key, ++this.accessCounter);
    } else {
      if (this.cache.size >= this.maxSize) {
        this.evictLRU();
      }
      this.cache.set(key, value);
      this.accessOrder.set(key, ++this.accessCounter);
    }
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  size(): number {
    return this.cache.size;
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, access] of this.accessOrder) {
      if (access < oldestAccess) {
        oldestAccess = access;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
    }
  }

  getStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// WebSocket Manager with Batching and Debouncing
export class WebSocketManager extends EventEmitter {
  private ws: WebSocket | null = null;
  private config: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    batchInterval: number;
    debounceDelay: number;
  };
  private isConnected = false;
  private reconnectAttempts = 0;
  private batchQueue: SkillUpdate[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private pendingAcks = new Map<string, { resolve: Function; reject: Function; timestamp: number }>();

  constructor(config: {
    url: string;
    reconnectInterval: number;
    maxReconnectAttempts: number;
    batchInterval: number;
    debounceDelay: number;
  }) {
    super();
    this.config = config;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        
        this.ws.onopen = () => {
          this.isConnected = true;
          this.reconnectAttempts = 0;
          this.emit('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this.handleMessage(data);
          } catch (error) {
            this.emit('error', new Error('Failed to parse WebSocket message'));
          }
        };

        this.ws.onclose = () => {
          this.isConnected = false;
          this.emit('disconnected');
          this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          this.emit('error', error);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private handleMessage(data: any): void {
    switch (data.type) {
      case 'skillUpdate':
        this.emit('skillUpdate', data.payload);
        break;
      case 'ack':
        this.handleAck(data.id, data.success);
        break;
      case 'error':
        this.emit('error', new Error(data.message));
        break;
    }
  }

  private handleAck(id: string, success: boolean): void {
    const pending = this.pendingAcks.get(id);
    if (pending) {
      this.pendingAcks.delete(id);
      if (success) {
        pending.resolve();
      } else {
        pending.reject(new Error('Server rejected update'));
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts < this.config.maxReconnectAttempts) {
      setTimeout(() => {
        this.reconnectAttempts++;
        this.connect().catch(() => {
          // Reconnect failed, will try again
        });
      }, this.config.reconnectInterval);
    }
  }

  sendUpdate(update: SkillUpdate): Promise<void> {
    return new Promise((resolve, reject) => {
      const id = `${update.skillId}_${Date.now()}`;
      
      // Debounce rapid updates
      const existingTimer = this.debounceTimers.get(update.skillId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        this.debounceTimers.delete(update.skillId);
        this.batchUpdate(update, id, resolve, reject);
      }, this.config.debounceDelay);

      this.debounceTimers.set(update.skillId, timer);
    });
  }

  private batchUpdate(update: SkillUpdate, id: string, resolve: Function, reject: Function): void {
    this.batchQueue.push(update);
    this.pendingAcks.set(id, { resolve, reject, timestamp: Date.now() });

    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.flushBatch();
      }, this.config.batchInterval);
    }
  }

  private flushBatch(): void {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        type: 'batchUpdate',
        payload: batch,
        timestamp: Date.now(),
      }));
    } else {
      // Queue for later when reconnected
      this.batchQueue.unshift(...batch);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Advanced SkillsDB with all optimizations
export class AdvancedSkillsDB extends EventEmitter {
  private cache: LRUCache<Skill>;
  private ownerIndex = new Map<string, Set<string>>();
  private categoryIndex = new Map<string, Set<string>>();
  private wsManager: WebSocketManager;
  private isInitialized = false;
  private stats = { hits: 0, misses: 0 };
  private config: {
    maxCacheSize: number;
    persistenceKey: string;
    wsConfig: {
      url: string;
      reconnectInterval: number;
      maxReconnectAttempts: number;
      batchInterval: number;
      debounceDelay: number;
    };
    debug: boolean;
  };

  constructor(config: any) {
    super();
    this.config = config;
    this.cache = new LRUCache<Skill>(config.maxCacheSize);
    this.wsManager = new WebSocketManager(config.wsConfig);
    this.setupWebSocketHandlers();
  }

  private setupWebSocketHandlers(): void {
    this.wsManager.on('connected', () => {
      this.emit('connected');
      this.log('WebSocket connected');
    });

    this.wsManager.on('disconnected', () => {
      this.emit('disconnected');
      this.log('WebSocket disconnected');
    });

    this.wsManager.on('skillUpdate', (update: SkillUpdate) => {
      this.handleRemoteUpdate(update);
    });

    this.wsManager.on('error', (error: Error) => {
      this.emit('error', error);
      this.log('WebSocket error:', error.message);
    });
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Load from persistent storage
      await this.loadFromStorage();
      
      // Connect to WebSocket
      await this.wsManager.connect();
      
      this.isInitialized = true;
      this.emit('initialized');
      this.log('AdvancedSkillsDB initialized successfully');
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  private async loadFromStorage(): Promise<void> {
    // Implementation would be similar to the main SkillsDB
    this.log('Loading from storage...');
  }

  private async saveToStorage(): Promise<void> {
    // Implementation would be similar to the main SkillsDB
    this.log('Saving to storage...');
  }

  private handleRemoteUpdate(update: SkillUpdate): void {
    const existingSkill = this.cache.get(update.skillId);
    
    if (existingSkill && existingSkill.engineData?.version && existingSkill.engineData.version >= update.version) {
      // Ignore older updates
      return;
    }

    if (existingSkill) {
      // Update existing skill
      const updatedSkill: Skill = {
        ...existingSkill,
        ...update.data,
        engineData: existingSkill.engineData ? {
          ...existingSkill.engineData,
          version: update.version,
        } : undefined,
        summary: {
          ...existingSkill.summary,
          ...update.data,
        },
      };
      this.cache.set(update.skillId, updatedSkill);
      this.updateIndexes(updatedSkill, 'update', existingSkill);
      this.emit('skillUpdated', updatedSkill);
    } else {
      // New skill from remote
      const newSkill: Skill = {
        summary: update.data as SkillSummary,
        engineData: {
          ...(update.data as SkillEngineData),
          version: update.version,
        },
      };
      this.cache.set(update.skillId, newSkill);
      this.updateIndexes(newSkill, 'add');
      this.emit('skillCreated', newSkill);
    }

    this.saveToStorage();
  }

  private updateIndexes(skill: Skill, operation: 'add' | 'update' | 'remove', oldSkill?: Skill): void {
    // Implementation similar to main SkillsDB
  }

  private log(...args: any[]): void {
    if (this.config.debug) {
      console.log('[AdvancedSkillsDB]', ...args);
    }
  }

  getCacheStats(): any {
    const hitRate = this.stats.hits + this.stats.misses > 0 
      ? this.stats.hits / (this.stats.hits + this.stats.misses) 
      : 0;

    return {
      ...this.cache.getStats(),
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  async disconnect(): Promise<void> {
    this.wsManager.disconnect();
    this.isInitialized = false;
  }
}
