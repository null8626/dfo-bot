import { Collection } from 'discord.js';

export default class CooldownManager {
  private static _cache: Collection<string, number> = new Collection();

  private static _interval = setInterval(() => this.prune(), 60_000);

  public static onCooldown(key: string): boolean {
    const expiration = this._cache.get(key);
    if (!expiration) return false;

    if (expiration > Date.now()) {
      return true;
    }
    this._cache.delete(key);
    return false;
  }

  public static getExpiration(key: string): number {
    const expiration = this._cache.get(key);
    if (!expiration) return Math.floor(Date.now() / 1000);

    return Math.floor(expiration / 1000);
  }

  public static addCooldown(key: string, durationInSeconds: number): void {
    if (this.onCooldown(key)) return;

    const expiresAt = Date.now() + durationInSeconds * 1000;
    this._cache.set(key, expiresAt);
  }

  private static prune(): void {
    const now = Date.now();
    this._cache.sweep((expiration) => expiration <= now);
  }
}
