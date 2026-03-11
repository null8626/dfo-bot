import { ModalSubmitInteraction, Client } from "discord.js";
import IExecutable from "../interfaces/IExecutable";
import ICooldown from "../interfaces/ICooldown";

export default abstract class ModalSubmit implements IExecutable, ICooldown {
  public customId: string;

  constructor(customId: string) {
    this.customId = customId;
  }

  public abstract execute(interaction: ModalSubmitInteraction, client: Client, args?: string[] | null): Promise<void>;

  public abstract isAuthorOnly(): boolean;

  public abstract cooldown(): number;
}