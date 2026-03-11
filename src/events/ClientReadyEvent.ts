import { Client } from "discord.js";
import Event from "../structures/Event";
import logger from "../utilities/Logger";
import ItemManager from "../managers/ItemManager";
import WorkerPool from "../utilities/WorkerPool";
import PresenceManager from "../managers/PresenceManager";

export default class ClientReadyEvent extends Event {
  constructor() {
    // Note: If your event handler relies on the exact Discord.js event name, 
    // make sure this is 'ready' instead of 'clientReady' if it doesn't trigger!
    super('clientReady'); 
  }

  public async execute(client: Client) {
    const shardId = client.shard?.ids[0] ?? 0;
    logger.info(`[${this.constructor.name}] Successfully logged in as ${client.user?.tag}! (Shard ${shardId})`);

    // Initialize the image rendering worker pool
    WorkerPool.init();

    // Stagger the API requests by 2.5 seconds per shard to prevent slamming capi.gg
    const delayMs = 1500 + (shardId * 2500); 
    
    setTimeout(async () => {
        logger.info(`[Shard ${shardId}] Initiating staggered ItemManager sync...`);
        await ItemManager.refresh();

        // Start rotating presence after items are loaded (stats are available)
        await PresenceManager.init(client);
    }, delayMs);
  }

  public isOnce(): boolean {
    return true;
  }
}