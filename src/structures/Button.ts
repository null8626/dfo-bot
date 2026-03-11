import IExecutable from "../interfaces/IExecutable";
import ICooldown from "../interfaces/ICooldown";
import { ButtonInteraction, Client } from "discord.js";

export default abstract class Button implements IExecutable, ICooldown {
  public customId: string;

  constructor(customId: string) {
    this.customId = customId;
  }

  public abstract isAuthorOnly(): boolean;

  public abstract execute(interaction: ButtonInteraction, client: Client, args?: string[] | null): Promise<void>;

  public abstract cooldown(): number;
}