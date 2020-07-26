import { IUserDocument, IUserModel } from './users.types';

import UserSchema from './users.schema';
import { model } from 'mongoose';

export const UserModel = model<IUserDocument>('user', UserSchema) as IUserModel;
