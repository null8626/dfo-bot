import { ButtonInteraction, Client, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } from "discord.js";
import Button from "../../structures/Button";
import ItemManager from "../../managers/ItemManager";

export default class BulkSellButton extends Button {
  constructor() { super('bulk_sell'); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    if (!args || args.length === 0) return;

    // Decode item data from customId: "itemId1-qty1,itemId2-qty2,..."
    const encodedString = args.join(':');
    const entries = encodedString.split(',').map(entry => {
      const [id, qty] = entry.split('-');
      return { itemId: parseInt(id, 10), quantity: parseInt(qty, 10) };
    }).filter(e => !isNaN(e.itemId) && !isNaN(e.quantity));

    if (entries.length === 0) return;

    // Build select menu options from item definitions
    const options: StringSelectMenuOptionBuilder[] = [];

    for (const entry of entries) {
      const def = ItemManager.get(entry.itemId);
      if (!def) continue;

      const totalValue = Math.floor(def.value * entry.quantity);
      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${def.name} (x${entry.quantity})`)
          .setDescription(`${def.rarity} ${def.type} • Sells for ${totalValue.toLocaleString()}g`)
          .setValue(`${entry.itemId}-${entry.quantity}`)
      );
    }

    if (options.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bulk_sell_select')
      .setPlaceholder('Select items to sell...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const selectLabel = new LabelBuilder()
      .setLabel('Select items to sell')
      .setDescription('All selected items will be sold for gold')
      .setStringSelectMenuComponent(selectMenu);

    const infoText = new TextDisplayBuilder()
      .setContent('-# Locked and consumable items are excluded. Select the items you want to sell and submit.');

    const modal = new ModalBuilder()
      .setCustomId('bulk_sell_modal')
      .setTitle('🪙 Bulk Sell Items')
      .addLabelComponents(selectLabel)
      .addTextDisplayComponents(infoText);

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}