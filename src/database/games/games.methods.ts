import { IGameDocument } from './games.types';

export async function setLastUpdated(this: IGameDocument): Promise<void> {
  const now = new Date();
  if (!this.lastUpdated || this.lastUpdated < now) {
    this.lastUpdated = now;
    await this.save();
  }
}
