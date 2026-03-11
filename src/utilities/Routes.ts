export default class Routes {
  public static HEADERS = () => ({
    'Authorization': `Bearer ${process.env.BOT_TOKEN}`,
    'Content-Type': 'application/json'
  });

  public static player(userId: string): string {
    return `https://capi.gg/api/bot/player/${userId}`;
  }

  public static registerPlayer(): string {
    return 'https://capi.gg/api/bot/player/register';
  }

  public static inventory(userId: string): string {
    return `https://capi.gg/api/bot/player/inventory/${userId}/all`;
  }

  public static inventoryItem(userId: string, itemId: number) {
    return `https://capi.gg/api/bot/player/inventory/${userId}/${itemId}`;
  }

  public static item(itemId: number): string {
    return `https://capi.gg/api/bot/items/${itemId}`;
  }

  public static items(): string {
    return 'https://capi.gg/api/bot/items/all';
  }

  public static scenario(scenarioId: number): string {
    return `https://capi.gg/api/bot/scenarios/${scenarioId}`;
  }

  public static scenarios(): string {
    return 'https://capi.gg/api/bot/scenarios/all';
  }

  public static npc(npcId: number): string {
    return `https://capi.gg/api/bot/npcs/${npcId}`;
  }

  public static npcs(): string {
    return `https://capi.gg/api/bot/npcs/all`;
  }

  public static equip(): string {
    return 'https://capi.gg/api/inventory/equip';
  }

  public static unequip(): string {
    return 'https://capi.gg/api/inventory/unequip';
  }

  public static lock(): string {
    return 'https://capi.gg/api/inventory/lock';
  }

  public static consume(): string {
    return 'https://capi.gg/api/inventory/consume';
  }

  public static sell(): string {
    return 'https://capi.gg/api/inventory/sell';
  }

  public static collectionAdd(): string {
    return 'https://capi.gg/api/collection/add';
  }

  public static explore(): string {
    return 'https://capi.gg/api/adventure/step';
  }

  public static combat(): string {
    return 'https://capi.gg/api/adventure/combat';
  }

  public static leaderboard(stat: string): string {
    return `https://capi.gg/api/bot/leaderboard?stat=${stat}`;
  }

  public static telemetry(): string {
    return 'https://capi.gg/api/telemetry/db-stats';
  }

  // --- Market ---

  public static marketBrowse(discordId: string, params?: { page?: number, search?: string, rarity?: string, type?: string, sort?: string }): string {
    const base = `https://capi.gg/api/market?discordId=${discordId}&limit=8`;
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.search) qs.set('search', params.search);
    if (params?.rarity && params.rarity !== 'All') qs.set('rarity', params.rarity);
    if (params?.type && params.type !== 'All') qs.set('type', params.type);
    if (params?.sort) qs.set('sort', params.sort);
    const extra = qs.toString();
    return extra ? `${base}&${extra}` : base;
  }

  public static marketMyListings(discordId: string, page: number = 1): string {
    return `https://capi.gg/api/market?sellerId=${discordId}&discordId=${discordId}&limit=8&page=${page}`;
  }

  public static marketBuy(): string {
    return 'https://capi.gg/api/market/buy';
  }

  public static marketList(): string {
    return 'https://capi.gg/api/market/list';
  }

  public static marketCancel(): string {
    return 'https://capi.gg/api/market/cancel';
  }

  public static marketTrend(itemId: number): string {
    return `https://capi.gg/api/market/trend?itemId=${itemId}`;
  }

  public static travel(): string {
    return 'https://capi.gg/api/adventure/travel';
  }

  public static allocate(): string {
    return 'https://capi.gg/api/profile/allocate';
  }

  // --- Bulk Operations ---

  public static bulkSell(): string {
    return 'https://capi.gg/api/inventory/bulk-sell';
  }

  public static bulkCollect(): string {
    return 'https://capi.gg/api/collection/bulk-add';
  }
}