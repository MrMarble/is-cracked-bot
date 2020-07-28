import {
  crackDateStr,
  getGameCard,
  isCracked,
  releaseDateStr,
  setLastUpdated,
} from './games.methods';

import { Schema } from 'mongoose';
import { findByName } from './games.statics';

const GameSchema = new Schema({
  name: String,
  releaseDate: Date,
  crackDate: Date,
  protection: [String],
  sceneGroups: [String],
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

export default GameSchema;
