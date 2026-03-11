import { ButtonInteraction, Client, ModalBuilder, TextInputStyle } from "discord.js";
import Button from "../../structures/Button";

export default class SellButton extends Button {
  constructor() {
    super('sell');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    const [itemId, amount] = args!;

    const modal = new ModalBuilder()
      .setCustomId(`sell:${itemId}`)
      .setTitle('Sell Item')
      .addLabelComponents(
        (label) =>
          label.setLabel('Amount').setDescription(`Enter a valid numerical input for the amount. (Max: ${amount.toLocaleString()}`)
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