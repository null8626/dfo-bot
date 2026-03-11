import { ButtonInteraction, Client, ModalBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class ConsumeButton extends Button {
  constructor() {
    super('consume');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const [itemId, quantity] = args!;
    const parsedQuantity = parseInt(quantity, 10);

    const modal = new ModalBuilder()
      .setTitle('Consume Item')
      .setCustomId(`consume:${itemId}`);

    modal.addLabelComponents(
      (label) =>
        label.setLabel('Amount').setDescription(`Enter a valid number amount to consume (Max: ${parsedQuantity})`)
        .setTextInputComponent((ti) => ti.setCustomId('ti1').setRequired(true).setStyle(TextInputStyle.Short))
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