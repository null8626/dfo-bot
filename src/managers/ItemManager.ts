import { Collection } from 'discord.js';
import { type IItemJSON } from '../interfaces/IItemJSON';
import logger from '../utilities/Logger';
import Routes from '../utilities/Routes';
import 'dotenv/config';

const REFRESH_INTERVAL = 300_000; // 5 minutes
const FETCH_TIMEOUT = 15_000; // 15 second timeout for API calls

export default class ItemManager {
  public static cache: Collection<number, IItemJSON> = new Collection();
  private static isLoaded: boolean = false;
  private static isRefreshing: boolean = false;
  private static refreshTimer: NodeJS.Timeout | null = null;

  /**
   * Fetch all items from the API and populate the cache.
   * Uses atomic swap so the cache is never empty mid-refresh —
   * live commands always read from a full dataset.
   */
  public static async init(): Promise<void> {
    // Prevent overlapping fetches (e.g. slow API + interval fires again)
    if (this.isRefreshing) {
      logger.warn('[ItemManager] Refresh already in progress, skipping');
      return;
    }

    this.isRefreshing = true;

    try {
      const res = await fetch(Routes.items(), {
        headers: Routes.HEADERS(),
        signal: AbortSignal.timeout(FETCH_TIMEOUT)
      });

      if (!res.ok) {
        logger.error(
          `[ItemManager] Failed to fetch items: HTTP ${res.status} ${res.statusText}`
        );
        return;
      }

      const responseBody = await res.json();

      if (!responseBody.success || !responseBody.data) {
        logger.error('[ItemManager] API returned unexpected payload structure');
        return;
      }

      const items: IItemJSON[] = responseBody.data;

      // Atomic swap: build the new cache fully before replacing the old one.
      // This ensures any command reading mid-refresh still gets complete data.
      const newCache = new Collection<number, IItemJSON>();
      for (const item of items) {
        newCache.set(item.itemId, item);
      }

      this.cache = newCache;
      this.isLoaded = true;

      logger.info(`[ItemManager] Synced ${newCache.size} items`);
    } catch (error: any) {
      // Distinguish timeout from other errors for clearer debugging
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        logger.error(
          `[ItemManager] Fetch timed out after ${FETCH_TIMEOUT / 1000}s`
        );
      } else {
        logger.error(error, '[ItemManager] Critical fetch error:');
      }
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Start the auto-refresh loop. Safe to call multiple times —
   * clears any existing interval before creating a new one.
   */
  public static async refresh(): Promise<void> {
    // Clear any existing interval to prevent stacking
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }

    // Initial fetch
    await this.init();

    // Schedule recurring refreshes
    this.refreshTimer = setInterval(() => this.init(), REFRESH_INTERVAL);
  }

  /**
   * Stop the auto-refresh loop. Call during shutdown.
   */
  public static shutdown(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Retrieve a single item by ID. Returns undefined if not found.
   */
  public static get(itemId: number): IItemJSON | undefined {
    if (!this.isLoaded) {
      logger.warn(
        `[ItemManager] Attempted to get item ${itemId} before cache was loaded`
      );
    }
    return this.cache.get(itemId);
  }

  /**
   * Number of items currently cached.
   */
  public static get size(): number {
    return this.cache.size;
  }
}
