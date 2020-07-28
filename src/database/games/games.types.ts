import { Document, Model } from 'mongoose';

export interface IGame {
  name: string;
  releaseDate: Date;
  crackDate?: Date;
  protection: Array<string>;
  sceneGroups?: Array<string>;
  slug: string;
  image: string;
  isAAA: boolean;
  links: { [key: string]: string };
  prices?: Array<number>;
  platforms?: Array<string>;
  dateOfEntry?: Date;
  lastUpdated?: Date;
}

export interface IGameDocument extends IGame, Document {
  setLastUpdated: (this: IGameDocument) => Promise<void>;
  getGameCard: (this: IGameDocument) => string;
  isCracked: (this: IGameDocument) => boolean;
  crackDateStr: (this: IGameDocument) => string;
  releaseDateStr: (this: IGameDocument) => string;
}
export interface IGameModel extends Model<IGameDocument> {
  findByName: (this: IGameModel, name: string) => Promise<IGameDocument[]>;
}
