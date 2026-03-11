import { createCanvas, GlobalFonts } from '@napi-rs/canvas';
import { IInventoryItem } from '../interfaces/IInventoryJSON';
import { IPlayerJSON } from '../interfaces/IPlayerJSON';
import { IItemJSON } from '../interfaces/IItemJSON';
import ItemManager from '../managers/ItemManager';
import { join } from 'path';

// Load OS-agnostic emoji font
try { GlobalFonts.registerFromPath(join(process.cwd(), 'assets', 'NotoColorEmoji-Regular.ttf'), 'NotoEmoji'); } catch(e) {}

const RARITY_COLORS: Record<string, string> = {
    Common: '#b0b0b0', Uncommon: '#2ecc71', Rare: '#3498db',
    Elite: '#e67e22', Epic: '#9b59b6', Legendary: '#f1c40f',
    Divine: '#00e5ff', Exotic: '#ff00cc'
};

const SLOT_ICONS: Record<string, string> = {
    'Head': '⛑️', 'Necklace': '📿', 'Chest': '👕', 'MainHand': '⚔️',
    'Legs': '👖', 'OffHand': '🛡️', 'Hands': '🧤', 'RingA': '💍', 
    'RingB': '💍', 'Feet': '👢', 'Pet': '🐾', 'Special': '✨'
};

const CATEGORY_ICONS: Record<string, string> = {
    'Weapon': '⚔️', 'Armor': '🛡️', 'Accessory': '💍',
    'Consumable': '🧪', 'Material': '🪵', 'Collectible': '🗿'
};

function getItemIcon(item: any) {
    if (item.slot && SLOT_ICONS[item.slot]) return SLOT_ICONS[item.slot];
    return CATEGORY_ICONS[item.type] || '📦';
}

export default class InventoryImageBuilder {
  /**
   * Build an inventory grid image.
   * @param chunk      - Slice of inventory items for this page
   * @param player     - Player data from the API
   * @param itemCache  - Optional item lookup map. If omitted, falls back to ItemManager (main thread only).
   */
  public static async build(
    chunk: IInventoryItem[],
    player: IPlayerJSON,
    itemCache?: Record<number, IItemJSON>
  ): Promise<Buffer> {
    // Resolve item lookup: use provided cache if available, otherwise fall back to ItemManager
    const getItem = (id: number): IItemJSON | undefined => {
      if (itemCache) return itemCache[id];
      return ItemManager.get(id);
    };

    const canvas = createCanvas(900, 720);
    const ctx = canvas.getContext('2d');

    // 1. Background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const bgGradient = ctx.createLinearGradient(0, 0, 0, 200);
    bgGradient.addColorStop(0, '#1a1a1a');
    bgGradient.addColorStop(1, '#111111');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, 200);

    // 2. Header
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';

    // 1. Draw the emoji explicitly using the NotoEmoji font
    ctx.font = '32px "NotoEmoji", sans-serif';
    ctx.fillText('💼', 40, 60);

    // 2. Switch back to standard font for the alphabetical text
    ctx.font = 'bold 32px sans-serif';
    const titleText = `${player.username.toUpperCase()}'S INVENTORY`;
    // Start at X: 85 to leave room for the briefcase, and cap width at 500px to prevent overlap
    ctx.fillText(titleText, 85, 60, 500);

    // 3. Draw the Player Stats (Level & Gold)
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    const goldFormatted = new Intl.NumberFormat('en-US').format(player.coins || 0);
    ctx.fillText(`LVL ${player.level}  •  ${goldFormatted} GOLD`, 860, 55);

    // Header divider line
    ctx.beginPath();
    ctx.moveTo(40, 80);
    ctx.lineTo(860, 80);
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff1a';
    ctx.stroke();

    // 3. Grid Settings (5 cols x 3 rows = 15 items)
    const startX = 40;
    const startY = 110;
    const boxW = 150;
    const boxH = 180;
    const gapX = 17.5;
    const gapY = 20;

    for (let i = 0; i < chunk.length; i++) {
        const invEntry = chunk[i];
        const itemData = getItem(invEntry.itemId);
        
        const col = i % 5;
        const row = Math.floor(i / 5);
        const boxX = startX + col * (boxW + gapX);
        const boxY = startY + row * (boxH + gapY);

        // Box BG
        ctx.fillStyle = '#00000066';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 12);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff1a';
        ctx.stroke();

        if (itemData) {
            const color = RARITY_COLORS[itemData.rarity] || '#ffffff';

            // Top Left: Lock Icon (Reverted back to original)
            if (invEntry.isLocked) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '14px "NotoEmoji", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText('🔒', boxX + 10, boxY + 25);
            }

            // Top Right: Quantity Pill
            ctx.fillStyle = '#00000099';
            ctx.beginPath();
            ctx.roundRect(boxX + boxW - 40, boxY + 10, 30, 18, 4);
            ctx.fill();
            
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`x${invEntry.quantity}`, boxX + boxW - 25, boxY + 23);

            // Center: Emoji
            ctx.fillStyle = '#ffffff';
            ctx.font = '45px "NotoEmoji", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(getItemIcon(itemData), boxX + boxW / 2, boxY + 85);

            // Bottom Panel BG
            ctx.fillStyle = '#00000099';
            ctx.beginPath();
            ctx.roundRect(boxX, boxY + 110, boxW, 70, [0, 0, 12, 12]); 
            ctx.fill();

            // Item Name (Shifted slightly up)
            ctx.fillStyle = color;
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(itemData.name, boxX + boxW / 2, boxY + 132, boxW - 10);

            // Type & Level (Shifted slightly up)
            ctx.fillStyle = '#6b7280'; // text-gray-500
            ctx.font = '10px sans-serif';
            ctx.fillText(`${itemData.type.toUpperCase()}  |  LVL ${itemData.level}`, boxX + boxW / 2, boxY + 148);

            // Item ID (NEW: Bottom line)
            ctx.fillStyle = '#4b5563'; // text-gray-600 (slightly darker for subtlety)
            ctx.font = '10px monospace';
            ctx.fillText(`ID: ${itemData.itemId}`, boxX + boxW / 2, boxY + 164);

            // Bottom Rarity Border
            ctx.beginPath();
            ctx.moveTo(boxX + 10, boxY + boxH);
            ctx.lineTo(boxX + boxW - 10, boxY + boxH);
            ctx.lineWidth = 4;
            ctx.strokeStyle = color;
            ctx.stroke();
        } else {
            // Unknown Item Fallback
            ctx.fillStyle = '#374151';
            ctx.font = 'italic 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Unknown Item', boxX + boxW / 2, boxY + boxH / 2);
        }
    }

    return canvas.toBuffer('image/png');
  }
}