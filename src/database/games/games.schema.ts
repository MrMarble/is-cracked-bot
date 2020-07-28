import {
  crackDateStr,
  getGameCard,
  isCracked,
  lastUpdateDateStr,
  releaseDateStr,
  setLastUpdated,
} from './games.methods';

import { Schema } from 'mongoose';
import { findByName } from './games.statics';

const GameSchema = new Schema({
  title: String,
  releaseDate: Date,
  crackDate: Date,
  protections: [String],
  groups: [String],
  slug: String,
  image: String,
  isAAA: Boolean,
  links: {},
  prices: [Number],
  platforms: [String],
  dateOfEntry: {
    type: Date,
    default: new Date(),
  },
  lastUpdated: {
    type: Date,
    default: new Date(),
  },
});

GameSchema.statics.findByName = findByName;

GameSchema.methods.setLastUpdated = setLastUpdated;
GameSchema.methods.getGameCard = getGameCard;
GameSchema.methods.isCracked = isCracked;
GameSchema.methods.crackDateStr = crackDateStr;
GameSchema.methods.releaseDateStr = releaseDateStr;
GameSchema.methods.lastUpdateDateStr = lastUpdateDateStr;

export default GameSchema;
