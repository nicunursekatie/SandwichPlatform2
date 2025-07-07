
-- UUID Rekey Script for Messaging System Migration
-- Generated on: 2025-07-07T23:02:32.279Z

-- Step 1: Add UUID columns to shadow tables if they don't exist
ALTER TABLE conversations_old ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();
ALTER TABLE conversation_participants_old ADD COLUMN IF NOT EXISTS uuid_conversation_id UUID;
ALTER TABLE conversation_participants_old ADD COLUMN IF NOT EXISTS uuid_user_id UUID;
ALTER TABLE messages_old ADD COLUMN IF NOT EXISTS uuid_id UUID DEFAULT gen_random_uuid();
ALTER TABLE messages_old ADD COLUMN IF NOT EXISTS uuid_conversation_id UUID;
ALTER TABLE messages_old ADD COLUMN IF NOT EXISTS uuid_user_id UUID;

-- Step 2: Create mapping tables for legacy ID to UUID conversion
CREATE TABLE IF NOT EXISTS id_mapping_conversations (
  legacy_id INTEGER,
  uuid_id UUID,
  PRIMARY KEY (legacy_id)
);

CREATE TABLE IF NOT EXISTS id_mapping_users (
  legacy_id TEXT,
  uuid_id UUID,
  PRIMARY KEY (legacy_id)
);

-- Step 3: Generate UUIDs for existing data
INSERT INTO id_mapping_conversations (legacy_id, uuid_id)
SELECT id, gen_random_uuid() FROM conversations_old
ON CONFLICT (legacy_id) DO NOTHING;

-- Step 4: Update foreign key references using mapping tables
UPDATE conversation_participants_old cp
SET uuid_conversation_id = imc.uuid_id
FROM id_mapping_conversations imc
WHERE cp.conversation_id = imc.legacy_id;

UPDATE messages_old m
SET uuid_conversation_id = imc.uuid_id
FROM id_mapping_conversations imc
WHERE m.conversation_id = imc.legacy_id;

-- Step 5: Dry run verification queries
SELECT 'conversations_old' as table_name, COUNT(*) as total_rows, COUNT(uuid_id) as uuid_assigned FROM conversations_old
UNION ALL
SELECT 'conversation_participants_old', COUNT(*), COUNT(uuid_conversation_id) FROM conversation_participants_old
UNION ALL  
SELECT 'messages_old', COUNT(*), COUNT(uuid_conversation_id) FROM messages_old;
