import { IGameDocument } from './games.types';

export async function setLastUpdated(this: IGameDocument): Promise<void> {
  const now = new Date();
  if (!this.lastUpdated || this.lastUpdated < now) {
    this.lastUpdated = now;
    await this.save();
  }
}

export function getGameCard(this: IGameDocument): string {
  const card = [
    `<a href="${this.image}">👾</a><b>${this.name}</b>`,
    `<b>Release:</b> ${this.releaseDate.toLocaleString()}`,
    `<b>DRM:</b> ${this.drm}`,
  ];
  return card.join('\n');
}
