/**
 * SkillWebSocketManager - Network Optimization for Skill System
 * 
 * This file implements network optimization features for the skill system:
 * - Batch outgoing events: collect updates and flush every X ms
 * - Debounce rapid updates to avoid flooding
 * - Ack system: Wait for server acknowledgment before finalizing updates
 * - Diff-based sync: Only send changed data, not entire skill sets
 * - Retry logic for failed sends
 * - Queue messages when offline → auto-send once reconnected
 * - Event system for external consumers
 * 
 * This manager handles all WebSocket communication for the skill system
 * and provides optimized network usage with minimal bandwidth consumption.
 */

import { EventEmitter } from 'events';
import { skillsDB, SkillUpdate, BatchUpdate } from './SkillsDB';

// WebSocket Configuration
export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  batchInterval: number;
  debounceDelay: number;
  enableDiffSync: boolean;
  enableAckSystem: boolean;
  enableRetryLogic: boolean;
  maxRetryAttempts: number;
  retryDelay: number;
}

// Message Types
export interface WebSocketMessage {
  type: 'skill_update' | 'batch_update' | 'ack' | 'sync_request' | 'sync_response' | 'error';
  data: any;
  messageId: string;
  timestamp: string;
  requiresAck?: boolean;
}

export interface AckMessage {
  messageId: string;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface QueuedMessage {
  message: WebSocketMessage;
  retryCount: number;
  queuedAt: string;
  priority: 'high' | 'medium' | 'low';
}

// Connection State
export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  reconnectAttempts: number;
  lastConnectedAt?: string;
  lastDisconnectedAt?: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

// Performance Statistics
export interface NetworkStats {
  messagesSent: number;
  messagesReceived: number;
  messagesQueued: number;
  messagesFailed: number;
  batchUpdatesSent: number;
  diffUpdatesSent: number;
  averageLatency: number;
  bandwidthSaved: number; // bytes saved through batching/diff sync
  uptime: number; // seconds
}

const DEFAULT_CONFIG: WebSocketConfig = {
  url: 'ws://localhost:8080/skills',
  reconnectInterval: 3000,
  maxReconnectAttempts: 5,
  batchInterval: 200,
  debounceDelay: 100,
  enableDiffSync: true,
  enableAckSystem: true,
  enableRetryLogic: true,
  maxRetryAttempts: 3,
  retryDelay: 1000,
};

export class SkillWebSocketManager extends EventEmitter {
  private config: WebSocketConfig;
  private ws?: WebSocket;
  private connectionState: ConnectionState;
  private networkStats: NetworkStats;
  
  // Batching and Debouncing
  private pendingUpdates: SkillUpdate[] = [];
  private batchTimer?: NodeJS.Timeout;
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  
  // Message Queue and Ack System
  private messageQueue: QueuedMessage[] = [];
  private pendingAcks = new Map<string, { message: WebSocketMessage; timestamp: number }>();
  private messageIdCounter = 0;
  
  // Performance Tracking
  private startTime = Date.now();
  private latencyMeasurements: number[] = [];

  constructor(config: Partial<WebSocketConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.connectionState = this.initializeConnectionState();
    this.networkStats = this.initializeNetworkStats();
  }

  // ===== CONNECTION MANAGEMENT =====

  async connect(): Promise<void> {
    if (this.connectionState.isConnected || this.connectionState.isConnecting) {
      return;
    }

    try {
      this.connectionState.isConnecting = true;
      this.emit('connecting');

      this.ws = new WebSocket(this.config.url);
      
      this.ws.onopen = this.handleOpen.bind(this);
      this.ws.onmessage = this.handleMessage.bind(this);
      this.ws.onclose = this.handleClose.bind(this);
      this.ws.onerror = this.handleError.bind(this);

    } catch (error) {
      this.connectionState.isConnecting = false;
      this.emit('error', error);
      throw error;
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.emit('disconnected');
  }

  private handleOpen(): void {
    this.connectionState.isConnected = true;
    this.connectionState.isConnecting = false;
    this.connectionState.reconnectAttempts = 0;
    this.connectionState.lastConnectedAt = new Date().toISOString();
    this.connectionState.connectionQuality = 'excellent';

    this.emit('connected');
    this.startBatchTimer();
    this.processMessageQueue();

    console.log('🔌 WebSocket connected to skill server');
  }

  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      this.networkStats.messagesReceived++;
      
      this.emit('message', message);

      switch (message.type) {
        case 'ack':
          this.handleAck(message.data as AckMessage);
          break;
        case 'skill_update':
          this.handleSkillUpdate(message.data);
          break;
        case 'batch_update':
          this.handleBatchUpdate(message.data);
          break;
        case 'sync_response':
          this.handleSyncResponse(message.data);
          break;
        case 'error':
          this.handleError(message.data);
          break;
      }
    } catch (error) {
      console.error('❌ Error parsing WebSocket message:', error);
      this.emit('error', error);
    }
  }

