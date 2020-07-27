import { getGameCard, setLastUpdated } from './games.methods';

import { Schema } from 'mongoose';
import { findByName } from './games.statics';

const GameSchema = new Schema({
  name: String,
  releaseDate: Date,
  crackDate: Date,
  drm: [String],
  sceneGroup: String,
  slug: String,
  image: String,
  isAAA: Boolean,
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

export default GameSchema;
