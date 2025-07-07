import { Router } from "express";
import { db } from "../db";
import { conversations, conversationParticipants, messages } from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { isAuthenticated, requirePermission } from "../temp-auth";

const router = Router();

// ==================== CONVERSATIONS API ====================

// GET /api/conversations - List user's conversations
router.get("/conversations", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    
    // Get conversations where user is a participant
    const userConversations = await db
      .select({
        id: conversations.id,
        type: conversations.type,
        name: conversations.name,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversations.id, conversationParticipants.conversationId))
      .where(eq(conversationParticipants.userId, userId))
      .orderBy(desc(conversations.createdAt));

    // For each conversation, get participants and last message info
    const enrichedConversations = await Promise.all(
      userConversations.map(async (conv) => {
        // Get participants
        const participants = await db
          .select({
            userId: conversationParticipants.userId,
            joinedAt: conversationParticipants.joinedAt,
            lastReadAt: conversationParticipants.lastReadAt,
          })
          .from(conversationParticipants)
          .where(eq(conversationParticipants.conversationId, conv.id));

        // Get last message
        const [lastMessage] = await db
          .select({
            content: messages.content,
            sender: messages.sender,
            createdAt: messages.createdAt,
          })
          .from(messages)
          .where(eq(messages.conversationId, conv.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Calculate unread count (messages after user's last read)
        const userParticipant = participants.find(p => p.userId === userId);
        const unreadCount = userParticipant ? await db
          .select({ count: messages.id })
          .from(messages)
          .where(and(
            eq(messages.conversationId, conv.id),
            // Add timestamp comparison when we need accurate unread counts
          )).then(result => 0) : 0; // Simplified for now

        return {
          ...conv,
          participants,
          lastMessage: lastMessage || null,
          unreadCount,
        };
      })
    );

    res.json(enrichedConversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
});

// POST /api/conversations - Create new conversation
router.post("/conversations", isAuthenticated, requirePermission("SEND_MESSAGES"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { type, name, participants } = req.body;

    if (!type || !participants || !Array.isArray(participants)) {
      return res.status(400).json({ message: "Type and participants are required" });
    }

    if (type !== 'direct' && !name) {
      return res.status(400).json({ message: "Name is required for group and channel conversations" });
    }

    // Create conversation
    const [conversation] = await db
      .insert(conversations)
      .values({
        type,
        name: type === 'direct' ? null : name,
      })
      .returning();

    // Add participants (including creator)
    const allParticipants = [...new Set([userId, ...participants])];
    const participantRecords = allParticipants.map(participantId => ({
      conversationId: conversation.id,
      userId: participantId,
    }));

    await db.insert(conversationParticipants).values(participantRecords);

    res.status(201).json({
      message: "Conversation created successfully",
      conversation: {
        ...conversation,
        participants: allParticipants.map(id => ({ userId: id, joinedAt: new Date(), lastReadAt: new Date() })),
      },
    });
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ message: "Failed to create conversation" });
  }
});

// ==================== MESSAGES API ====================

// GET /api/conversations/:id/messages - Get messages for conversation  
router.get("/conversations/:id/messages", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Verify user is participant in conversation
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));

    if (!participant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    // Get messages using raw SQL query to avoid Drizzle issues
    const conversationMessages = await db.execute(sql`
      SELECT id, conversation_id as "conversationId", user_id as "userId", 
             content, sender, created_at as "createdAt", updated_at as "updatedAt"
      FROM messages 
      WHERE conversation_id = ${conversationId}
      ORDER BY created_at ASC
    `);

    res.json(conversationMessages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// POST /api/conversations/:id/messages - Send message to conversation
router.post("/conversations/:id/messages", isAuthenticated, requirePermission("SEND_MESSAGES"), async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { content, sender } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Verify user is participant in conversation
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));

    if (!participant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    // Create message
    const [message] = await db
      .insert(messages)
      .values({
        conversationId,
        userId,
        content: content.trim(),
        sender: sender || req.user.firstName || req.user.email || 'Anonymous',
      })
      .returning();

    // Broadcast message via WebSocket if available
    if (req.app.locals.wss) {
      req.app.locals.wss.broadcast({
        type: 'new_message',
        conversationId,
        message,
      });
    }

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
});