  private handleClose(): void {
    this.connectionState.isConnected = false;
    this.connectionState.isConnecting = false;
    this.connectionState.lastDisconnectedAt = new Date().toISOString();
    this.connectionState.connectionQuality = 'disconnected';

    this.stopBatchTimer();
    this.emit('disconnected');

    // Attempt reconnection
    if (this.connectionState.reconnectAttempts < this.config.maxReconnectAttempts) {
      this.scheduleReconnect();
    } else {
      console.error('❌ Max reconnection attempts reached');
      this.emit('maxReconnectAttemptsReached');
    }
  }

  private handleError(error: any): void {
    console.error('❌ WebSocket error:', error);
    this.emit('error', error);
  }

  private scheduleReconnect(): void {
    this.connectionState.reconnectAttempts++;
    this.connectionState.isConnecting = true;
    
    setTimeout(() => {
      if (!this.connectionState.isConnected) {
        this.connect();
      }
    }, this.config.reconnectInterval);
  }

  // ===== BATCHING AND DEBOUNCING =====

  /**
   * Send skill update with batching and debouncing
   */
  sendSkillUpdate(update: SkillUpdate, debounceKey?: string): void {
    if (debounceKey) {
      this.debounceUpdate(update, debounceKey);
    } else {
      this.addToBatch(update);
    }
  }

  /**
   * Add update to batch
   */
  private addToBatch(update: SkillUpdate): void {
    this.pendingUpdates.push(update);
    
    if (!this.batchTimer) {
      this.startBatchTimer();
    }
  }

