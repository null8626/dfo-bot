import {
  ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle,
  ChatInputCommandInteraction, Client, EmbedBuilder, MessageFlags,
} from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";
import Routes from "../utilities/Routes";
import { type MarketListing, type MarketPageConfig } from "../utilities/MarketImageBuilder";
import ImageService from "../utilities/ImageService";

const RARITY_CHOICES = [
  { name: 'All', value: 'All' },
  { name: 'Common', value: 'Common' }, { name: 'Uncommon', value: 'Uncommon' },
  { name: 'Rare', value: 'Rare' }, { name: 'Elite', value: 'Elite' },
  { name: 'Epic', value: 'Epic' }, { name: 'Legendary', value: 'Legendary' },
  { name: 'Divine', value: 'Divine' },
];

const SORT_CHOICES = [
  { name: 'Newest', value: 'newest' },
  { name: 'Price: Low → High', value: 'price_asc' },
  { name: 'Price: High → Low', value: 'price_desc' },
  { name: 'Level: High → Low', value: 'level_desc' },
];

const TYPE_CHOICES = [
  { name: 'All', value: 'All' },
  { name: 'Weapon', value: 'Weapon' }, { name: 'Armor', value: 'Armor' },
  { name: 'Accessory', value: 'Accessory' }, { name: 'Consumable', value: 'Consumable' },
];

export default class MarketCommand extends SlashCommand {
  constructor() {
    super('market', 'Browse and trade on the Global Market', 'Gaming');

    this.data
      .addSubcommand((sub) =>
        sub.setName('browse')
          .setDescription('Browse items for sale on the Global Market')
          .addStringOption((o) => o.setName('search').setDescription('Search by item name').setRequired(false))
          .addStringOption((o) => o.setName('rarity').setDescription('Filter by rarity').setChoices(RARITY_CHOICES).setRequired(false))
          .addStringOption((o) => o.setName('type').setDescription('Filter by item type').setChoices(TYPE_CHOICES).setRequired(false))
          .addStringOption((o) => o.setName('sort').setDescription('Sort order').setChoices(SORT_CHOICES).setRequired(false))
      )
      .addSubcommand((sub) =>
        sub.setName('listings')
          .setDescription('View your active market listings')
      )
      .addSubcommand((sub) =>
        sub.setName('sell')
          .setDescription('List one of your items on the market')
          .addIntegerOption((o) => o.setName('item').setDescription('Item ID from your inventory').setRequired(true).setMinValue(1))
          .addIntegerOption((o) => o.setName('quantity').setDescription('Amount to list').setMinValue(1).setRequired(true))
          .addIntegerOption((o) => o.setName('price').setDescription('Price per unit in gold').setMinValue(1).setRequired(true))
      );
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const sub = interaction.options.getSubcommand(true);
    const discordId = interaction.user.id;

    switch (sub) {
      case 'browse': return this.handleBrowse(interaction, discordId);
      case 'listings': return this.handleListings(interaction, discordId);
      case 'sell': return this.handleSell(interaction, discordId);
    }
  }

