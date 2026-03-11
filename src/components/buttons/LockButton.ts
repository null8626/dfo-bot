import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import Routes from "../../utilities/Routes";

export default class LockButton extends Button {
  constructor() {
    super('lock');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const discordId = interaction.user.id;
    const itemId = parseInt(args![0], 10);
    const locked = args![1] === '0' ? false : true;

    const res = await fetch(Routes.lock(), {
      method: 'POST',
      headers: Routes.HEADERS(),
      body: JSON.stringify({ discordId, itemId, isLocked: locked ? false : true })
    });

    const { success, isLocked, error }: { success?: boolean, isLocked?: boolean, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: error, files: [], components: [] });
      return;
    }

    await interaction.editReply({ content: isLocked ? 'Successfully locked the item!' : 'Successfully unlocked the item!', files: [], components: [] })
  }

  public isAuthorOnly(): boolean {
    return true;
  }

  public cooldown(): number {
    return 2;
  }
}