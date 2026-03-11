import { ModalSubmitInteraction, Client } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import Routes from "../../utilities/Routes";

export default class ConsumeModal extends ModalSubmit {
  constructor() {
    super('consume');
  }

  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const [itemId] = args!;
    const parsedId = parseInt(itemId, 10);
    const discordId = interaction.user.id;

    const amount = interaction.fields.getTextInputValue('ti1');
    const parsedAmount = parseInt(amount, 10);

    if (isNaN(parsedAmount)) {
      await interaction.editReply({ content: 'Invalid numerical input for the amount! Please try again!' });
      return;
    }

    const res = await fetch(Routes.consume(), {
      method: 'POST',
      headers: Routes.HEADERS(),
      body: JSON.stringify({ discordId, itemId: parsedId, amount: parsedAmount })
    });

    // if (!res.ok) throw Error('API Error!');

    const { success, message, error }: { success?: boolean, message?: string, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: error ?? 'Error Fetch', files: [], components: [], embeds: [] });
      return;
    }

    if (success) {
      await interaction.editReply({ content: message ?? 'Success but could not fetch message', components: [], files: [], embeds: [] });
      return;
    } else {
      await interaction.editReply({ content: 'Unknown error!', components: [], files: [], embeds: [] });
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