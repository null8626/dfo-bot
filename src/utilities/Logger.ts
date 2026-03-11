import pino from 'pino';
import { statSync, renameSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// --- CONFIG ---
const LOG_DIR = join(process.cwd(), 'logs');
const LOG_FILE = join(LOG_DIR, 'bot.log');
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const MAX_FILES = 3;                       // Keep 3 rotated files
const ROTATION_CHECK_INTERVAL = 60_000;    // Check size every 60 seconds

// Ensure the logs directory exists
if (!existsSync(LOG_DIR)) {
  mkdirSync(LOG_DIR, { recursive: true });
}

// --- Custom Levels ---
const additionalLevels = {
  dev: 35,
  command: 34,
  player: 33,
  button: 32,
};

// --- File destination (reopenable for rotation) ---
let fileDestination = pino.destination({ dest: LOG_FILE, sync: false });

/**
 * Rotates log files when bot.log exceeds MAX_SIZE_BYTES.
 * 
 * Rotation pattern:
 *   bot.log      → bot.1.log
 *   bot.1.log    → bot.2.log
 *   bot.2.log    → bot.3.log
 *   bot.3.log    → deleted
 * 
 * Then reopens the file destination for a fresh bot.log.
 */
function rotateIfNeeded(): void {
  try {
    if (!existsSync(LOG_FILE)) return;

    const { size } = statSync(LOG_FILE);
    if (size < MAX_SIZE_BYTES) return;

    // Flush pending writes before rotating
    fileDestination.flushSync();

    // Shift existing rotated files (3 → deleted, 2 → 3, 1 → 2)
    for (let i = MAX_FILES; i >= 1; i--) {
      const older = join(LOG_DIR, `bot.${i}.log`);
      if (i === MAX_FILES) {
        if (existsSync(older)) unlinkSync(older);
      } else {
        const newer = join(LOG_DIR, `bot.${i + 1}.log`);
        if (existsSync(older)) renameSync(older, newer);
      }
    }

    // Current → bot.1.log
    renameSync(LOG_FILE, join(LOG_DIR, 'bot.1.log'));

    // Reopen the destination — pino.destination creates the new file on first write
    fileDestination.reopen();

    logger.info(`[Logger] Log rotated. Previous file exceeded ${MAX_SIZE_BYTES / 1024 / 1024}MB`);
  } catch (err) {
    console.error('[Logger] Rotation failed:', err);
  }
}

// --- Build the logger: pretty console + raw JSON file ---
const logger = pino(
  {
    customLevels: additionalLevels,
    level: 'debug',
  },
  pino.multistream([
    // Stream 1: Pretty console output (existing behavior)
    {
      level: 'debug',
      stream: pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
          levelFirst: true,
          customLevels: 'dev:35,command:34,player:33,button:32',
          customColors: 'dev:magenta,command:magenta,player:magenta,button:magenta',
          useOnlyCustomProps: false,
        },
      }),
    },
    // Stream 2: JSON file output (structured, machine-readable)
    {
      level: 'debug',
      stream: fileDestination,
    },
  ])
);

// --- Rotation check loop ---
setInterval(rotateIfNeeded, ROTATION_CHECK_INTERVAL);

// --- Flush on exit ---
process.on('beforeExit', () => { try { fileDestination.flushSync(); } catch {} });
process.on('exit', () => { try { fileDestination.flushSync(); } catch {} });

export default logger;