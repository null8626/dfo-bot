import { ChatInputCommandInteraction, Client, EmbedBuilder } from "discord.js";
import SlashCommand from "../structures/SlashCommand";
import PaginatorBuilder from "../utilities/PaginatorBuilder";

const GUIDE_COLOR = 0x10b981;

function buildPages(): EmbedBuilder[] {
  const pages: EmbedBuilder[] = [];

  // --- PAGE 1: Getting Started ---
  pages.push(new EmbedBuilder()
    .setColor(GUIDE_COLOR)
    .setTitle('⚔️ Dragon\'s Fall Online — Player Guide')
    .setDescription(
      '**Welcome, Adventurer!**\n\n' +
      'Dragon\'s Fall Online is a text-based MMORPG where you explore zones, fight enemies, collect loot, and grow your character. Everything syncs between Discord and the [web dashboard](https://capi.gg/dfo).\n\n' +
      '**Quick Start:**\n' +
      '> 1. `/register` — Create your character\n' +
      '> 2. `/explore` — Take a step in your current zone\n' +
      '> 3. `/inventory` — Manage gear and equip items\n' +
      '> 4. `/profile` — View stats and spend skill points\n' +
      '> 5. `/travel` — Move to harder zones as you level up\n\n' +
      '**Core Loop:** Explore → Find loot/enemies → Equip better gear → Travel to harder zones → Repeat'
    )
  );

  // --- PAGE 2: Exploration & Zones ---
  pages.push(new EmbedBuilder()
    .setColor(GUIDE_COLOR)
    .setTitle('🗺️ Exploration & Zones')
    .setDescription(
      'Each time you `/explore`, one of three things happens based on your zone\'s encounter rates:\n\n' +
      '**⚔️ Combat Encounter** — An enemy spawns. You must `/attack` or `/flee`.\n' +
      '**🎒 Item Drop** — You find an item on the ground (added to inventory).\n' +
      '**🌿 Safe Travel** — You gain XP and gold passively.\n\n' +
      'Higher-tier zones have more combat and better loot, but enemies are tougher.\n\n' +
      '**Zone Tiers:**\n' +
      '> Tier 1 (Lvl 1-20) — The Apprentice: Low combat, high XP to help you grow\n' +
      '> Tier 2 (Lvl 25-75) — The Adventurer: Balanced risk and reward\n' +
      '> Tier 3 (Lvl 100-200) — The Hero: Legendary rarity drops unlock\n' +
      '> Tier 4 (Lvl 250-500) — The Ascendant: +25% to +40% enemy stats\n' +
      '> Tier 5 (Lvl 500-1000) — The Cosmic: Nightmare difficulty\n\n' +
      '**Out-leveling a zone?** If you\'re 5+ levels above a zone\'s max level, XP and gold from safe travel drops to nearly zero. Move on!'
    )
  );

  // --- PAGE 3: Combat Mechanics ---
  pages.push(new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle('⚔️ Combat Mechanics')
    .setDescription(
      '**Damage Formula:**\n' +
      '```\nDamage = ATK × variance(0.9-1.1) × 1.2 × critMult × mitigation\n```\n' +
      '**Mitigation (Defense):**\n' +
      '```\nReduction = DEF / (DEF + enemyLevel^1.15 × 8)\nCapped at 85% reduction\n```\n' +
      'This means defense has diminishing returns — you can never fully negate damage, but high DEF still makes a huge difference.\n\n' +
      '**Critical Hits:**\n' +
      '> Base crit chance: 5% • Base crit damage: 150% (1.5×)\n' +
      '> Both can be increased through item affixes\n\n' +
      '**Dodge:**\n' +
      '> Base: 0% (affix only) • Capped at 75%\n' +
      '> Penalty: If the enemy is higher level, dodge is reduced by 5% per level gap\n\n' +
      '**Enemy Prefixes:**\n' +
      '> `Weak` — 0.8× rewards\n' +
      '> `Furious / Giant / Armored` — 1.4× rewards\n' +
      '> `Elite` — 1.65× rewards (hardest, most rewarding)'
    )
  );

  // --- PAGE 4: Stats & Leveling ---
  pages.push(new EmbedBuilder()
    .setColor(0xeab308)
    .setTitle('📊 Stats & Leveling')
    .setDescription(
      '**Base Stats:**\n' +
      '> **HP** = 50 + ((level - 1) × 5) + equipment HP\n' +
      '> **ATK** = Base ATK (from skill points) + equipment ATK\n' +
      '> **DEF** = Base DEF (from skill points) + equipment DEF\n\n' +
      '**Leveling Up:**\n' +
      '```\nXP Required = floor(50 × level^1.3)\n```\n' +
      '> Level 5 → 430 XP | Level 10 → 997 XP | Level 50 → 9,125 XP\n' +
      '> Each level grants **+2 skill points** to allocate into ATK or DEF\n' +
      '> HP is fully restored on level up\n\n' +
      '**Skill Points:**\n' +
      '> View your profile with `/profile` and tap **Spend Skill Points** if you have unspent points\n' +
      '> Choose between ATK (more damage) or DEF (more survivability)\n' +
      '> This is permanent — choose wisely!\n\n' +
      '**Tip:** A balanced build (roughly 60/40 ATK/DEF) works well for most content. Pure ATK builds can struggle in high-tier zones where enemies hit hard.'
    )
  );

  // --- PAGE 5: Items & Affixes ---
  pages.push(new EmbedBuilder()
    .setColor(0x9b59b6)
    .setTitle('🎒 Items, Rarity & Affixes')
    .setDescription(
      '**Rarity Tiers (from most to least common):**\n' +
      '> ⬜ Common (60%) → 🟢 Uncommon (25%) → 🔵 Rare (10%) → 🟠 Elite (3.5%)\n' +
      '> 🟣 Epic (1.3%) → 🟡 Legendary (0.19%) → 🔷 Divine (0.01%)\n\n' +
      '**Item Types:**\n' +
      '> Weapons, Armor, Accessories — Equippable gear with stats\n' +
      '> Consumables — Heal HP, grant XP, or grant gold (one-time use)\n' +
      '> Materials & Collectibles — Sell for gold or add to your collection\n\n' +
      '**Affixes** are bonus modifiers found on equipment:\n' +
      '> ⚡ **Crit Chance** — Increases critical hit probability\n' +
      '> 💥 **Crit Damage** — Increases critical hit multiplier\n' +
      '> 💨 **Dodge** — Chance to avoid enemy attacks entirely\n' +
      '> 🩸 **Life Steal** — Heal for a % of damage dealt\n' +
      '> 🪙 **Gold Find** — Bonus % gold from all sources\n' +
      '> ✨ **XP Bonus** — Bonus % XP from all sources\n' +
      '> 🔥 **Thorns** — Flat damage reflected back to attacker\n\n' +
      '**Tip:** Higher difficulty zones increase the drop weight of rare items. The `difficultyScalar` boosts rare+ weights and reduces common drops.'
    )
  );

  // --- PAGE 6: Economy & Market ---
  pages.push(new EmbedBuilder()
    .setColor(0xf59e0b)
    .setTitle('🏪 Economy & Market')
    .setDescription(
      '**Gold Sources:**\n' +
      '> Safe travel (passive) • Killing enemies • Selling items\n\n' +
      '**Gold Sinks:**\n' +
      '> Buying from the Global Market\n\n' +
      '**Global Market** (`/market`):\n' +
      '> `/market browse` — Search listings with filters (rarity, type, price)\n' +
      '> `/market sell <item> <qty> <price>` — List items for other players\n' +
      '> `/market listings` — View and cancel your active listings\n\n' +
      '**Bulk Actions** (`/inventory`):\n' +
      '> Bulk Sell — Sell multiple items at once for their base value\n' +
      '> Bulk Collect — Archive multiple items into your collection book\n\n' +
      '**Collection Book** (`/collection`):\n' +
      '> Collect every unique item in the game. Items are removed from inventory and permanently archived. Great for clearing inventory while preserving a record of your finds.\n\n' +
      '**Tip:** Check the market before selling rare items to NPCs — other players may pay significantly more than the base sell value.'
    )
  );

  // --- PAGE 7: Do's and Don'ts ---
  pages.push(new EmbedBuilder()
    .setColor(0x3b82f6)
    .setTitle('✅ Do\'s and ❌ Don\'ts')
    .setDescription(
      '**✅ DO:**\n' +
      '> Lock valuable items so you don\'t accidentally sell them\n' +
      '> Equip gear close to your level — underleveled gear gives weak stats\n' +
      '> Move to new zones when you out-level your current one\n' +
      '> Spend skill points as you get them — unspent points are wasted potential\n' +
      '> Use `/flee` if an enemy is too strong — dying costs progress\n' +
      '> Check the market for upgrades before entering harder zones\n\n' +
      '**❌ DON\'T:**\n' +
      '> Don\'t stay in a low zone for too long — XP penalties kick in at 5+ levels over the zone cap\n' +
      '> Don\'t sell everything — some items are worth more on the market\n' +
      '> Don\'t ignore defense entirely — high ATK means nothing if you die in one hit\n' +
      '> Don\'t use automation or macros — this results in a permanent ban and data wipe\n' +
      '> Don\'t attempt to RMT (sell items for real money) — zero tolerance policy'
    )
  );

  return pages;
}

export default class GuideCommand extends SlashCommand {
  constructor() {
    super('guide', 'A comprehensive guide to playing Dragon\'s Fall Online', 'General');
  }

  public async execute(interaction: ChatInputCommandInteraction, client: Client): Promise<void> {
    await interaction.deferReply();

    const pages = buildPages();

    const paginator = new PaginatorBuilder()
      .setPages(pages)
      .setTargetUser(interaction.user.id)
      .setIdleTimeout(180_000); // 3 minutes for reading

    await paginator.start(interaction);
  }

  public isGlobalCommand(): boolean { return true; }
  public cooldown(): number { return 5; }
}