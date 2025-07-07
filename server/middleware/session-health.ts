import { Request, Response, NextFunction } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

// Session-store durability health check
export async function checkSessionHealth(): Promise<{ healthy: boolean; details: any }> {
  try {
    // Check if sessions table exists and has proper indexes
    const tableCheck = await db.execute(sql`
      SELECT 
        EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name = 'sessions') as table_exists,
        EXISTS(SELECT 1 FROM pg_indexes WHERE tablename = 'sessions' AND indexname = 'IDX_session_expire') as expire_index_exists
    `);

    // Check for expired sessions cleanup
    const sessionStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(CASE WHEN expire > NOW() THEN 1 END) as active_sessions,
        COUNT(CASE WHEN expire <= NOW() THEN 1 END) as expired_sessions
      FROM sessions
    `);

    const result = tableCheck[0] || {};
    const stats = sessionStats[0] || {};

    const healthy = (result.table_exists === true || result.table_exists === 't') && 
                   (result.expire_index_exists === true || result.expire_index_exists === 't');

    return {
      healthy,
      details: {
        table_exists: result.table_exists,
        expire_index_exists: result.expire_index_exists,
        session_stats: stats,
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    console.error('Session health check failed:', error);
    return {
      healthy: false,
      details: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    };
  }
}

// 5-minute cron health ping middleware
export function sessionHealthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only run health check in development for immediate feedback
  if (process.env.NODE_ENV === 'development') {
    // Check if this is the auth endpoint and log session health
    if (req.path === '/api/auth/user') {
      checkSessionHealth().then(health => {
        if (!health.healthy) {
          console.error('🚨 SESSION HEALTH CHECK FAILED:', health.details);
        } else {
          console.log('✅ Session health check passed:', health.details.session_stats);
        }
      }).catch(err => {
        console.error('❌ Session health check error:', err);
      });
    }
  }
  next();
}

// Session durability check for cold starts
export async function ensureSessionDurability(): Promise<boolean> {
  try {
    // Ensure sessions table has proper TTL cleanup
    await db.execute(sql`
      DELETE FROM sessions WHERE expire <= NOW()
    `);

    // Verify index exists for performance
    const indexExists = await db.execute(sql`
      SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE tablename = 'sessions' AND indexname = 'IDX_session_expire') as exists
    `);

    if (!indexExists[0].exists) {
      console.log('🔧 Creating missing session expire index...');
      await db.execute(sql`
        CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions USING btree (expire)
      `);
    }

    console.log('✅ Session durability check completed');
    return true;
  } catch (error) {
    console.error('❌ Session durability check failed:', error);
    return false;
  }
}