
import { Router } from "express";
import { z } from "zod";
import { storage } from "../storage-wrapper";

const router = Router();

// Get all conversations for a user
router.get("/conversations", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      console.log('DEBUG: No user ID found in request, user object:', (req as any).user);
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const conversations = await storage.getUserConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

// Create a new conversation
router.post("/conversations", async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    console.log('DEBUG: POST /conversations - User object:', (req as any).user);
    console.log('DEBUG: POST /conversations - User ID:', userId);
    if (!userId) {
      console.log('DEBUG: POST /conversations - No user ID found, rejecting request');
      return res.status(401).json({ error: "User not authenticated" });
    }
    
    const { type, name, participants } = req.body;
    
    const conversation = await storage.createConversation({
      type,
      name,
      createdBy: userId
    }, participants);
    
    res.status(201).json(conversation);
  } catch (error) {
    console.error("Error creating conversation:", error);
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// REMOVED: Legacy route conflicting with unified messaging API
// This route was using old storage system and conflicting with the new unified API

// REMOVED: Legacy POST route conflicting with unified messaging API

export { router as conversationsRoutes };
