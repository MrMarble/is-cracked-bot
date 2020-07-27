import { IGameDocument, IGameModel } from './games.types';

export async function findByName(
  this: IGameModel,
  name: string,
): Promise<IGameDocument[]> {
  return this.find({ name: { $regex: `^${name}`, $options: 'i' } });
}
