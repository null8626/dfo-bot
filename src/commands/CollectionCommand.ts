import { ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import { ICollectionJSON } from "../interfaces/ICollectionJSON";
import ItemManager from "../managers/ItemManager";
import PaginatorBuilder from "../utilities/PaginatorBuilder";
import Routes from "../utilities/Routes";

export default class CollectionCommand extends SlashCommand {
  constructor() {
    super('collection', 'View your or another player\'s item collection', 'General');

    this.data.addUserOption((o) => 
        o.setName('user')
         .setDescription('Select a user')
         .setRequired(false)
    );
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();
    
    const getHeaders = () => ({
      'Authorization': `Bearer ${process.env.BOT_TOKEN}`,
      'Content-Type': 'application/json',
    });
    
    const targetUser = interaction.options.getUser('user', false) ?? interaction.user;

    // 1. Fetch the data from your SvelteKit API
    const res = await fetch(Routes.player(targetUser.id), {
      headers: Routes.HEADERS(),
    });

    if (res.status === 404) {
      await interaction.editReply({ content: `${targetUser.username} hasn't made any DFO player data!` });
      return;
    }

    if (!res.ok) throw new Error('API Error');

    const { data } = await res.json();
    const collection = data.collection as ICollectionJSON;

    // 2. Safely parse the "Map" from JSON into an array of [itemId, quantity]
    let collectionItems: [string, number][] = [];
    if (collection?.items) {
        // If it comes through as a plain object from JSON
        if (typeof collection.items === 'object' && !Array.isArray(collection.items)) {
            collectionItems = Object.entries(collection.items);
        } else if (collection.items instanceof Map) {
            collectionItems = Array.from(collection.items.entries());
        }
    }

    // 3. Handle Empty Collection
    if (collectionItems.length === 0) {
      await interaction.editReply({ content: `📖 **${targetUser.username}** hasn't discovered any items yet.` });
      return;
    }

    // Sort items by ID or Quantity (Optional, here sorting by quantity descending)
    collectionItems.sort((a, b) => b[1] - a[1]);

    // 4. Prepare the Embeds (Chunking items 10 per page)
    const ITEMS_PER_PAGE = 10;
    const pages: EmbedBuilder[] = [];

    // Overall stats to display at the top of every page
    const statsHeader = `**Unique Items Found:** ${collection.uniqueItemsFound}\n**Total Items Collected:** ${collection.totalItemsCollected}\n\n`;

    for (let i = 0; i < collectionItems.length; i += ITEMS_PER_PAGE) {
      // Slice out a chunk of 10 items
      const chunk = collectionItems.slice(i, i + ITEMS_PER_PAGE);
      
      let descriptionText = statsHeader;

      // Map each item in the chunk using ItemManager
      for (const [itemIdString, quantity] of chunk) {
        const itemId = parseInt(itemIdString, 10);
        const itemData = ItemManager.get(itemId);
        
        if (itemData) {
          // Format: ✨ **Item Name** (x5) | Rarity
          descriptionText += `✨ **${itemData.name}** (x${quantity})\n`;
          descriptionText += `└ *${itemData.rarity} ${itemData.type}*\n\n`;
        } else {
          // Fallback if the ItemManager cache is missing this item
          descriptionText += `✨ **Unknown Item #${itemId}** (x${quantity})\n\n`;
        }
      }

      // Create the embed for this specific chunk
      const pageEmbed = new EmbedBuilder()
        .setTitle(`📖 ${targetUser.username}'s Collection`)
        .setColor('#8b5cf6') // Purple for a mystical collection book!
        .setDescription(descriptionText)
        .setThumbnail(targetUser.displayAvatarURL({ forceStatic: false }));

      pages.push(pageEmbed);
    }

    // 5. Send to the Paginator
    const paginator = new PaginatorBuilder()
      .setPages(pages)
      .setTargetUser(interaction.user.id) // Only the person who ran the command can flip pages
      .setIdleTimeout(60_000); // Buttons disable after 60 seconds of inactivity

    // Deploy the paginator!
    await paginator.start(interaction);
  }

  public isGlobalCommand(): boolean {
    return true;
  }

  public cooldown(): number {
    return 5;
  }
}