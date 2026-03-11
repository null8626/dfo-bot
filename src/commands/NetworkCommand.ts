import { 
  ChatInputCommandInteraction, 
  Client, 
  Colors, 
  EmbedBuilder, 
  MessageFlags, 
  ContainerBuilder
} from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import PaginatorBuilder from "../utilities/PaginatorBuilder";

const options = [
  { name: 'Overview', value: 'overview' },
  { name: 'Shard', value: 'shard' },
  { name: 'Guild', value: 'guild' },
];

export default class NetworkCommand extends SlashCommand {
  constructor() {
    super('network', 'Track all shards and guilds the bot is connected to', 'Moderator');

    this.data.addStringOption((o) => o.setName('type').setDescription('Select a view type').setChoices(options).setRequired(true));
    this.data.addStringOption((o) => o.setName('id').setDescription("Enter a Shard ID or Guild ID. Use 'all' to view everything.").setRequired(false));
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    const choice = interaction.options.getString('type', true);
    const id = interaction.options.getString('id') || 'all'; // Default to 'all' if left blank

    switch (choice) {
      case 'overview': {
        const shards = await this.getShards(client);
        const totalGuilds = shards.reduce((acc, s) => acc + s.guilds, 0);
        const totalUsers = shards.reduce((acc, s) => acc + s.users, 0);
        const avgPing = shards.reduce((acc, s) => acc + s.ping, 0) / shards.length;

        // --- COMPONENTS V2: CONTAINER BUILDER ---
        const container = new ContainerBuilder()
          .setAccentColor(Colors.Blurple) // Replaces the embed color stripe!
          .addTextDisplayComponents(text => text.setContent(`# 🌐 Global Network Overview`))
          .addSeparatorComponents(sep => sep.setDivider(true))
          .addTextDisplayComponents(text => text.setContent(
            `**Total Shards:** \`${shards.length}\`\n**Total Guilds:** \`${totalGuilds.toLocaleString()}\`\n**Total Users:** \`${totalUsers.toLocaleString()}\`\n**Average Latency:** \`${Math.round(avgPing)}ms\``
          ));

        // Note: You MUST pass MessageFlags.IsComponentsV2 when sending display components
        await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        break;
      }

      case 'shard': {
        const shards = await this.getShards(client);

        if (id.toLowerCase() === 'all') {
          const ITEMS_PER_PAGE = 10;
          const pages: EmbedBuilder[] = [];

          for (let i = 0; i < shards.length; i += ITEMS_PER_PAGE) {
            const chunk = shards.slice(i, i + ITEMS_PER_PAGE);
            let descriptionText = '';

            for (const shard of chunk) {
              descriptionText += `💎 **Shard ID:** \`${shard.id}\` | **Ping:** \`${shard.ping}ms\`\n`;
              descriptionText += `└ **Guilds:** \`${shard.guilds.toLocaleString()}\` | **Users:** \`${shard.users.toLocaleString()}\`\n\n`;
            }

            pages.push(new EmbedBuilder().setColor(Colors.Blue).setTitle('Network Manager: Shards').setDescription(descriptionText));
          }

          const paginator = new PaginatorBuilder()
            .setPages(pages)
            .setTargetUser(interaction.user.id)
            .setIdleTimeout(60_000);

          await paginator.start(interaction);
          return;
        } else {
          // Specific Shard Lookup using V2 Components
          const targetShard = shards.find(s => s.id.toString() === id);
          if (!targetShard) {
            await interaction.editReply({ content: `❌ No shard could be found with the ID: \`${id}\`` });
            return;
          }

          const uptimeMins = Math.floor((targetShard.uptime || 0) / 60000);
          const uptimeHours = Math.floor(uptimeMins / 60);

          const container = new ContainerBuilder()
            .setAccentColor(Colors.Blue)
            .addTextDisplayComponents(text => text.setContent(`# 💎 Detailed Shard: [${targetShard.id}]`))
            .addSeparatorComponents(sep => sep.setDivider(true))
            .addTextDisplayComponents(text => text.setContent(
              `**Status:** \`Online\`\n**Ping:** \`${targetShard.ping}ms\`\n**Guilds Hosted:** \`${targetShard.guilds.toLocaleString()}\`\n**Users Tracked:** \`${targetShard.users.toLocaleString()}\`\n**Uptime:** \`${uptimeHours}h ${uptimeMins % 60}m\``
            ));

          await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
        break;
      }

      case 'guild': {
        const guilds = await this.getGuilds(client);

        if (id.toLowerCase() === 'all') {
          const ITEMS_PER_PAGE = 10;
          const pages: EmbedBuilder[] = [];

          for (let i = 0; i < guilds.length; i += ITEMS_PER_PAGE) {
            const chunk = guilds.slice(i, i + ITEMS_PER_PAGE);
            let descriptionText = '';

            for (const guild of chunk) {
              descriptionText += `🛡️ **${guild.name}** (ID: \`${guild.id}\`)\n`;
              descriptionText += `└ **Shard:** \`${guild.shardId}\` | **Members:** \`${guild.memberCount.toLocaleString()}\`\n\n`;
            }

            pages.push(new EmbedBuilder().setColor(Colors.Purple).setTitle('Network Manager: Guilds').setDescription(descriptionText));
          }

          const paginator = new PaginatorBuilder()
            .setPages(pages)
            .setTargetUser(interaction.user.id)
            .setIdleTimeout(60_000);

          await paginator.start(interaction);
          return;
        } else {
          // Specific Guild Lookup using V2 Components
          const targetGuild = guilds.find(g => g.id === id);
          if (!targetGuild) {
            await interaction.editReply({ content: `❌ No guild could be found with the ID: \`${id}\`` });
            return;
          }

          const joinedTimestamp = targetGuild.joinedAt ? `<t:${Math.floor(targetGuild.joinedAt / 1000)}:R>` : 'Unknown';

          const container = new ContainerBuilder()
            .setAccentColor(Colors.Purple)
            .addTextDisplayComponents(text => text.setContent(`# 🛡️ Guild Details\n**${targetGuild.name}**`))
            .addSeparatorComponents(sep => sep.setDivider(true))
            .addTextDisplayComponents(text => text.setContent(
              `**Guild ID:** \`${targetGuild.id}\`\n**Hosted on Shard:** \`${targetGuild.shardId}\`\n**Total Members:** \`${targetGuild.memberCount.toLocaleString()}\`\n**Owner ID:** \`${targetGuild.ownerId}\`\n**Joined Bot:** ${joinedTimestamp}`
            ));

          await interaction.editReply({ components: [container], flags: MessageFlags.IsComponentsV2 });
        }
        break;
      }
    }
  }

  // --- HELPER METHODS ---
  
  /**
   * Reaches across all processes (if sharded) to gather high-level stats about every active shard.
   */
  private async getShards(client: Client) {
    if (client.shard) {
      const results = await client.shard.broadcastEval(c => ({
        id: c.shard?.ids[0] ?? 0,
        ping: c.ws.ping,
        guilds: c.guilds.cache.size,
        users: c.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        uptime: c.uptime
      }));
      return results;
    } else {
      // Fallback if running as a single process (No Sharding Manager)
      return [{
        id: 0,
        ping: client.ws.ping,
        guilds: client.guilds.cache.size,
        users: client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0),
        uptime: client.uptime
      }];
    }
  }

  /**
   * Reaches across all processes to build a unified list of every single guild the bot is in.
   */
  private async getGuilds(client: Client) {
    if (client.shard) {
      const results = await client.shard.broadcastEval(c => 
        c.guilds.cache.map(g => ({
          id: g.id,
          name: g.name,
          memberCount: g.memberCount,
          shardId: c.shard?.ids[0] ?? 0,
          ownerId: g.ownerId,
          joinedAt: g.joinedTimestamp
        }))
      );
      // Flatten the array of arrays from the different shards into one massive array
      return results.flat();
    } else {
      return client.guilds.cache.map(g => ({
        id: g.id,
        name: g.name,
        memberCount: g.memberCount,
        shardId: 0,
        ownerId: g.ownerId,
        joinedAt: g.joinedTimestamp
      }));
    }
  }

  public isGlobalCommand(): boolean {
    return false; // Assuming you only want this registered in your private Staff/Hub server
  }

  public cooldown(): number {
    return 5; 
  }
}