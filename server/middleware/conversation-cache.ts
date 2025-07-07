import LRU from "lru-cache";

// Conversation-level caching for improved performance
interface ConversationCacheEntry {
  conversations: any[];
  lastUpdated: number;
}

interface MessageCacheEntry {
  messages: any[];
  pagination: any;
  lastUpdated: number;
}

class ConversationCache {
  private conversationCache: LRU<string, ConversationCacheEntry>;
  private messageCache: LRU<string, MessageCacheEntry>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_ENTRIES = 1000;

  constructor() {
    this.conversationCache = new LRU({
      max: this.MAX_ENTRIES,
      ttl: this.CACHE_TTL,
    });

    this.messageCache = new LRU({
      max: this.MAX_ENTRIES,
      ttl: this.CACHE_TTL,
    });
  }

  // User conversation list caching
  getUserConversations(userId: string): any[] | null {
    const entry = this.conversationCache.get(`user:${userId}`);
    if (entry && Date.now() - entry.lastUpdated < this.CACHE_TTL) {
      return entry.conversations;
    }
    return null;
  }

  setUserConversations(userId: string, conversations: any[]): void {
    this.conversationCache.set(`user:${userId}`, {
      conversations,
      lastUpdated: Date.now(),
    });
  }

  invalidateUserConversations(userId: string): void {
    this.conversationCache.delete(`user:${userId}`);
  }

  // Message caching by conversation
  getConversationMessages(conversationId: number, limit: number, offset: number): { messages: any[], pagination: any } | null {
    const cacheKey = `conv:${conversationId}:${limit}:${offset}`;
    const entry = this.messageCache.get(cacheKey);
    if (entry && Date.now() - entry.lastUpdated < this.CACHE_TTL) {
      return { messages: entry.messages, pagination: entry.pagination };
    }
    return null;
  }

  setConversationMessages(conversationId: number, limit: number, offset: number, messages: any[], pagination: any): void {
    const cacheKey = `conv:${conversationId}:${limit}:${offset}`;
    this.messageCache.set(cacheKey, {
      messages,
      pagination,
      lastUpdated: Date.now(),
    });
  }

  invalidateConversationMessages(conversationId: number): void {
    // Invalidate all cached message pages for this conversation
    const keysToDelete: string[] = [];
    for (const key of this.messageCache.keys()) {
      if (key.startsWith(`conv:${conversationId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.messageCache.delete(key));
  }

  // Broadcast cache invalidation for real-time updates
  invalidateOnNewMessage(conversationId: number, affectedUserIds: string[]): void {
    // Invalidate message caches for the conversation
    this.invalidateConversationMessages(conversationId);
    
    // Invalidate conversation lists for all participants
    affectedUserIds.forEach(userId => {
      this.invalidateUserConversations(userId);
    });
  }

  // Cache statistics for monitoring
  getStats() {
    return {
      conversations: {
        size: this.conversationCache.size,
        maxSize: this.conversationCache.max,
      },
      messages: {
        size: this.messageCache.size,
        maxSize: this.messageCache.max,
      },
    };
  }

  // Clear all caches (for testing or maintenance)
  clear(): void {
    this.conversationCache.clear();
    this.messageCache.clear();
  }
}

export const conversationCache = new ConversationCache();