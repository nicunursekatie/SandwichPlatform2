import { db } from '../db';
import { sql } from 'drizzle-orm';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface MigrationDiff {
  table: string;
  rowsInOld: number;
  rowsInNew: number;
  migrated: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  lastCheck: string;
}

export class MigrationMonitor {
  private reportPath = join(process.cwd(), 'migration-reports');

  constructor() {
    // Ensure reports directory exists
    if (!existsSync(this.reportPath)) {
      mkdirSync(this.reportPath, { recursive: true });
    }
  }

  // Generate non-destructive migration diff report
  async generateMigrationDiff(): Promise<MigrationDiff[]> {
    const diffs: MigrationDiff[] = [];

    try {
      // Check conversations migration
      const conversationDiff = await this.checkTableMigration('conversations');
      diffs.push(conversationDiff);

      // Check conversation_participants migration  
      const participantsDiff = await this.checkTableMigration('conversation_participants');
      diffs.push(participantsDiff);

      // Check messages migration
      const messagesDiff = await this.checkTableMigration('messages');
      diffs.push(messagesDiff);

      // Save report to file
      this.saveReport(diffs);

      return diffs;
    } catch (error) {
      console.error('Migration diff generation failed:', error);
      return [];
    }
  }

  private async checkTableMigration(tableName: string): Promise<MigrationDiff> {
    try {
      // Check if shadow table exists
      const shadowExists = await db.execute(sql`
        SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = ${tableName + '_old'}) as exists
      `);

      if (!shadowExists[0].exists) {
        return {
          table: tableName,
          rowsInOld: 0,
          rowsInNew: 0,
          migrated: 0,
          status: 'pending',
          lastCheck: new Date().toISOString()
        };
      }

      // Count rows in both tables
      const oldCount = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName + '_old')}`);
      const newCount = await db.execute(sql`SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}`);

      const rowsInOld = Number(oldCount[0].count);
      const rowsInNew = Number(newCount[0].count);

      let status: MigrationDiff['status'];
      if (rowsInOld === 0 && rowsInNew === 0) {
        status = 'pending';
      } else if (rowsInOld > 0 && rowsInNew === 0) {
        status = 'pending';
      } else if (rowsInOld > 0 && rowsInNew > 0 && rowsInNew < rowsInOld) {
        status = 'in_progress';
      } else if (rowsInNew >= rowsInOld && rowsInOld > 0) {
        status = 'completed';
      } else {
        status = 'pending';
      }

      return {
        table: tableName,
        rowsInOld,
        rowsInNew,
        migrated: rowsInNew,
        status,
        lastCheck: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error checking migration for ${tableName}:`, error);
      return {
        table: tableName,
        rowsInOld: 0,
        rowsInNew: 0,
        migrated: 0,
        status: 'failed',
        lastCheck: new Date().toISOString()
      };
    }
  }

  private saveReport(diffs: MigrationDiff[]) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `migration-diff-${timestamp}.json`;
    const filepath = join(this.reportPath, filename);

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total_tables: diffs.length,
        completed: diffs.filter(d => d.status === 'completed').length,
        in_progress: diffs.filter(d => d.status === 'in_progress').length,
        pending: diffs.filter(d => d.status === 'pending').length,
        failed: diffs.filter(d => d.status === 'failed').length
      },
      details: diffs
    };

    writeFileSync(filepath, JSON.stringify(report, null, 2));
    
    // Also save as latest report
    writeFileSync(join(this.reportPath, 'latest-migration-diff.json'), JSON.stringify(report, null, 2));

    console.log('📊 Migration diff report saved:', filename);
    console.log('📈 Migration summary:', report.summary);

    // Log CI-friendly status
    diffs.forEach(diff => {
      const icon = diff.status === 'completed' ? '✅' : 
                   diff.status === 'in_progress' ? '🔄' : 
                   diff.status === 'failed' ? '❌' : '⏳';
      console.log(`${icon} ${diff.table}: ${diff.migrated}/${diff.rowsInOld} rows migrated`);
    });
  }

  // UUID rekey script generator for legacy data
  async generateUuidRekeyScript(): Promise<string> {
    const script = `
-- UUID Rekey Script for Messaging System Migration
-- Generated on: ${new Date().toISOString()}

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
`;

    const scriptPath = join(this.reportPath, 'uuid-rekey-script.sql');
    writeFileSync(scriptPath, script);
    console.log('🔧 UUID rekey script generated:', scriptPath);
    
    return script;
  }
}

// Export singleton instance
export const migrationMonitor = new MigrationMonitor();