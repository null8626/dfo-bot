import { AutocompleteInteraction, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import IExecutable from "../interfaces/IExecutable";
import ICooldown from "../interfaces/ICooldown";
import { Client } from "discord.js";

export default abstract class SlashCommand implements IExecutable, ICooldown {
  protected name: string;
  protected description: string;
  protected category: string;
  protected data: SlashCommandBuilder;

  constructor(name: string, description: string, category: string) {
    this.name = name;
    this.description = description;
    this.category = category;
    this.data = new SlashCommandBuilder()
      .setName(name)
      .setDescription(description);
  }

  public abstract execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void>;

  public abstract cooldown(): number;

  public abstract isGlobalCommand(): boolean;

  public async autocomplete?(interaction: AutocompleteInteraction, client: Client): Promise<void>;

  public getData(): SlashCommandBuilder {
    return this.data;
  }

  public getName(): string {
    return this.name;
  }

  public getDescription(): string {
    return this.description;
  }

  public getCategory(): string {
    return this.category;
  }
}