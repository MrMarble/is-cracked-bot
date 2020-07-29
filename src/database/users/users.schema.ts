import { findByUserName, findOneOrCreate } from './users.statics';

import { Schema } from 'mongoose';
import { setLastUpdated } from './users.methods';

const UserSchema = new Schema({
  userId: Number,
  firstName: String,
  lastName: String,
  userName: String,
  subscriptions: [{ type: Schema.Types.ObjectId, ref: 'Game' }],
  dateOfRegistry: Date,
  dateOfEntry: {
    type: Date,
    default: new Date(),
  },
  lastUpdated: {
    type: Date,
    default: new Date(),
  },
});

UserSchema.statics.findByUserName = findByUserName;
UserSchema.statics.findOneOrCreate = findOneOrCreate;

UserSchema.methods.setLastUpdated = setLastUpdated;

export default UserSchema;