// PATCH /api/conversations/:id/messages/:msgId - Edit message
router.patch("/conversations/:id/messages/:msgId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const messageId = parseInt(req.params.msgId);
    const { content } = req.body;

    if (isNaN(conversationId) || isNaN(messageId)) {
      return res.status(400).json({ message: "Invalid conversation or message ID" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Message content is required" });
    }

    // Get message and verify ownership
    const [message] = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId),
        eq(messages.userId, userId)
      ));

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Update message
    const [updatedMessage] = await db
      .update(messages)
      .set({
        content: content.trim(),
        updatedAt: new Date(),
      })
      .where(eq(messages.id, messageId))
      .returning();

    // Broadcast update via WebSocket if available
    if (req.app.locals.wss) {
      req.app.locals.wss.broadcast({
        type: 'message_updated',
        conversationId,
        message: updatedMessage,
      });
    }

    res.json({
      message: "Message updated successfully",
      data: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    res.status(500).json({ message: "Failed to update message" });
  }
});

// DELETE /api/conversations/:id/messages/:msgId - Delete message
router.delete("/conversations/:id/messages/:msgId", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const messageId = parseInt(req.params.msgId);

    if (isNaN(conversationId) || isNaN(messageId)) {
      return res.status(400).json({ message: "Invalid conversation or message ID" });
    }

    // Get message and verify ownership
    const [message] = await db
      .select()
      .from(messages)
      .where(and(
        eq(messages.id, messageId),
        eq(messages.conversationId, conversationId),
        eq(messages.userId, userId)
      ));

    if (!message) {
      return res.status(404).json({ message: "Message not found or access denied" });
    }

    // Delete message
    await db.delete(messages).where(eq(messages.id, messageId));

    // Broadcast deletion via WebSocket if available
    if (req.app.locals.wss) {
      req.app.locals.wss.broadcast({
        type: 'message_deleted',
        conversationId,
        messageId,
      });
    }

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ message: "Failed to delete message" });
  }
});

// POST /api/conversations/:id/read - Mark conversation as read
router.post("/conversations/:id/read", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);

    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Update user's last read timestamp
    await db
      .update(conversationParticipants)
      .set({ lastReadAt: new Date() })
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));

    res.json({ message: "Conversation marked as read" });
  } catch (error) {
    console.error("Error marking conversation as read:", error);
    res.status(500).json({ message: "Failed to mark conversation as read" });
  }
});

// ==================== PARTICIPANT MANAGEMENT ====================

// POST /api/conversations/:id/participants - Add participant to conversation
router.post("/conversations/:id/participants", isAuthenticated, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const { userId: newUserId } = req.body;

    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    if (!newUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    // Verify current user is participant (basic permission check)
    const [participant] = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, userId)
      ));

    if (!participant) {
      return res.status(403).json({ message: "Access denied to this conversation" });
    }

    // Check if user is already a participant
    const [existingParticipant] = await db
      .select()
      .from(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, newUserId)
      ));

    if (existingParticipant) {
      return res.status(400).json({ message: "User is already a participant" });
    }

    // Add new participant
    await db.insert(conversationParticipants).values({
      conversationId,
      userId: newUserId,
    });

    res.status(201).json({ message: "Participant added successfully" });
  } catch (error) {
    console.error("Error adding participant:", error);
    res.status(500).json({ message: "Failed to add participant" });
  }
});

// DELETE /api/conversations/:id/participants/:userId - Remove participant from conversation
router.delete("/conversations/:id/participants/:userId", isAuthenticated, async (req: any, res) => {
  try {
    const currentUserId = req.user.id;
    const conversationId = parseInt(req.params.id);
    const targetUserId = req.params.userId;

    if (isNaN(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID" });
    }

    // Only allow removing self or if user has moderation permissions
    const canRemove = currentUserId === targetUserId || 
                      req.user.permissions?.includes('moderate_messages') ||
                      req.user.role === 'super_admin';

    if (!canRemove) {
      return res.status(403).json({ message: "Permission denied" });
    }

    // Remove participant
    const result = await db
      .delete(conversationParticipants)
      .where(and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, targetUserId)
      ));

    res.json({ message: "Participant removed successfully" });
  } catch (error) {
    console.error("Error removing participant:", error);
    res.status(500).json({ message: "Failed to remove participant" });
  }
});

export { router as messagingRoutes };