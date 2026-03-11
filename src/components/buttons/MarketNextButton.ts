import { ButtonInteraction, Client } from "discord.js";
import Button from "../../structures/Button";
import { handleMarketPage } from "./MarketPrevButton";

export default class MarketNextButton extends Button {
  constructor() { super('mkt_next'); }

  public async execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void> {
    await interaction.deferUpdate();
    await handleMarketPage(interaction, args, 1);
  }

  public isAuthorOnly(): boolean { return true; }
  public cooldown(): number { return 2; }
}