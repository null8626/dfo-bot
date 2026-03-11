import { ActivityType, Client } from 'discord.js';
import logger from '../utilities/Logger';
import Routes from '../utilities/Routes';
import ItemManager from './ItemManager';

interface GameStats {
  players: number;
  items: number;
  scenarios: number;
}

const ROTATION_INTERVAL = 60_000;  // Rotate activity every 60 seconds
const FETCH_INTERVAL = 300_000;    // Refresh API stats every 5 minutes

export default class PresenceManager {
  private static client: Client;
  private static rotationIndex: number = 0;
  private static rotationTimer: NodeJS.Timeout | null = null;
  private static fetchTimer: NodeJS.Timeout | null = null;

  // Cached stats from the API (refreshed every 5 minutes)
  private static stats: GameStats = {
    players: 0,
    items: 0,
    scenarios: 0,
  };

  /**
   * Start the presence rotation. Call once in ClientReadyEvent.
   */
  public static async init(client: Client): Promise<void> {
    this.client = client;

    // Fetch stats immediately on startup, then every 5 minutes
    await this.fetchStats();
    this.fetchTimer = setInterval(() => this.fetchStats(), FETCH_INTERVAL);

    // Start the rotation
    this.rotate();
    this.rotationTimer = setInterval(() => this.rotate(), ROTATION_INTERVAL);

    logger.info('[PresenceManager] Activity rotation started');
  }

  /**
   * Fetch game stats from the capi.gg API.
   * Failures are silent — we just keep the last known values.
   */
  private static async fetchStats(): Promise<void> {
    try {
      // Fetch player + item counts from telemetry
      const telemetryRes = await fetch('https://capi.gg/api/telemetry/db-stats', {
        headers: Routes.HEADERS(),
      });

      if (telemetryRes.ok) {
        const data = await telemetryRes.json();
        this.stats.players = data.players ?? this.stats.players;
        this.stats.items = data.items ?? this.stats.items;
      }

      // Fetch scenario count
      const scenarioRes = await fetch(Routes.scenarios(), {
        headers: Routes.HEADERS(),
      });

      if (scenarioRes.ok) {
        const data = await scenarioRes.json();
        this.stats.scenarios = data.count ?? this.stats.scenarios;
      }
    } catch (err) {
      logger.warn(`[PresenceManager] Failed to fetch stats: ${err}`);
    }
  }

  /**
   * Cycle to the next activity in the rotation.
   */
  private static rotate(): void {
    if (!this.client.user) return;

    const guilds = this.client.guilds.cache.size;

    const activities = [
      { type: ActivityType.Watching, name: `${this.stats.players.toLocaleString()} players` },
      { type: ActivityType.Watching, name: `${guilds.toLocaleString()} servers` },
      { type: ActivityType.Watching, name: `${this.stats.items.toLocaleString()} items` },
      { type: ActivityType.Watching, name: `${this.stats.scenarios.toLocaleString()} scenarios` },
      { type: ActivityType.Playing,  name: `capi.gg` },
    ];

    const current = activities[this.rotationIndex % activities.length];

    this.client.user.setPresence({
      activities: [{ name: current.name, type: current.type }],
      status: 'online',
    });

    this.rotationIndex++;
  }

  /**
   * Clean up timers. Call during shutdown.
   */
  public static shutdown(): void {
    if (this.rotationTimer) clearInterval(this.rotationTimer);
    if (this.fetchTimer) clearInterval(this.fetchTimer);
    this.rotationTimer = null;
    this.fetchTimer = null;
  }
}