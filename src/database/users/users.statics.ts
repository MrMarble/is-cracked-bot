import { IUserDocument, IUserModel } from './users.types';

export async function findOneOrCreate(
  this: IUserModel,
  {
    userId,
    userName,
    firstName,
  }: { userId: number; userName?: string; firstName?: string },
): Promise<IUserDocument> {
  const record = await this.findOne({ userId, userName, firstName });
  if (record) {
    return record;
  } else {
    return this.create({ userId, firstName, userName });
  }
}
export async function findByUserName(
  this: IUserModel,
  userName: string,
): Promise<IUserDocument[]> {
  return this.find({ username: { $eq: userName } });
}
