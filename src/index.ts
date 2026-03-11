import { ShardingManager } from 'discord.js';
import 'dotenv/config';
import logger from './utilities/Logger';
import path from 'path';

// Dynamically check if we are running the compiled .js file or raw .ts file
const isCompiled = __filename.endsWith('.js');

// Point to bot.js in production, or bot.ts in development
const botFile = path.join(__dirname, isCompiled ? 'bot.js' : 'bot.ts'); 

const manager = new ShardingManager(botFile, { 
    token: process.env.BOT_TOKEN,
    totalShards: 'auto',
    respawn: true,
    // Only inject ts-node compiler if we are actually running TypeScript
    execArgv: isCompiled ? [] : ['-r', 'ts-node/register']
});

manager.on('shardCreate', (shard) => {
    logger.info(`[System] Launched Shard #${shard.id}`);

    shard.on('error', (err) => {
        logger.error(`[Shard #${shard.id}] Error: ${err}`);
    });
    
    shard.on('death', () => {
        logger.error(`[Shard #${shard.id}] Died. Respawning...`);
    });
});

manager.spawn().catch(err => {
    logger.error(`[System] Failed to spawn shards: ${err}`);
});