  // --- BROWSE ---
  private async handleBrowse(interaction: ChatInputCommandInteraction, discordId: string): Promise<void> {
    await interaction.deferReply();

    const search = interaction.options.getString('search') ?? '';
    const rarity = interaction.options.getString('rarity') ?? 'All';
    const type = interaction.options.getString('type') ?? 'All';
    const sort = interaction.options.getString('sort') ?? 'newest';

    try {
      const res = await apiFetch(Routes.marketBrowse(discordId, { page: 1, search: search || undefined, rarity, type, sort }));
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to load market') });
        return;
      }

      const listings: MarketListing[] = body.data;
      const pagination = body.pagination;
      const config: MarketPageConfig = { page: pagination.page, totalPages: pagination.totalPages, totalItems: pagination.totalItems, mode: 'browse' };

      const imageBuffer = await ImageService.market(listings, config);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'market.png' });
      const embed = new EmbedBuilder().setColor(0x10b981).setImage('attachment://market.png');

      // Encode the filter state for pagination
      const filterKey = `${search}|${rarity}|${type}|${sort}`;

      const components = buildMarketButtons(listings, config, filterKey, 'browse');

      await interaction.editReply({ embeds: [embed], files: [attachment], components });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  // --- MY LISTINGS ---
  private async handleListings(interaction: ChatInputCommandInteraction, discordId: string): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const res = await apiFetch(Routes.marketMyListings(discordId));
      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to load your listings') });
        return;
      }

      const listings: MarketListing[] = body.data;
      const pagination = body.pagination;
      const config: MarketPageConfig = { page: pagination.page, totalPages: pagination.totalPages, totalItems: pagination.totalItems, mode: 'my_listings' };

      const imageBuffer = await ImageService.market(listings, config);
      const attachment = new AttachmentBuilder(imageBuffer, { name: 'my_listings.png' });
      const embed = new EmbedBuilder().setColor(0x3b82f6).setImage('attachment://my_listings.png');

      const components = buildMarketButtons(listings, config, '', 'my_listings');

      await interaction.editReply({ embeds: [embed], files: [attachment], components });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  // --- SELL ---
  private async handleSell(interaction: ChatInputCommandInteraction, discordId: string): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const itemId = interaction.options.getInteger('item', true);
    const quantity = interaction.options.getInteger('quantity', true);
    const pricePerUnit = interaction.options.getInteger('price', true);

    try {
      const res = await apiFetch(Routes.marketList(), {
        method: 'POST',
        body: JSON.stringify({ discordId, itemId, quantity, pricePerUnit }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Failed to create listing') });
        return;
      }

      await interaction.editReply({
        content: `🏪 **Listed on the Global Market!** x${quantity} of item #${itemId} at 🪙 ${pricePerUnit.toLocaleString()} gold each.`
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  public isGlobalCommand(): boolean { return true; }
  public cooldown(): number { return 5; }
}

/**
 * Builds action rows for market results.
 * 
 * Browse mode: numbered Buy buttons (🛒 1, 🛒 2, ...) + pagination
 * My listings mode: numbered Cancel buttons (❌ 1, ❌ 2, ...) + pagination
 * 
 * Listing IDs are encoded into button customIds so users never see or type them.
 * Discord allows max 5 buttons per row and max 5 rows total.
 */
function buildMarketButtons(
  listings: MarketListing[],
  config: MarketPageConfig,
  filterKey: string,
  mode: 'browse' | 'my_listings'
): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];

  // Action buttons (buy or cancel) — up to 8 items, 2 rows of 4
  if (listings.length > 0) {
    const isBrowse = mode === 'browse';
    const chunks = chunkArray(listings, 4); // Max 4 per row to leave room

    for (const chunk of chunks.slice(0, 2)) { // Max 2 rows of actions
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (let i = 0; i < chunk.length; i++) {
        const globalIndex = listings.indexOf(chunk[i]);
        const listing = chunk[i];

        if (isBrowse) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mkt_buy:${listing.listingId}`)
              .setLabel(`🛒 ${globalIndex + 1}`)
              .setStyle(ButtonStyle.Success)
          );
        } else {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(`mkt_cancel:${listing.listingId}`)
              .setLabel(`❌ ${globalIndex + 1}`)
              .setStyle(ButtonStyle.Danger)
          );
        }
      }

      rows.push(row);
    }
  }

  // Pagination row
  if (config.totalPages > 1) {
    const navRow = new ActionRowBuilder<ButtonBuilder>().setComponents(
      new ButtonBuilder()
        .setCustomId(`mkt_prev:${config.page}:${filterKey}:${mode}`)
        .setLabel('◀ Prev')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(config.page <= 1),
      new ButtonBuilder()
        .setCustomId(`mkt_next:${config.page}:${filterKey}:${mode}`)
        .setLabel('Next ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(config.page >= config.totalPages),
    );
    rows.push(navRow);
  }

  return rows;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}