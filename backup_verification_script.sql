-- Database Backup Verification Script
-- Run this after backup to verify data integrity

-- Check messaging system tables
SELECT 'Conversations' as table_name, COUNT(*) as records FROM conversations
UNION ALL
SELECT 'Conversation Participants', COUNT(*) FROM conversation_participants  
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Sessions', COUNT(*) FROM sessions;

-- Verify shadow tables are ready for migration
SELECT 'conversations_old' as shadow_table, 
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations_old') as exists
UNION ALL
SELECT 'conversation_participants_old',
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'conversation_participants_old') 
UNION ALL  
SELECT 'messages_old',
       EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'messages_old');

-- Check for any active sessions that need preservation
SELECT 
  COUNT(*) as active_sessions,
  MIN(expire) as earliest_expiry,
  MAX(expire) as latest_expiry
FROM sessions 
WHERE expire > NOW();

-- Verify critical user data integrity
SELECT 
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
  COUNT(CASE WHEN "isActive" = true THEN 1 END) as active_users
FROM users;

-- Check for any foreign key relationships that need preservation
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM 
  information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name IN ('conversations', 'conversation_participants', 'messages');