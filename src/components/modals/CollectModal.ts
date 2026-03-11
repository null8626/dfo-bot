import { ModalSubmitInteraction, Client } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import Routes from "../../utilities/Routes";

export default class CollectModal extends ModalSubmit {
  constructor() {
    super('collect');
  }

  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();

    const [itemId] = args!;
    const discordId = interaction.user.id;
    const amount = interaction.fields.getTextInputValue('ti1');

    const parsedItemId = parseInt(itemId, 10);
    const parsedAmount = parseInt(amount, 10);

    if (isNaN(parsedAmount) || isNaN(parsedItemId)) {
      await interaction.editReply({ content: 'The amount or item id is not a valid number!', files: [], components: [], embeds: [] });
      return;
    }

    const res = await fetch(Routes.collectionAdd(), {
      method: 'POST',
      headers: Routes.HEADERS(),
      body: JSON.stringify({ discordId, amount: parsedAmount, itemId: parsedItemId })
    });

    const { success, message, newQuantity, error }: { success?: boolean, message?: string, newQuantity?: number, error?: string } = await res.json();

    if (res.status === 400 || res.status === 401 || res.status === 404 || res.status === 500) {
      await interaction.editReply({ content: error ?? `Unknown error message (Code: ${res.status})`, components: [], files: [], embeds: [] });
      return;
    }

    if (success) {
      await interaction.editReply({ content: message ?? 'Success, but can not fetch message!', components: [], files: [], embeds: [] });
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
    return 2;
  }
}