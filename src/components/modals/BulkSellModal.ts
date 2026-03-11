import { ModalSubmitInteraction, Client, MessageFlags } from "discord.js";
import ModalSubmit from "../../structures/ModalSubmit";
import { apiFetch } from "../../utilities/ApiClient";
import { formatError } from "../../utilities/ErrorMessages";
import Routes from "../../utilities/Routes";

export default class BulkSellModal extends ModalSubmit {
  constructor() { super('bulk_sell_modal'); }

  public async execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    // Extract selected values from the select menu inside the modal
    const selectedValues = interaction.fields.getStringSelectValues('bulk_sell_select');

    if (!selectedValues || selectedValues.length === 0) {
      await interaction.editReply({ content: '❌ No items were selected.' });
      return;
    }

    // Parse selected values: "itemId-quantity" format
    const items = selectedValues.map(val => {
      const [id, amount] = val.split('-');
      return { itemId: parseInt(id, 10), amount: parseInt(amount, 10) };
    }).filter(i => !isNaN(i.itemId) && !isNaN(i.amount) && i.amount > 0);

    if (items.length === 0) {
      await interaction.editReply({ content: '❌ Could not parse selected items.' });
      return;
    }

    try {
      const res = await apiFetch(Routes.bulkSell(), {
        method: 'POST',
        body: JSON.stringify({ discordId: interaction.user.id, items }),
      });

      const body = await res.json();

      if (!res.ok || !body.success) {
        await interaction.editReply({ content: formatError(body.error ?? 'Bulk sell failed.') });
        return;
      }

      await interaction.editReply({
        content: `🪙 **Bulk Sell Complete!** ${body.message}\n💰 New Balance: **${body.newBalance?.toLocaleString() ?? '???'}** gold`
      });
    } catch (err: any) {
      await interaction.editReply({ content: formatError(err.message, err.code) });
    }
  }

  public cooldown(): number { return 5; }
  public isAuthorOnly(): boolean { return true; }
}