import { ButtonInteraction, Client, ModalBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class CollectButton extends Button {
  constructor() {
    super('collect');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const [itemId, quantity] = args!;

    const modal = new ModalBuilder()
      .setCustomId(`collect:${itemId}`)
      .setTitle('Collect Item')
      .setLabelComponents(
        (label) =>
          label.setLabel('Amount').setDescription(`Enter an amount to collect (Max: ${quantity})`)
          .setTextInputComponent((ti) => ti.setCustomId('ti1').setRequired(true).setStyle(TextInputStyle.Short).setPlaceholder(quantity))
      );

    await interaction.showModal(modal);
  }

  public isAuthorOnly(): boolean {
    return true;
  }

  public cooldown(): number {
    return 2;
  }
}