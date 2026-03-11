import { ButtonBuilder, ButtonStyle, ChannelType, ChatInputCommandInteraction, Client, ContainerBuilder, MessageFlags } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import logger from "../utilities/Logger";

export default class TestCommand extends SlashCommand {
  constructor() {
    super('test', 'dev command', 'Developer');

    this.data.addChannelOption((o) => o.setName('channel').addChannelTypes(ChannelType.GuildText).setDescription('Select a channel').setRequired(true));
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    const channel = interaction.options.getChannel('channel', true, [ChannelType.GuildText]);

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        (textDisplay) =>
          textDisplay.setContent("You can use the buttons below to adventure instead of running those pesky application commands! This is made to be an easier way to play the game passively through Discord."),
        (textDisplay) =>
          textDisplay.setContent("-# If you want to know how to get a message like this set up in your Discord server you can reach out to the developer in the official Discord server!")
      )
      .addActionRowComponents(
        (row) =>
          row.addComponents(
            new ButtonBuilder().setCustomId('explore').setLabel('Explore').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('attack').setLabel('Attack').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId('flee').setLabel('Flee').setStyle(ButtonStyle.Secondary),
          )
      );

    try {
      await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 });
      await interaction.reply({ content: `Sent message to ${channel}` });
    } catch (error) {
      logger.error(error);
      await interaction.editReply({ content: `Error: ${error}` });
      return;
    }
  }

  public isGlobalCommand(): boolean {
    return false;
  }

  public cooldown(): number {
    return 5;
  }
}