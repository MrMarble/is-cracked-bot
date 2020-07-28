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
    `<a href="${this.image}">👾</a> <b>${this.name}</b><br>`,
    `<b>🗓 Release${
      this.releaseDate.getTime() < Date.now() ? 'd' : ''
    }:</b>\t${this.releaseDateStr()}`,
    `<b>🔒 Protection:</b>\t${this.protection}`,
    `<b>🏴‍☠️ Cracked:</b>\t${this.isCracked() ? '✅' : '❌'}`,
    this.isCracked() && `<b>🗓 Crack Date:</b>\t${this.crackDateStr()}`,
    this.isCracked() && `<b>☠️ Cracked by:</b>\t${this.sceneGroups}`,
  ];
  return card.filter((param) => !!param).join('\n');
}

export function isCracked(this: IGameDocument): boolean {
  return !!this.crackDate;
}

export function releaseDateStr(this: IGameDocument): string {
  const mm = (this.releaseDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = this.releaseDate.getDate().toString().padStart(2, '0');
  return `${dd}/${mm}/${this.releaseDate.getFullYear()}`;
}

export function crackDateStr(this: IGameDocument): string {
  const mm = (this.crackDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = this.crackDate.getDate().toString().padStart(2, '0');
  return `${dd}/${mm}/${this.crackDate.getFullYear()}`;
}
