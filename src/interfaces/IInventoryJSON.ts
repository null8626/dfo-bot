export interface IInventoryItem {
  userId: string;
  itemId: number;
  quantity: number;
  isLocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}