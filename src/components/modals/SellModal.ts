import { ModalSubmitInteraction, Client } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import Routes from "../../utilities/Routes";

export default class SellModal extends ModalSubmit {
  constructor() {
    super('sell');
  }

  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const [itemId] = args!;
    const amount = interaction.fields.getTextInputValue('ti1');

    const parsedItemId = parseInt(itemId, 10);
    const parsedAmount = parseInt(amount, 10);

    if (isNaN(parsedItemId) || isNaN(parsedAmount)) {
      await interaction.editReply({ content: 'The item ID or amount was invalid! Please try again!' });
      return;
    }

    const res = await fetch(Routes.sell(), {
      method: 'POST',
      headers: Routes.HEADERS(),
      body: JSON.stringify({ discordId: interaction.user.id, itemId: parsedItemId, amount: parsedAmount })
    });

    const { success, message, newBalance, error }: { success?: boolean, message?: string, newBalance?: number, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: error ?? 'Error (unknown message)', files: [], components: [], embeds: [] });
      return;
    }

    if (success) {
      await interaction.editReply({ content: `${message ?? 'Success but message retrieval failed!'}\nNew Balance: ${newBalance?.toLocaleString() ?? 'unknown'}`, components: [], files: [], embeds: [] });
      return;
    } else {
      await interaction.editReply({ content: 'Unknown Error!', components: [], files: [], embeds: [] });
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