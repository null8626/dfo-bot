import { ChatInputCommandInteraction, Client, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { IInventoryItem } from "../interfaces/IInventoryJSON";
import { IPlayerJSON } from "../interfaces/IPlayerJSON";
import PaginatorBuilder from "../utilities/PaginatorBuilder";
import Routes from "../utilities/Routes";
import { apiFetch } from "../utilities/ApiClient";
import { formatError } from "../utilities/ErrorMessages";

import ItemManager from "../managers/ItemManager";
import ImageService from "../utilities/ImageService";

export default class InventoryCommand extends SlashCommand {
  constructor() {
    super('inventory', 'View your inventory or a specific item by id', 'General');
    this.data.addIntegerOption((o) => o.setName('item').setDescription('Enter an item ID').setRequired(false).setMinValue(1));
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();
    const targetId = interaction.options.getInteger('item', false) ?? -1;

    const res = await apiFetch(targetId === -1 ? Routes.inventory(interaction.user.id) : Routes.inventoryItem(interaction.user.id, targetId));

    const { success, data, error }: { success: boolean, data: IInventoryItem[] | IInventoryItem | any, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: formatError(error ?? 'Unknown error') });
      return;
    }

    if (targetId === -1) {
      const inventory = data.inventory as IInventoryItem[];
      const player = data.player as IPlayerJSON;

      if (!inventory || inventory.length === 0) {
        await interaction.editReply({ content: `🎒 **${interaction.user.username}**'s inventory is completely empty.` });
        return;
      }

      const ITEMS_PER_PAGE = 15;
      const pages: EmbedBuilder[] = [];
      const files: AttachmentBuilder[] = [];
      const extraRows: ActionRowBuilder<ButtonBuilder>[][] = [];

      for (let i = 0; i < inventory.length; i += ITEMS_PER_PAGE) {
        const chunk = inventory.slice(i, i + ITEMS_PER_PAGE);

        const imageBuffer = await ImageService.inventory(chunk, player);
        const fileName = `inventory_page_${i}.png`;
        const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

        const pageEmbed = new EmbedBuilder()
          .setColor('#10b981')
          .setImage(`attachment://${fileName}`);

        pages.push(pageEmbed);
        files.push(attachment);

        // Find eligible items on this page (unlocked, non-consumable, has item definition)
        const eligibleItems = chunk.filter(inv => {
          if (inv.isLocked) return false;
          const def = ItemManager.get(inv.itemId);
          if (!def || def.type === 'Consumable') return false;
          return true;
        });

        const pageRows: ActionRowBuilder<ButtonBuilder>[] = [];

        if (eligibleItems.length > 0) {
          // Encode item IDs + quantities into the button customId
          // The button handlers will decode this to populate the modal select menu
          const encoded = eligibleItems
            .map(inv => `${inv.itemId}-${inv.quantity}`)
            .join(',');

          pageRows.push(
            new ActionRowBuilder<ButtonBuilder>().setComponents(
              new ButtonBuilder()
                .setCustomId(`bulk_sell:${encoded}`)
                .setLabel(`🪙 Bulk Sell (${eligibleItems.length})`)
                .setStyle(ButtonStyle.Success),
              new ButtonBuilder()
                .setCustomId(`bulk_collect:${encoded}`)
                .setLabel(`📖 Bulk Collect (${eligibleItems.length})`)
                .setStyle(ButtonStyle.Primary),
            )
          );
        }

        extraRows.push(pageRows);
      }

      const paginator = new PaginatorBuilder()
        .setPages(pages)
        .setFiles(files)
        .setExtraRows(extraRows)
        .setTargetUser(interaction.user.id)
        .setIdleTimeout(60_000);

      await paginator.start(interaction);
      return;
    } else {
      // --- Single item view (unchanged) ---
      const item = data.item as IInventoryItem;
      const player = data.player as IPlayerJSON;
      const hydratedItem = ItemManager.get(item.itemId);

      if (!player) {
        await interaction.editReply({ content: 'No player data was found!' });
        return;
      }

      if (!hydratedItem) {
        await interaction.editReply({ content: 'No item was found for the ID!' });
        return;
      }

      const imageBuffer = await ImageService.item(hydratedItem!);
      const fileName = `inventory_item_${item.itemId}.png`;
      const attachment = new AttachmentBuilder(imageBuffer, { name: fileName });

      const isWithinLevel = player.level >= hydratedItem.level;
      const hasSlot = hydratedItem.slot !== 'None';
      const isConsumable = hydratedItem.type === 'Consumable';
      const isLocked = item.isLocked;

      let equipText = 'Equip';
      let sellText = `🪙 Sell Item: (${hydratedItem.value.toLocaleString()} Coins/ea x ${item.quantity}) ${Math.floor(hydratedItem.value * item.quantity).toLocaleString()} Coins`;
      let collectionText = 'Add to Collection';

      if (!isWithinLevel) equipText = `Required Level: ${hydratedItem.level.toLocaleString()}`;
      if (!hasSlot) equipText = 'Cannot Equip';
      if (isLocked) {
        equipText = '🔒 Locked Item';
        sellText = '🔒 Locked Item';
        collectionText = '🔒 Locked Item';
      }

      let disabled = !isWithinLevel || !hasSlot || isLocked;
      let style = disabled ? ButtonStyle.Secondary : ButtonStyle.Primary;
      if (isConsumable) { disabled = false; style = ButtonStyle.Primary; }

      const equipButton = new ButtonBuilder()
        .setCustomId(isConsumable ? `consume:${item.itemId}:${item.quantity}` : `equip:${item.itemId}`)
        .setLabel(isConsumable ? 'Consume' : equipText)
        .setDisabled(disabled).setStyle(style);

      const lockButton = new ButtonBuilder()
        .setCustomId(`lock:${item.itemId}:${item.isLocked ? '1' : '0'}`)
        .setLabel(item.isLocked ? '🔓 Unlock' : '🔒 Lock')
        .setStyle(item.isLocked ? ButtonStyle.Success : ButtonStyle.Danger);

      const sellButton = new ButtonBuilder()
        .setCustomId(`sell:${item.itemId}:${item.quantity}`)
        .setLabel(isConsumable ? 'Cannot Sell' : sellText)
        .setStyle(isConsumable || isLocked ? ButtonStyle.Secondary : ButtonStyle.Success)
        .setDisabled(isConsumable || isLocked);

      const collectButton = new ButtonBuilder()
        .setCustomId(`collect:${item.itemId}:${item.quantity}`)
        .setLabel(isConsumable ? 'Cannot Collect' : collectionText)
        .setStyle(isConsumable || isLocked ? ButtonStyle.Secondary : ButtonStyle.Primary)
        .setDisabled(isConsumable || isLocked);

      const row = new ActionRowBuilder<ButtonBuilder>().setComponents(equipButton, lockButton);
      const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(sellButton, collectButton);

      await interaction.editReply({ files: [attachment], components: [row, row2] });
    }
  }

  public isGlobalCommand(): boolean { return true; }
  public cooldown(): number { return 5; }
}