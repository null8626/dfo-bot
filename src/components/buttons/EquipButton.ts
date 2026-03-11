import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import Routes from "../../utilities/Routes";
import { IPlayerJSON } from "../../interfaces/IPlayerJSON";

export default class EquipButton extends Button {
  constructor() {
    super('equip');
  }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const itemId = parseInt(args![0] ?? '-1', 10);

    if (isNaN(itemId)) {
      await interaction.editReply({ files: [], components: [], content: 'Error parsing item id!' });
      return;
    }

    const discordId = interaction.user.id;

    const res = await fetch(Routes.equip(), {
      headers: Routes.HEADERS(),
      method: 'POST',
      body: JSON.stringify({ discordId, itemId })
    });

    if (!res.ok) throw Error('API Error!');

    const { success, error, message, player }: { success?: boolean, error?: string, message?: string, player?: IPlayerJSON } = await res.json();

    if (res.status === 400 || res.status === 404) {
      await interaction.editReply({ files: [], components: [], content: error ?? 'null' });
      return;
    }

    if (success) {
      await interaction.editReply({ files: [], components: [], content: message ?? 'Success but could not fetch message!' });
      return;
    } else {
      await interaction.editReply({ files: [], components: [], content: 'Unknown error!' });
      return;
    }
  }

  public isAuthorOnly(): boolean {
    return true;
  }

  public cooldown(): number {
    return 3;
  }
}