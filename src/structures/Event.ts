import IExecutable from "../interfaces/IExecutable";

export default abstract class Event implements IExecutable {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  public abstract execute(...args: any[]): Promise<void>;

  public abstract isOnce(): boolean;

  public getName(): string {
    return this.name;
  }
}