import { ButtonInteraction, Client, LabelBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextDisplayBuilder } from "discord.js";
import Button from "../../structures/Button";
import ItemManager from "../../managers/ItemManager";

export default class BulkCollectButton extends Button {
  constructor() { super('bulk_collect'); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    if (!args || args.length === 0) return;

    const encodedString = args.join(':');
    const entries = encodedString.split(',').map(entry => {
      const [id, qty] = entry.split('-');
      return { itemId: parseInt(id, 10), quantity: parseInt(qty, 10) };
    }).filter(e => !isNaN(e.itemId) && !isNaN(e.quantity));

    if (entries.length === 0) return;

    const options: StringSelectMenuOptionBuilder[] = [];

    for (const entry of entries) {
      const def = ItemManager.get(entry.itemId);
      if (!def) continue;

      options.push(
        new StringSelectMenuOptionBuilder()
          .setLabel(`${def.name} (x${entry.quantity})`)
          .setDescription(`${def.rarity} ${def.type} • Lvl ${def.level}`)
          .setValue(`${entry.itemId}-${entry.quantity}`)
      );
    }

    if (options.length === 0) return;

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('bulk_collect_select')
      .setPlaceholder('Select items to collect...')
      .setMinValues(1)
      .setMaxValues(options.length)
      .addOptions(options);

    const selectLabel = new LabelBuilder()
      .setLabel('Select items to archive')
      .setDescription('Selected items move from inventory to your collection book')
      .setStringSelectMenuComponent(selectMenu);

    const infoText = new TextDisplayBuilder()
      .setContent('-# Items are removed from your inventory and added to your collection. This cannot be undone.');

    const modal = new ModalBuilder()
      .setCustomId('bulk_collect_modal')
      .setTitle('📖 Bulk Collect Items')
      .addLabelComponents(selectLabel)
      .addTextDisplayComponents(infoText);

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}