  /**
   * Debounce rapid updates
   */
  private debounceUpdate(update: SkillUpdate, key: string): void {
    // Clear existing timer for this key
    const existingTimer = this.debounceTimers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.addToBatch(update);
      this.debounceTimers.delete(key);
    }, this.config.debounceDelay);

    this.debounceTimers.set(key, timer);
  }

  /**
   * Start batch timer
   */
  private startBatchTimer(): void {
    this.batchTimer = setTimeout(() => {
      this.flushBatch();
    }, this.config.batchInterval);
  }

  /**
   * Stop batch timer
   */
  private stopBatchTimer(): void {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = undefined;
    }
  }

  /**
   * Flush pending updates as a batch
   */
  private flushBatch(): void {
    if (this.pendingUpdates.length === 0) {
      return;
    }

    const batchUpdate: BatchUpdate = {
      updates: [...this.pendingUpdates],
      batchId: this.generateMessageId(),
      timestamp: new Date().toISOString(),
    };

    this.pendingUpdates = [];
    this.stopBatchTimer();

    this.sendMessage({
      type: 'batch_update',
      data: batchUpdate,
      messageId: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      requiresAck: this.config.enableAckSystem,
    });

    this.networkStats.batchUpdatesSent++;
    this.networkStats.messagesSent++;
  }

  // ===== DIFF-BASED SYNC =====

  /**
   * Send only changed skills (diff sync)
   */
  sendDiffSync(changedSkillIds: string[], playerUUID: string): void {
    if (!this.config.enableDiffSync) {
      this.sendFullSync(playerUUID);
      return;
    }

    const diffUpdate = {
      type: 'diff_sync',
      changedSkillIds,
      playerUUID,
      timestamp: new Date().toISOString(),
    };

    this.sendMessage({
      type: 'sync_request',
      data: diffUpdate,
      messageId: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      requiresAck: true,
    });

    this.networkStats.diffUpdatesSent++;
  }

  /**
   * Send full sync (fallback)
   */
  sendFullSync(playerUUID: string): void {
    const fullSyncUpdate = {
      type: 'full_sync',
      playerUUID,
      timestamp: new Date().toISOString(),
    };

    this.sendMessage({
      type: 'sync_request',
      data: fullSyncUpdate,
      messageId: this.generateMessageId(),
      timestamp: new Date().toISOString(),
      requiresAck: true,
    });
  }

  // ===== MESSAGE QUEUE AND ACK SYSTEM =====

  /**
   * Send message with optional acknowledgment
   */
  private sendMessage(message: WebSocketMessage): void {
    if (!this.connectionState.isConnected) {
      this.queueMessage(message);
      return;
    }

    try {
      this.ws!.send(JSON.stringify(message));
      this.networkStats.messagesSent++;

      // Track for acknowledgment if required
      if (message.requiresAck) {
        this.pendingAcks.set(message.messageId, {
          message,
          timestamp: Date.now(),
        });

        // Set timeout for ack
        setTimeout(() => {
          if (this.pendingAcks.has(message.messageId)) {
            this.handleAckTimeout(message.messageId);
          }
        }, 5000); // 5 second timeout
      }

      this.emit('messageSent', message);
    } catch (error) {
      console.error('❌ Error sending message:', error);
      this.networkStats.messagesFailed++;
      this.queueMessage(message);
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage, priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const queuedMessage: QueuedMessage = {
      message,
      retryCount: 0,
      queuedAt: new Date().toISOString(),
      priority,
    };

    this.messageQueue.push(queuedMessage);
    this.networkStats.messagesQueued++;
    this.emit('messageQueued', queuedMessage);
  }

  /**
   * Process queued messages when connected
   */
  private processMessageQueue(): void {
    if (this.messageQueue.length === 0) {
      return;
    }

    // Sort by priority
    this.messageQueue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });

    // Send queued messages
    const messagesToSend = [...this.messageQueue];
    this.messageQueue = [];

    for (const queuedMessage of messagesToSend) {
      this.sendMessage(queuedMessage.message);
    }

    console.log(`📤 Processed ${messagesToSend.length} queued messages`);
  }

  /**
   * Handle acknowledgment
   */
  private handleAck(ackData: AckMessage): void {
    const pendingAck = this.pendingAcks.get(ackData.messageId);
    if (!pendingAck) {
      return;
    }

    this.pendingAcks.delete(ackData.messageId);

    if (ackData.success) {
      this.emit('messageAcknowledged', ackData.messageId);
    } else {
      this.emit('messageFailed', ackData.messageId, ackData.error);
      this.handleMessageFailure(pendingAck.message);
    }
  }

  /**
   * Handle ack timeout
   */
  private handleAckTimeout(messageId: string): void {
    const pendingAck = this.pendingAcks.get(messageId);
    if (!pendingAck) {
      return;
    }

    this.pendingAcks.delete(messageId);
    this.emit('messageTimeout', messageId);
    this.handleMessageFailure(pendingAck.message);
  }

  /**
   * Handle message failure with retry logic
   */
  private handleMessageFailure(message: WebSocketMessage): void {
    if (!this.config.enableRetryLogic) {
      return;
    }

    // Find in queue and retry
    const queuedMessage = this.messageQueue.find(qm => qm.message.messageId === message.messageId);
    if (queuedMessage && queuedMessage.retryCount < this.config.maxRetryAttempts) {
      queuedMessage.retryCount++;
      
      setTimeout(() => {
        this.sendMessage(message);
      }, this.config.retryDelay);
    } else {
      this.networkStats.messagesFailed++;
      this.emit('messageFailed', message.messageId, 'Max retry attempts reached');
    }
  }

  // ===== MESSAGE HANDLERS =====

  private handleSkillUpdate(data: any): void {
    this.emit('skillUpdate', data);
  }

  private handleBatchUpdate(data: BatchUpdate): void {
    this.emit('batchUpdate', data);
  }

  private handleSyncResponse(data: any): void {
    this.emit('syncResponse', data);
  }

  // ===== UTILITY METHODS =====

  private generateMessageId(): string {
    return `msg_${++this.messageIdCounter}_${Date.now()}`;
  }

  private initializeConnectionState(): ConnectionState {
    return {
      isConnected: false,
      isConnecting: false,
      reconnectAttempts: 0,
      connectionQuality: 'disconnected',
    };
  }

  private initializeNetworkStats(): NetworkStats {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      messagesQueued: 0,
      messagesFailed: 0,
      batchUpdatesSent: 0,
      diffUpdatesSent: 0,
      averageLatency: 0,
      bandwidthSaved: 0,
      uptime: 0,
    };
  }

  // ===== PUBLIC API =====

  /**
   * Get connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get network statistics
   */
  getNetworkStats(): NetworkStats {
    this.networkStats.uptime = Math.round((Date.now() - this.startTime) / 1000);
    return { ...this.networkStats };
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  /**
   * Get queued message count
   */
  getQueuedMessageCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Get pending ack count
   */
  getPendingAckCount(): number {
    return this.pendingAcks.size;
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
    this.emit('queueCleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.emit('configUpdated', this.config);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnect();
    this.stopBatchTimer();
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
    this.messageQueue = [];
    this.pendingAcks.clear();
    this.removeAllListeners();
  }
}

// Export singleton instance
export const skillWebSocketManager = new SkillWebSocketManager();
