import { AnySelectMenuInteraction, Client } from "discord.js";
import IExecutable from "../interfaces/IExecutable";
import ICooldown from "../interfaces/ICooldown";

export default abstract class SelectMenu implements IExecutable, ICooldown {
  public customId: string;

  constructor(customId: string) {
    this.customId = customId;
  }

  public abstract isAuthorOnly(): boolean;

  public abstract execute(interaction: AnySelectMenuInteraction, client: Client, args?: string[] | null): Promise<void>;

  public abstract cooldown(): number;
}