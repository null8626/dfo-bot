import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";

export default class RegisterDeclineButton extends Button {
  constructor() { super('register_decline'); }

  public async execute(interaction: ButtonInteraction, client: Client): Promise<void> {
    await interaction.deferUpdate();

    await interaction.editReply({
      content: '👋 **No problem!** No data has been stored. You can run `/register` again anytime if you change your mind.',
      embeds: [],
      components: [],
    });
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 3; }
}